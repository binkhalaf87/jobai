"""Admin routes — user management and platform stats."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_admin
from app.api.deps.db import get_db
from app.models.enums import UserRole, WalletTransactionDirection, WalletTransactionStatus, WalletTransactionType
from app.models.interview import InterviewSession
from app.models.resume import Resume
from app.models.send_history import SendHistory
from app.models.user import User
from app.models.user_wallet import UserWallet
from app.models.wallet_transaction import WalletTransaction
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserItem,
    AdminUserPatch,
    AdminUsersResponse,
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
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    db.commit()
    db.refresh(user)
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
    _: User = Depends(get_current_admin),
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
    return {"balance_points": balance_after}
