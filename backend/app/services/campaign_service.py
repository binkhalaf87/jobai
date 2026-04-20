"""Campaign CRUD and SSE-based send execution."""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.smart_send import SendCampaign, SendLog
from app.schemas.smart_send import GenerateLettersRequest, SendCampaignCreate
from app.services import cover_letter_service
from app.services.smtp_service import get_smtp_connection, send_email

logger = logging.getLogger(__name__)


# ── Campaign creation (step 1 — generate letters) ─────────────────────────────

async def create_campaign_with_letters(
    db: Session,
    user_id: str,
    req: GenerateLettersRequest,
) -> SendCampaign:
    letters = await cover_letter_service.generate_cover_letters(
        db=db,
        user_id=user_id,
        job_title=req.job_title,
        company_name=req.company_name,
        job_description=req.job_description,
        resume_id=req.resume_id,
    )

    campaign = SendCampaign(
        id=str(uuid.uuid4()),
        user_id=user_id,
        resume_id=req.resume_id,
        job_title=req.job_title,
        company_name=req.company_name,
        job_description=req.job_description,
        letters=letters,
        status="draft",
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


# ── Campaign send confirmation (step 2) ───────────────────────────────────────

def confirm_campaign(db: Session, user_id: str, req: SendCampaignCreate) -> SendCampaign:
    campaign = (
        db.query(SendCampaign)
        .filter(SendCampaign.id == req.campaign_id, SendCampaign.user_id == user_id)
        .first()
    )
    if not campaign:
        raise ValueError("Campaign not found")
    if campaign.status != "draft":
        raise ValueError(f"Campaign is already {campaign.status}")

    smtp_conn = get_smtp_connection(db, user_id)
    if not smtp_conn:
        raise ValueError("No SMTP connection configured")

    campaign.smtp_connection_id = smtp_conn.id
    campaign.selected_variant = req.selected_variant
    campaign.subject = req.subject
    campaign.body = req.body
    campaign.ad_hoc_recipients = {"items": [r.model_dump() for r in req.recipients]}
    campaign.total_recipients = len(req.recipients)
    db.commit()
    db.refresh(campaign)
    return campaign


# ── SSE streaming send ─────────────────────────────────────────────────────────

async def stream_campaign_send(db: Session, user_id: str, campaign_id: str):
    """
    AsyncGenerator that yields SSE-formatted strings.
    Sends emails one by one and emits progress events.
    """

    def _sse(event: str, data: dict) -> str:
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"

    campaign = (
        db.query(SendCampaign)
        .filter(SendCampaign.id == campaign_id, SendCampaign.user_id == user_id)
        .first()
    )
    if not campaign:
        yield _sse("error", {"message": "Campaign not found"})
        return
    if campaign.status not in ("draft", "failed"):
        yield _sse("error", {"message": f"Campaign is already {campaign.status}"})
        return
    if not campaign.ad_hoc_recipients:
        yield _sse("error", {"message": "No recipients configured"})
        return

    smtp_conn = get_smtp_connection(db, user_id)
    if not smtp_conn:
        yield _sse("error", {"message": "No SMTP connection configured"})
        return

    recipients = campaign.ad_hoc_recipients.get("items", [])
    total = len(recipients)

    # Mark as sending
    campaign.status = "sending"
    campaign.started_at = datetime.now(timezone.utc)
    campaign.sent_count = 0
    campaign.failed_count = 0
    db.commit()

    yield _sse("start", {"total": total, "campaign_id": campaign_id})

    for i, recipient in enumerate(recipients, start=1):
        email = recipient.get("email", "")
        name = recipient.get("name")

        log = SendLog(
            id=str(uuid.uuid4()),
            campaign_id=campaign_id,
            user_id=user_id,
            recipient_email=email,
            recipient_name=name,
            status="pending",
        )
        db.add(log)
        db.commit()

        try:
            # Run blocking SMTP call in thread pool
            await asyncio.get_event_loop().run_in_executor(
                None,
                send_email,
                smtp_conn,
                email,
                name,
                campaign.subject,
                campaign.body,
            )
            log.status = "sent"
            log.sent_at = datetime.now(timezone.utc)
            campaign.sent_count = (campaign.sent_count or 0) + 1
            db.commit()

            yield _sse("progress", {
                "index": i,
                "total": total,
                "email": email,
                "status": "sent",
            })

        except Exception as exc:
            log.status = "failed"
            error_msg = f"{type(exc).__name__}: {exc}" if str(exc) else type(exc).__name__
            log.error_message = error_msg[:500]
            campaign.failed_count = (campaign.failed_count or 0) + 1
            db.commit()
            logger.warning("Failed to send to %s: %s", email, error_msg, exc_info=True)

            yield _sse("progress", {
                "index": i,
                "total": total,
                "email": email,
                "status": "failed",
                "error": error_msg[:200],
            })

        # Small delay to stay inside Gmail rate limits
        await asyncio.sleep(1.2)

    campaign.status = "failed" if (campaign.sent_count or 0) == 0 and (campaign.failed_count or 0) > 0 else "completed"
    campaign.completed_at = datetime.now(timezone.utc)
    db.commit()

    yield _sse("done", {
        "campaign_id": campaign_id,
        "sent": campaign.sent_count,
        "failed": campaign.failed_count,
        "total": total,
    })


# ── List / get ─────────────────────────────────────────────────────────────────

def list_campaigns(db: Session, user_id: str) -> list[SendCampaign]:
    return (
        db.query(SendCampaign)
        .filter(SendCampaign.user_id == user_id)
        .order_by(SendCampaign.created_at.desc())
        .all()
    )


def get_campaign(db: Session, user_id: str, campaign_id: str) -> SendCampaign | None:
    return (
        db.query(SendCampaign)
        .filter(SendCampaign.id == campaign_id, SendCampaign.user_id == user_id)
        .first()
    )
