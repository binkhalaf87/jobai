"""Smart Send API routes — SMTP setup + campaign management."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.smart_send import (
    CampaignResponse,
    GenerateLettersRequest,
    GenerateLettersResponse,
    GeneratedLetters,
    SendCampaignCreate,
    SmtpConnectionCreate,
    SmtpConnectionResponse,
)
from app.services import campaign_service
from app.services.smtp_service import (
    delete_smtp_connection,
    get_smtp_connection,
    upsert_smtp_connection,
    verify_smtp_connection,
)

router = APIRouter(prefix="/smart-send", tags=["smart-send"])


# ── SMTP Connection ────────────────────────────────────────────────────────────

@router.get("/smtp", response_model=SmtpConnectionResponse | None)
def get_smtp(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_smtp_connection(db, current_user.id)


@router.post("/smtp", response_model=SmtpConnectionResponse, status_code=status.HTTP_201_CREATED)
def save_smtp(
    data: SmtpConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return upsert_smtp_connection(db, current_user.id, data)


@router.post("/smtp/verify")
def verify_smtp(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success, message = verify_smtp_connection(db, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"ok": True, "message": message}


@router.delete("/smtp", status_code=status.HTTP_204_NO_CONTENT)
def remove_smtp(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not delete_smtp_connection(db, current_user.id):
        raise HTTPException(status_code=404, detail="No SMTP connection found")


# ── Generate Letters ───────────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerateLettersResponse, status_code=status.HTTP_201_CREATED)
async def generate_letters(
    req: GenerateLettersRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        campaign = await campaign_service.create_campaign_with_letters(db, current_user.id, req)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    letters_data = campaign.letters or {}
    return GenerateLettersResponse(
        campaign_id=campaign.id,
        letters=GeneratedLetters(**letters_data),
    )


# ── Confirm & Send (SSE) ───────────────────────────────────────────────────────

@router.post("/campaigns/{campaign_id}/confirm", response_model=CampaignResponse)
def confirm_send(
    campaign_id: str,
    req: SendCampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.campaign_id != campaign_id:
        raise HTTPException(status_code=400, detail="campaign_id mismatch")
    try:
        campaign = campaign_service.confirm_campaign(db, current_user.id, req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return campaign


@router.post("/campaigns/{campaign_id}/send-stream")
async def send_stream(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SSE endpoint — streams send progress events."""
    return StreamingResponse(
        campaign_service.stream_campaign_send(db, current_user.id, campaign_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── Campaign List / Detail ─────────────────────────────────────────────────────

@router.get("/campaigns", response_model=list[CampaignResponse])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return campaign_service.list_campaigns(db, current_user.id)


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = campaign_service.get_campaign(db, current_user.id, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign
