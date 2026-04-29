"""Smart Send API routes — Gmail OAuth + AI letter generation + send."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.models.user import User
from app.schemas.smart_send import (
    GenerateLetterRequest,
    GenerateLetterResponse,
    GmailStatusResponse,
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


@router.delete("/gmail/disconnect", status_code=status.HTTP_204_NO_CONTENT)
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
