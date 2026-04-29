"""Smart Send API routes — Gmail OAuth + AI letter generation + send + campaigns."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.models.email_campaign import EmailCampaign
from app.models.email_campaign_contact import EmailCampaignContact
from app.models.enums import UserRole
from app.models.mailing_list import Recipient, RecipientList
from app.models.user import User
from app.schemas.smart_send import (
    CampaignCreate,
    CampaignResponse,
    GenerateLetterRequest,
    GenerateLetterResponse,
    GmailStatusResponse,
    RecipientListItem,
    SendHistoryItem,
    SendRequest,
    SendResponse,
)
from app.services import cover_letter_service, gmail_oauth_service

router = APIRouter(prefix="/smart-send", tags=["smart-send"])


# ── Gmail OAuth ────────────────────────────────────────────────────────────────

@router.get("/gmail/auth")
def gmail_auth(
    current_user: User = Depends(get_current_user),
):
    """Return the Google OAuth authorization URL."""
    try:
        auth_url = gmail_oauth_service.get_authorization_url(current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {"auth_url": auth_url}


@router.get("/gmail/callback")
async def gmail_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """Handle Google OAuth callback: exchange code, store tokens, redirect to frontend."""
    settings = get_settings()
    frontend_url = f"{settings.frontend_url}/dashboard/smart-send"

    try:
        user_id = gmail_oauth_service.verify_oauth_state(state)
    except ValueError:
        return RedirectResponse(f"{frontend_url}?gmail_error=invalid_state")

    try:
        tokens = await gmail_oauth_service.exchange_code(code)
        access_token = tokens["access_token"]
        refresh_token = tokens.get("refresh_token", "")
        expires_in = tokens.get("expires_in", 3600)

        from datetime import datetime, timedelta, timezone
        expiry = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
        gmail_address = await gmail_oauth_service.get_gmail_address(access_token)

        gmail_oauth_service.upsert_connection(db, user_id, gmail_address, refresh_token, expiry)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Gmail OAuth callback error: %s", exc, exc_info=True)
        return RedirectResponse(f"{frontend_url}?gmail_error=token_exchange_failed")

    return RedirectResponse(f"{frontend_url}?gmail_connected=1")


@router.get("/gmail/status", response_model=GmailStatusResponse)
def gmail_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = gmail_oauth_service.get_connection(db, current_user.id)
    if not conn or not conn.is_connected:
        return GmailStatusResponse(is_connected=False)
    return GmailStatusResponse(is_connected=True, gmail_address=conn.gmail_address)


@router.delete("/gmail/disconnect", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def gmail_disconnect(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gmail_oauth_service.disconnect(db, current_user.id)


# ── Generate Letter ────────────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerateLetterResponse, status_code=status.HTTP_201_CREATED)
async def generate_letter(
    req: GenerateLetterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        letter = await cover_letter_service.generate_cover_letter(
            db=db,
            user_id=current_user.id,
            job_title=req.job_title,
            company_name=req.company_name,
            job_description=req.job_description,
            resume_id=req.resume_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return GenerateLetterResponse(**letter)


# ── Send ───────────────────────────────────────────────────────────────────────

@router.post("/send", response_model=SendResponse, status_code=status.HTTP_201_CREATED)
async def send_email(
    req: SendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = gmail_oauth_service.get_connection(db, current_user.id)
    if not conn or not conn.is_connected:
        raise HTTPException(status_code=400, detail="Gmail account not connected")

    try:
        access_token = await gmail_oauth_service.get_valid_access_token(db, current_user.id)
        await gmail_oauth_service.send_email(
            access_token=access_token,
            from_email=conn.gmail_address,
            from_name=current_user.full_name or conn.gmail_address,
            to_email=req.recipient_email,
            to_name=req.recipient_name,
            subject=req.subject,
            body=req.body,
        )
        record = gmail_oauth_service.save_history(
            db=db,
            user_id=current_user.id,
            job_title=req.job_title,
            company_name=req.company_name,
            subject=req.subject,
            body=req.body,
            recipient_email=req.recipient_email,
            recipient_name=req.recipient_name,
            status="sent",
            error_message=None,
            resume_id=req.resume_id,
        )
    except Exception as exc:
        error_msg = str(exc)[:500]
        record = gmail_oauth_service.save_history(
            db=db,
            user_id=current_user.id,
            job_title=req.job_title,
            company_name=req.company_name,
            subject=req.subject,
            body=req.body,
            recipient_email=req.recipient_email,
            recipient_name=req.recipient_name,
            status="failed",
            error_message=error_msg,
            resume_id=req.resume_id,
        )
        raise HTTPException(status_code=502, detail=f"Failed to send email: {error_msg}")

    return SendResponse(
        id=record.id,
        status=record.status,
        recipient_email=record.recipient_email,
        sent_at=record.sent_at,
    )


# ── History ────────────────────────────────────────────────────────────────────

@router.get("/history", response_model=list[SendHistoryItem])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return gmail_oauth_service.list_history(db, current_user.id)


# ── Recipient Lists (shared, owned by admin) ───────────────────────────────────

@router.get("/recipient-lists", response_model=list[RecipientListItem])
def get_recipient_lists(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[RecipientListItem]:
    rows = db.scalars(
        select(RecipientList)
        .join(User, RecipientList.user_id == User.id)
        .where(User.role == UserRole.ADMIN)
        .order_by(RecipientList.name)
    ).all()
    result = []
    for rl in rows:
        contacts = db.scalars(
            select(Recipient).where(Recipient.list_id == rl.id, Recipient.is_active.is_(True))
        ).all()
        result.append(RecipientListItem(
            id=rl.id,
            name=rl.name,
            description=rl.description,
            total_count=rl.total_count,
            contacts=[{"id": c.id, "email": c.email, "full_name": c.full_name, "company_name": c.company_name} for c in contacts],
        ))
    return result


# ── Campaigns ──────────────────────────────────────────────────────────────────

@router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    body: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    conn = gmail_oauth_service.get_connection(db, current_user.id)
    if not conn or not conn.is_connected:
        raise HTTPException(status_code=400, detail="Gmail account not connected.")

    rl = db.get(RecipientList, body.list_id)
    if not rl:
        raise HTTPException(status_code=404, detail="Recipient list not found.")

    contacts = db.scalars(
        select(Recipient).where(Recipient.list_id == body.list_id, Recipient.is_active.is_(True))
    ).all()
    if not contacts:
        raise HTTPException(status_code=400, detail="The selected list has no active contacts.")

    campaign = EmailCampaign(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        list_id=body.list_id,
        list_name=rl.name,
        resume_id=body.resume_id,
        subject=body.subject,
        body=body.body,
        status="active",
        daily_limit=body.daily_limit,
        total_contacts=len(contacts),
        started_at=datetime.now(timezone.utc),
    )
    db.add(campaign)
    db.flush()

    for c in contacts:
        db.add(EmailCampaignContact(
            id=str(uuid.uuid4()),
            campaign_id=campaign.id,
            recipient_email=c.email,
            recipient_name=c.full_name,
            company_name=c.company_name,
            status="pending",
        ))

    db.commit()
    db.refresh(campaign)
    return _campaign_response(campaign)


@router.get("/campaigns", response_model=list[CampaignResponse])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CampaignResponse]:
    campaigns = db.scalars(
        select(EmailCampaign).where(EmailCampaign.user_id == current_user.id).order_by(EmailCampaign.created_at.desc())
    ).all()
    return [_campaign_response(c) for c in campaigns]


@router.patch("/campaigns/{campaign_id}/pause", response_model=CampaignResponse)
def pause_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign = _get_user_campaign(db, campaign_id, current_user.id)
    if campaign.status != "active":
        raise HTTPException(status_code=400, detail="Only active campaigns can be paused.")
    campaign.status = "paused"
    db.commit()
    db.refresh(campaign)
    return _campaign_response(campaign)


@router.patch("/campaigns/{campaign_id}/resume", response_model=CampaignResponse)
def resume_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign = _get_user_campaign(db, campaign_id, current_user.id)
    if campaign.status != "paused":
        raise HTTPException(status_code=400, detail="Only paused campaigns can be resumed.")
    campaign.status = "active"
    db.commit()
    db.refresh(campaign)
    return _campaign_response(campaign)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_user_campaign(db: Session, campaign_id: str, user_id: str) -> EmailCampaign:
    c = db.scalar(select(EmailCampaign).where(EmailCampaign.id == campaign_id, EmailCampaign.user_id == user_id))
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    return c


def _campaign_response(c: EmailCampaign) -> CampaignResponse:
    remaining = c.total_contacts - c.total_sent - c.total_failed
    estimated_days = max(0, -(-remaining // c.daily_limit)) if c.daily_limit > 0 else 0
    return CampaignResponse(
        id=c.id,
        list_name=c.list_name,
        subject=c.subject,
        status=c.status,
        daily_limit=c.daily_limit,
        total_contacts=c.total_contacts,
        total_sent=c.total_sent,
        total_failed=c.total_failed,
        estimated_days_remaining=estimated_days,
        started_at=c.started_at,
        completed_at=c.completed_at,
        created_at=c.created_at,
    )
