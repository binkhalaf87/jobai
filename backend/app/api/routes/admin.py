"""Admin routes — user management and platform stats."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_admin
from app.api.deps.db import get_db
from app.models.enums import UserRole, UsageEventType, WalletTransactionDirection, WalletTransactionStatus, WalletTransactionType
from app.models.usage_log import UsageLog
from app.services.audit_log import emit as audit_emit
from app.models.interview import InterviewSession
from app.models.plan import Plan
from app.models.promo_code import PromoCode
from app.models.promo_code_usage import PromoCodeUsage
from app.models.resume import Resume
from app.models.send_history import SendHistory
from app.models.user import User
from app.models.user_wallet import UserWallet
from app.models.mailing_list import Recipient, RecipientList
from app.models.wallet_transaction import WalletTransaction
from app.models.gmail_connection_request import GmailConnectionRequest
from app.models.payment_order import PaymentOrder
from app.services.email_service import send_gmail_approval_email, send_gmail_rejection_email
from app.services.paymob_webhook_service import manually_activate_payment_order
from app.services.storage import get_storage
from app.schemas.admin import (
    AdminAnalyticsResponse,
    AdminContactCreate,
    AdminContactItem,
    AdminContactsBulk,
    AdminActivityItem,
    AdminActivityResponse,
    AdminGmailRequestItem,
    AdminGmailRequestReject,
    AdminListCreate,
    AdminListItem,
    AdminMonthlyRevenue,
    AdminPlanItem,
    AdminPromoCodeCreate,
    AdminPromoCodeItem,
    AdminPromoCodePatch,
    AdminPromoCodeUsageItem,
    AdminStatsResponse,
    AdminUserActivityItem,
    AdminUserItem,
    AdminUserPatch,
    AdminUserProfileResponse,
    AdminPaymentOrderItem,
    AdminUserResumeItem,
    AdminUserServiceSummaryItem,
    AdminUsersResponse,
    AdminVisitorPoint,
    AdminWalletAdjust,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Stats ──────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminStatsResponse:
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    active_users = db.scalar(select(func.count()).select_from(User).where(User.is_active.is_(True))) or 0
    jobseekers = db.scalar(select(func.count()).select_from(User).where(User.role == UserRole.JOBSEEKER)) or 0
    recruiters = db.scalar(select(func.count()).select_from(User).where(User.role == UserRole.RECRUITER)) or 0
    admins = db.scalar(select(func.count()).select_from(User).where(User.role == UserRole.ADMIN)) or 0
    total_resumes = db.scalar(select(func.count()).select_from(Resume)) or 0
    total_interviews = db.scalar(select(func.count()).select_from(InterviewSession)) or 0
    total_sends = db.scalar(select(func.count()).select_from(SendHistory).where(SendHistory.status == "sent")) or 0

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        jobseekers=jobseekers,
        recruiters=recruiters,
        admins=admins,
        total_resumes=total_resumes,
        total_interviews=total_interviews,
        total_sends=total_sends,
    )


# ── Activity feed ─────────────────────────────────────────────────────────────

@router.get("/activity", response_model=AdminActivityResponse)
def get_activity(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminActivityResponse:
    rows = db.execute(
        select(UsageLog, User)
        .join(User, UsageLog.user_id == User.id)
        .order_by(UsageLog.created_at.desc())
        .limit(15)
    ).all()

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    visitors_last_24h = db.scalar(
        select(func.count(func.distinct(UsageLog.user_id))).where(
            UsageLog.event_type == UsageEventType.AUTH_LOGIN,
            UsageLog.created_at >= since,
        )
    ) or 0

    items = [
        AdminActivityItem(
            event_type=log.event_type,
            user_name=user.full_name,
            user_email=user.email,
            detail=log.detail,
            created_at=log.created_at,
        )
        for log, user in rows
    ]

    return AdminActivityResponse(recent_activity=items, visitors_last_24h=visitors_last_24h)


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_analytics(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminAnalyticsResponse:
    from sqlalchemy import cast, Date, Integer, text

    now = datetime.now(timezone.utc)

    # ── Monthly revenue (last 12 months) ──────────────────────────────────────
    twelve_months_ago = now - timedelta(days=365)
    revenue_rows = db.execute(
        text("""
            SELECT
                to_char(date_trunc('month', paid_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
                SUM(amount_minor) AS total_minor,
                COUNT(*) AS transactions
            FROM payment_orders
            WHERE status = 'paid'
              AND paid_at >= :since
            GROUP BY date_trunc('month', paid_at AT TIME ZONE 'UTC')
            ORDER BY date_trunc('month', paid_at AT TIME ZONE 'UTC')
        """),
        {"since": twelve_months_ago},
    ).fetchall()

    monthly_revenue = [
        AdminMonthlyRevenue(
            month=row.month,
            revenue_sar=round(row.total_minor / 100, 2),
            transactions=row.transactions,
        )
        for row in revenue_rows
    ]

    # ── Visitor trends ────────────────────────────────────────────────────────
    def _daily_visitor_points(since: datetime) -> list[AdminVisitorPoint]:
        rows = db.execute(
            text("""
                SELECT
                    to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS label,
                    COUNT(*) FILTER (WHERE event_type = 'auth_login')    AS logins,
                    COUNT(*) FILTER (WHERE event_type = 'auth_register') AS signups
                FROM usage_logs
                WHERE created_at >= :since
                  AND event_type IN ('auth_login', 'auth_register')
                GROUP BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
                ORDER BY label
            """),
            {"since": since},
        ).fetchall()
        return [AdminVisitorPoint(label=r.label, logins=r.logins, signups=r.signups) for r in rows]

    def _monthly_visitor_points(since: datetime) -> list[AdminVisitorPoint]:
        rows = db.execute(
            text("""
                SELECT
                    to_char(date_trunc('month', created_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS label,
                    COUNT(*) FILTER (WHERE event_type = 'auth_login')    AS logins,
                    COUNT(*) FILTER (WHERE event_type = 'auth_register') AS signups
                FROM usage_logs
                WHERE created_at >= :since
                  AND event_type IN ('auth_login', 'auth_register')
                GROUP BY date_trunc('month', created_at AT TIME ZONE 'UTC')
                ORDER BY label
            """),
            {"since": since},
        ).fetchall()
        return [AdminVisitorPoint(label=r.label, logins=r.logins, signups=r.signups) for r in rows]

    visitor_trends = {
        "7d":   _daily_visitor_points(now - timedelta(days=7)),
        "30d":  _daily_visitor_points(now - timedelta(days=30)),
        "12mo": _monthly_visitor_points(now - timedelta(days=365)),
    }

    return AdminAnalyticsResponse(
        monthly_revenue=monthly_revenue,
        visitor_trends=visitor_trends,
    )


# ── Users list ─────────────────────────────────────────────────────────────────

@router.get("/users", response_model=AdminUsersResponse)
def list_users(
    search: str | None = Query(None),
    role: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminUsersResponse:
    q = select(User)
    if search:
        like = f"%{search}%"
        q = q.where((User.email.ilike(like)) | (User.full_name.ilike(like)))
    if role:
        q = q.where(User.role == role)
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    users = db.scalars(q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()

    items: list[AdminUserItem] = []
    for u in users:
        balance = u.user_wallet.balance_points if u.user_wallet else None
        items.append(AdminUserItem(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            last_login_at=u.last_login_at,
            balance_points=balance,
        ))

    return AdminUsersResponse(total=total, users=items)


# ── Patch user ─────────────────────────────────────────────────────────────────

@router.patch("/users/{user_id}", response_model=AdminUserItem)
def patch_user(
    user_id: str,
    body: AdminUserPatch,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminUserItem:
    if user_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify your own account.")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    changes: dict = {}
    if body.role is not None:
        changes["role"] = {"from": user.role, "to": body.role}
        user.role = body.role
    if body.is_active is not None:
        changes["is_active"] = {"from": user.is_active, "to": body.is_active}
        user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    audit_emit(
        db,
        user_id=admin.id,
        event_type=UsageEventType.ADMIN_USER_UPDATED,
        detail=f"target_user={user_id}",
        event_payload={"changes": changes},
    )
    balance = user.user_wallet.balance_points if user.user_wallet else None
    return AdminUserItem(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        balance_points=balance,
    )


# ── Wallet adjustment ──────────────────────────────────────────────────────────

@router.post("/users/{user_id}/wallet", response_model=dict)
def adjust_wallet(
    user_id: str,
    body: AdminWalletAdjust,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    wallet = user.user_wallet
    if not wallet:
        wallet = UserWallet(id=str(uuid.uuid4()), user_id=user_id, balance_points=0, lifetime_earned_points=0, lifetime_spent_points=0)
        db.add(wallet)
        db.flush()

    balance_before = wallet.balance_points
    balance_after = balance_before + body.points

    if balance_after < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resulting balance cannot be negative.")

    direction = WalletTransactionDirection.CREDIT if body.points > 0 else WalletTransactionDirection.DEBIT
    tx = WalletTransaction(
        id=str(uuid.uuid4()),
        wallet_id=wallet.id,
        user_id=user_id,
        transaction_type=WalletTransactionType.ADJUSTMENT,
        status=WalletTransactionStatus.POSTED,
        direction=direction,
        points=abs(body.points),
        balance_before=balance_before,
        balance_after=balance_after,
        description=body.reason,
        effective_at=datetime.now(timezone.utc),
    )
    db.add(tx)

    wallet.balance_points = balance_after
    if body.points > 0:
        wallet.lifetime_earned_points += body.points
    else:
        wallet.lifetime_spent_points += abs(body.points)

    db.commit()
    audit_emit(
        db,
        user_id=admin.id,
        event_type=UsageEventType.ADMIN_WALLET_ADJUSTED,
        detail=f"target_user={user_id} points={body.points}",
        event_payload={"balance_before": balance_before, "balance_after": balance_after, "reason": body.reason},
    )
    return {"balance_points": balance_after}


# ── User profile ───────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/profile", response_model=AdminUserProfileResponse)
def get_user_profile(
    user_id: str,
    activity_page: int = Query(1, ge=1),
    activity_page_size: int = Query(50, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminUserProfileResponse:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    balance = user.user_wallet.balance_points if user.user_wallet else None

    activity_q = (
        select(UsageLog)
        .where(
            UsageLog.user_id == user_id,
            UsageLog.event_type != UsageEventType.PAGE_VIEW,
        )
        .order_by(UsageLog.created_at.desc())
    )
    activity_total = db.scalar(select(func.count()).select_from(activity_q.subquery())) or 0
    logs = db.scalars(
        activity_q.offset((activity_page - 1) * activity_page_size).limit(activity_page_size)
    ).all()

    resumes = db.scalars(
        select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc())
    ).all()

    summary_rows = db.execute(
        select(UsageLog.event_type, func.count().label("count"))
        .where(
            UsageLog.user_id == user_id,
            UsageLog.event_type != UsageEventType.PAGE_VIEW,
        )
        .group_by(UsageLog.event_type)
        .order_by(func.count().desc())
    ).all()

    return AdminUserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        balance_points=balance,
        activity=[
            AdminUserActivityItem(
                id=log.id,
                event_type=log.event_type,
                detail=log.detail,
                credits_used=log.credits_used,
                created_at=log.created_at,
            )
            for log in logs
        ],
        activity_total=activity_total,
        resumes=[AdminUserResumeItem.model_validate(r) for r in resumes],
        services_summary=[
            AdminUserServiceSummaryItem(event_type=row.event_type, count=row.count)
            for row in summary_rows
        ],
    )


# ── Resume file access (admin) ────────────────────────────────────────────────

_MIME_TYPES: dict[str, str] = {
    "pdf":  "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc":  "application/msword",
}


@router.get("/users/{user_id}/resumes/{resume_id}/file", response_model=None)
def get_admin_resume_file(
    user_id: str,
    resume_id: str,
    inline: bool = Query(False),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Stream the resume file for admin download/preview.

    Pass ?inline=true to set Content-Disposition: inline (browser preview).
    Default is attachment (force download).
    """
    resume = db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id))
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    storage = get_storage()
    key = resume.storage_key or ""
    media_type = _MIME_TYPES.get(resume.file_type or "", "application/octet-stream")
    filename = resume.source_filename or f"{resume_id}.{resume.file_type or 'bin'}"
    disposition = "inline" if inline else f'attachment; filename="{filename}"'

    local_path = storage.get_local_path(key)
    if local_path:
        return FileResponse(
            path=str(local_path),
            media_type=media_type,
            filename=None if inline else filename,
            headers={"Content-Disposition": disposition},
        )

    try:
        data = storage.download(key)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found.") from exc

    return Response(
        content=data,
        media_type=media_type,
        headers={"Content-Disposition": disposition},
    )


# ── Recipient Lists ────────────────────────────────────────────────────────────

@router.get("/lists", response_model=list[AdminListItem])
def list_admin_lists(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminListItem]:
    rows = db.scalars(
        select(RecipientList).where(RecipientList.user_id == admin.id).order_by(RecipientList.created_at.desc())
    ).all()
    return [AdminListItem.model_validate(r) for r in rows]


@router.post("/lists", response_model=AdminListItem, status_code=status.HTTP_201_CREATED)
def create_admin_list(
    body: AdminListCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminListItem:
    rl = RecipientList(
        id=str(uuid.uuid4()),
        user_id=admin.id,
        name=body.name,
        description=body.description,
        source="manual",
        total_count=0,
    )
    db.add(rl)
    db.commit()
    db.refresh(rl)
    return AdminListItem.model_validate(rl)


@router.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_admin_list(
    list_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> None:
    rl = db.scalar(select(RecipientList).where(RecipientList.id == list_id, RecipientList.user_id == admin.id))
    if not rl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found.")
    db.delete(rl)
    db.commit()


@router.get("/lists/{list_id}/contacts", response_model=list[AdminContactItem])
def get_list_contacts(
    list_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminContactItem]:
    rl = db.scalar(select(RecipientList).where(RecipientList.id == list_id, RecipientList.user_id == admin.id))
    if not rl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found.")
    contacts = db.scalars(select(Recipient).where(Recipient.list_id == list_id).order_by(Recipient.created_at)).all()
    return [AdminContactItem.model_validate(c) for c in contacts]


@router.post("/lists/{list_id}/contacts", response_model=AdminContactItem, status_code=status.HTTP_201_CREATED)
def add_contact(
    list_id: str,
    body: AdminContactCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminContactItem:
    rl = db.scalar(select(RecipientList).where(RecipientList.id == list_id, RecipientList.user_id == admin.id))
    if not rl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found.")
    contact = Recipient(
        id=str(uuid.uuid4()),
        list_id=list_id,
        user_id=admin.id,
        email=body.email.lower().strip(),
        full_name=body.full_name,
        company_name=body.company_name,
        job_title=body.job_title,
    )
    db.add(contact)
    rl.total_count += 1
    db.commit()
    db.refresh(contact)
    return AdminContactItem.model_validate(contact)


@router.post("/lists/{list_id}/contacts/bulk", response_model=dict)
def bulk_add_contacts(
    list_id: str,
    body: AdminContactsBulk,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    rl = db.scalar(select(RecipientList).where(RecipientList.id == list_id, RecipientList.user_id == admin.id))
    if not rl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found.")
    added = 0
    for email in body.emails:
        email = email.lower().strip()
        if not email:
            continue
        existing = db.scalar(select(Recipient).where(Recipient.list_id == list_id, Recipient.email == email))
        if existing:
            continue
        db.add(Recipient(id=str(uuid.uuid4()), list_id=list_id, user_id=admin.id, email=email))
        added += 1
    rl.total_count += added
    db.commit()
    return {"added": added}


@router.delete("/lists/{list_id}/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_contact(
    list_id: str,
    contact_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> None:
    contact = db.scalar(select(Recipient).where(Recipient.id == contact_id, Recipient.list_id == list_id))
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found.")
    rl = db.get(RecipientList, list_id)
    db.delete(contact)
    if rl and rl.total_count > 0:
        rl.total_count -= 1
    db.commit()


# ── Gmail Connection Requests ──────────────────────────────────────────────────

@router.get("/gmail-requests", response_model=list[AdminGmailRequestItem])
def list_gmail_requests(
    request_status: str | None = Query(None, alias="status"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminGmailRequestItem]:
    """List all Gmail connection requests, optionally filtered by status."""
    q = select(GmailConnectionRequest, User).join(User, GmailConnectionRequest.user_id == User.id)
    if request_status:
        q = q.where(GmailConnectionRequest.status == request_status)
    rows = db.execute(q.order_by(GmailConnectionRequest.created_at.desc())).all()
    return [
        AdminGmailRequestItem(
            id=req.id,
            user_id=req.user_id,
            user_email=user.email,
            user_name=user.full_name,
            status=req.status,
            rejection_reason=req.rejection_reason,
            created_at=req.created_at,
            reviewed_at=req.reviewed_at,
        )
        for req, user in rows
    ]


@router.post("/gmail-requests/{request_id}/approve", response_model=AdminGmailRequestItem)
def approve_gmail_request(
    request_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminGmailRequestItem:
    req = db.get(GmailConnectionRequest, request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
    if req.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request is not pending.")
    req.status = "approved"
    req.reviewed_at = datetime.now(timezone.utc)
    req.reviewed_by = admin.id
    req.rejection_reason = None
    db.commit()
    db.refresh(req)
    user = db.get(User, req.user_id)
    if user:
        try:
            send_gmail_approval_email(user.email, user.full_name)
        except Exception:
            pass
    return AdminGmailRequestItem(
        id=req.id, user_id=req.user_id,
        user_email=user.email if user else "", user_name=user.full_name if user else None,
        status=req.status, requested_gmail=req.requested_gmail,
        rejection_reason=req.rejection_reason,
        created_at=req.created_at, reviewed_at=req.reviewed_at,
    )


@router.post("/gmail-requests/{request_id}/reject", response_model=AdminGmailRequestItem)
def reject_gmail_request(
    request_id: str,
    body: AdminGmailRequestReject,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminGmailRequestItem:
    req = db.get(GmailConnectionRequest, request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
    if req.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request is not pending.")
    req.status = "rejected"
    req.reviewed_at = datetime.now(timezone.utc)
    req.reviewed_by = admin.id
    req.rejection_reason = body.reason
    db.commit()
    db.refresh(req)
    user = db.get(User, req.user_id)
    if user:
        try:
            send_gmail_rejection_email(user.email, user.full_name, body.reason)
        except Exception:
            pass
    return AdminGmailRequestItem(
        id=req.id, user_id=req.user_id,
        user_email=user.email if user else "", user_name=user.full_name if user else None,
        status=req.status, requested_gmail=req.requested_gmail,
        rejection_reason=req.rejection_reason,
        created_at=req.created_at, reviewed_at=req.reviewed_at,
    )


# ── Plans (read-only) ─────────────────────────────────────────────────────────

@router.get("/plans", response_model=list[AdminPlanItem])
def list_plans(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminPlanItem]:
    plans = db.scalars(select(Plan).order_by(Plan.display_order, Plan.name)).all()
    return [AdminPlanItem.model_validate(p) for p in plans]


# ── Promo Codes ────────────────────────────────────────────────────────────────

def _promo_to_item(promo: PromoCode, plan_name: str | None) -> AdminPromoCodeItem:
    return AdminPromoCodeItem(
        id=promo.id,
        code=promo.code,
        description=promo.description,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        applicable_to=promo.applicable_to,
        plan_id=promo.plan_id,
        plan_name=plan_name,
        max_uses=promo.max_uses,
        uses_count=promo.uses_count,
        max_uses_per_user=promo.max_uses_per_user,
        valid_from=promo.valid_from,
        valid_until=promo.valid_until,
        is_active=promo.is_active,
        created_by_id=promo.created_by_id,
        created_at=promo.created_at,
        updated_at=promo.updated_at,
    )


@router.get("/promotions", response_model=list[AdminPromoCodeItem])
def list_promo_codes(
    is_active: bool | None = Query(None),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminPromoCodeItem]:
    q = select(PromoCode, Plan).outerjoin(Plan, PromoCode.plan_id == Plan.id)
    if is_active is not None:
        q = q.where(PromoCode.is_active.is_(is_active))
    rows = db.execute(q.order_by(PromoCode.created_at.desc())).all()
    return [_promo_to_item(promo, plan.name if plan else None) for promo, plan in rows]


@router.post("/promotions", response_model=AdminPromoCodeItem, status_code=status.HTTP_201_CREATED)
def create_promo_code(
    body: AdminPromoCodeCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminPromoCodeItem:
    code = body.code.strip().upper()
    existing = db.scalar(select(PromoCode).where(PromoCode.code == code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A promo code with this value already exists.")
    promo = PromoCode(
        id=str(uuid.uuid4()),
        code=code,
        description=body.description,
        discount_type=body.discount_type,
        discount_value=body.discount_value,
        applicable_to=body.applicable_to,
        plan_id=body.plan_id,
        max_uses=body.max_uses,
        uses_count=0,
        max_uses_per_user=body.max_uses_per_user,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
        is_active=True,
        created_by_id=admin.id,
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    plan = db.get(Plan, promo.plan_id) if promo.plan_id else None
    audit_emit(
        db,
        user_id=admin.id,
        event_type=UsageEventType.ADMIN_PROMO_CREATED,
        detail=f"code={code}",
        event_payload={"code": code, "discount_type": body.discount_type, "discount_value": body.discount_value},
    )
    return _promo_to_item(promo, plan.name if plan else None)


@router.patch("/promotions/{code_id}", response_model=AdminPromoCodeItem)
def patch_promo_code(
    code_id: str,
    body: AdminPromoCodePatch,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminPromoCodeItem:
    promo = db.get(PromoCode, code_id)
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promo code not found.")
    if body.is_active is not None:
        promo.is_active = body.is_active
    if body.description is not None:
        promo.description = body.description
    if body.max_uses is not None:
        promo.max_uses = body.max_uses
    if body.valid_until is not None:
        promo.valid_until = body.valid_until
    db.commit()
    db.refresh(promo)
    plan = db.get(Plan, promo.plan_id) if promo.plan_id else None
    return _promo_to_item(promo, plan.name if plan else None)


@router.delete("/promotions/{code_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_promo_code(
    code_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> None:
    promo = db.get(PromoCode, code_id)
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promo code not found.")
    if promo.uses_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a code that has been used. Deactivate it instead.",
        )
    audit_emit(
        db,
        user_id=admin.id,
        event_type=UsageEventType.ADMIN_PROMO_DELETED,
        detail=f"code={promo.code}",
    )
    db.delete(promo)
    db.commit()


@router.get("/promotions/{code_id}/usages", response_model=list[AdminPromoCodeUsageItem])
def list_promo_code_usages(
    code_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminPromoCodeUsageItem]:
    promo = db.get(PromoCode, code_id)
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promo code not found.")
    rows = db.execute(
        select(PromoCodeUsage, User)
        .join(User, PromoCodeUsage.user_id == User.id)
        .where(PromoCodeUsage.promo_code_id == code_id)
        .order_by(PromoCodeUsage.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return [
        AdminPromoCodeUsageItem(
            id=usage.id,
            user_id=usage.user_id,
            user_email=user.email,
            user_name=user.full_name,
            payment_order_id=usage.payment_order_id,
            discount_applied_minor=usage.discount_applied_minor,
            created_at=usage.created_at,
        )
        for usage, user in rows
    ]


# ── Payment Orders ────────────────────────────────────────────────────────────

@router.get("/payment-orders", response_model=list[AdminPaymentOrderItem])
def list_payment_orders(
    user_id: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminPaymentOrderItem]:
    """List payment orders with optional filters. Use status=PENDING to find stuck orders."""
    q = (
        select(PaymentOrder, User, Plan)
        .join(User, PaymentOrder.user_id == User.id)
        .join(Plan, PaymentOrder.plan_id == Plan.id)
        .order_by(PaymentOrder.created_at.desc())
        .limit(limit)
    )
    if user_id:
        q = q.where(PaymentOrder.user_id == user_id)
    if status_filter:
        q = q.where(PaymentOrder.status == status_filter)
    rows = db.execute(q).all()
    return [
        AdminPaymentOrderItem(
            id=order.id,
            user_id=order.user_id,
            user_email=user.email,
            plan_code=plan.code,
            plan_name=plan.name,
            order_type=order.order_type.value,
            status=order.status.value,
            amount_minor=order.amount_minor,
            currency=order.currency,
            provider_name=order.provider_name,
            provider_order_id=order.provider_order_id,
            provider_transaction_id=order.provider_transaction_id,
            merchant_reference=order.merchant_reference,
            failure_reason=order.failure_reason,
            paid_at=order.paid_at,
            created_at=order.created_at,
        )
        for order, user, plan in rows
    ]


@router.get("/payment-orders/{order_id}", response_model=AdminPaymentOrderItem)
def get_payment_order(
    order_id: str,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminPaymentOrderItem:
    """Get a single payment order by ID."""
    row = db.execute(
        select(PaymentOrder, User, Plan)
        .join(User, PaymentOrder.user_id == User.id)
        .join(Plan, PaymentOrder.plan_id == Plan.id)
        .where(PaymentOrder.id == order_id)
    ).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment order not found.")
    order, user, plan = row
    return AdminPaymentOrderItem(
        id=order.id,
        user_id=order.user_id,
        user_email=user.email,
        plan_code=plan.code,
        plan_name=plan.name,
        order_type=order.order_type.value,
        status=order.status.value,
        amount_minor=order.amount_minor,
        currency=order.currency,
        provider_name=order.provider_name,
        provider_order_id=order.provider_order_id,
        provider_transaction_id=order.provider_transaction_id,
        merchant_reference=order.merchant_reference,
        failure_reason=order.failure_reason,
        paid_at=order.paid_at,
        created_at=order.created_at,
    )


@router.post("/payment-orders/{order_id}/activate", status_code=status.HTTP_200_OK)
def admin_activate_payment_order(
    order_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Manually activate a payment order (subscription or credits) without a webhook.

    Use when the bank confirms a charge but the Paymob webhook was never received.
    """
    try:
        manually_activate_payment_order(db, order_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    audit_emit(
        db,
        user_id=admin.id,
        event_type=UsageEventType.ADMIN_PROMO_DELETED,  # reuse closest event type for now
        detail=f"manual_activation order_id={order_id}",
    )
    return {"detail": "Payment order activated successfully."}


@router.post("/payment-orders/bulk-activate", status_code=status.HTTP_200_OK)
def admin_bulk_activate_payment_orders(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Activate all PENDING payment orders and send invoice emails.

    Use when the bank confirms charges but Paymob webhooks were never received.
    Returns a summary of activated and failed order IDs.
    """
    from sqlalchemy.orm import selectinload as _sel
    from app.models.enums import PaymentOrderStatus as _POS

    pending_orders = db.scalars(
        select(PaymentOrder)
        .options(_sel(PaymentOrder.plan), _sel(PaymentOrder.subscription))
        .where(PaymentOrder.status == _POS.PENDING)
        .order_by(PaymentOrder.created_at.asc())
    ).all()

    activated: list[str] = []
    already_paid: list[str] = []
    failed: list[dict] = []

    for order in pending_orders:
        try:
            manually_activate_payment_order(db, order.id)
            activated.append(order.id)
            audit_emit(
                db,
                user_id=admin.id,
                event_type=UsageEventType.ADMIN_PROMO_DELETED,
                detail=f"bulk_activation order_id={order.id}",
            )
        except ValueError:
            already_paid.append(order.id)
        except Exception as exc:
            failed.append({"order_id": order.id, "error": str(exc)})

    return {
        "activated": activated,
        "already_paid": already_paid,
        "failed": failed,
        "total_pending": len(pending_orders),
    }
