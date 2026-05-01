"""Background scheduler — processes active email campaigns at daily_limit/day."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.email_campaign import EmailCampaign
from app.models.email_campaign_contact import EmailCampaignContact
from app.models.gmail_connection import GmailConnection
from app.models.refresh_token import RefreshToken

logger = logging.getLogger(__name__)

_scheduler = AsyncIOScheduler()


async def _process_campaigns() -> None:
    """Send pending campaign contacts up to each campaign's daily_limit."""
    from app.services import gmail_oauth_service

    db = SessionLocal()
    try:
        active = db.scalars(
            select(EmailCampaign).where(EmailCampaign.status == "active")
        ).all()

        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        for campaign in active:
            conn = db.scalar(
                select(GmailConnection).where(
                    GmailConnection.user_id == campaign.user_id,
                    GmailConnection.is_connected.is_(True),
                )
            )
            if not conn:
                logger.warning("Campaign %s: no Gmail connection, skipping.", campaign.id)
                continue

            # Count how many already sent today
            sent_today = db.query(EmailCampaignContact).filter(
                EmailCampaignContact.campaign_id == campaign.id,
                EmailCampaignContact.status == "sent",
                EmailCampaignContact.sent_at >= today_start,
            ).count()

            remaining_quota = campaign.daily_limit - sent_today
            if remaining_quota <= 0:
                logger.debug("Campaign %s: daily quota reached.", campaign.id)
                continue

            pending = db.scalars(
                select(EmailCampaignContact)
                .where(
                    EmailCampaignContact.campaign_id == campaign.id,
                    EmailCampaignContact.status == "pending",
                )
                .limit(remaining_quota)
            ).all()

            if not pending:
                # All contacts processed — mark complete
                campaign.status = "completed"
                campaign.completed_at = datetime.now(timezone.utc)
                db.commit()
                logger.info("Campaign %s completed.", campaign.id)
                continue

            try:
                access_token = await gmail_oauth_service.get_valid_access_token(db, campaign.user_id)
            except Exception as exc:
                logger.error("Campaign %s: failed to get access token: %s", campaign.id, exc)
                continue

            from app.models.user import User
            from_name = conn.gmail_address
            user = db.get(User, campaign.user_id)
            if user and user.full_name:
                from_name = user.full_name

            for contact in pending:
                try:
                    await gmail_oauth_service.send_email(
                        access_token=access_token,
                        from_email=conn.gmail_address,
                        from_name=from_name,
                        to_email=contact.recipient_email,
                        to_name=contact.recipient_name,
                        subject=campaign.subject,
                        body=campaign.body,
                    )
                    contact.status = "sent"
                    contact.sent_at = datetime.now(timezone.utc)
                    campaign.total_sent += 1
                    logger.debug("Campaign %s: sent to %s", campaign.id, contact.recipient_email)
                except Exception as exc:
                    contact.status = "failed"
                    contact.error_message = str(exc)[:500]
                    campaign.total_failed += 1
                    logger.warning("Campaign %s: failed to send to %s: %s", campaign.id, contact.recipient_email, exc)

                db.commit()

    except Exception as exc:
        logger.exception("Scheduler error: %s", exc)
    finally:
        db.close()


async def _cleanup_refresh_tokens() -> None:
    """Delete expired or revoked refresh tokens older than 37 days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=37)
    db = SessionLocal()
    try:
        result = db.execute(
            delete(RefreshToken).where(
                (RefreshToken.expires_at < datetime.now(timezone.utc)) | RefreshToken.revoked.is_(True),
                RefreshToken.created_at < cutoff,
            )
        )
        db.commit()
        if result.rowcount:
            logger.info("Cleaned up %d stale refresh tokens.", result.rowcount)
    except Exception as exc:
        logger.exception("Refresh token cleanup error: %s", exc)
    finally:
        db.close()


def start_scheduler() -> None:
    _scheduler.add_job(_process_campaigns, "cron", minute="0")  # every hour on the hour
    _scheduler.add_job(_cleanup_refresh_tokens, "cron", hour="3", minute="0")  # daily at 03:00 UTC
    _scheduler.start()
    logger.info("Campaign scheduler started.")


def stop_scheduler() -> None:
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Campaign scheduler stopped.")
