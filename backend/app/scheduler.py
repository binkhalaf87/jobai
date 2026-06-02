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

_STUCK_CAMPAIGN_HOURS = 48


async def _process_campaigns() -> None:
    """Send pending campaign contacts up to each campaign's daily_limit."""
    from app.services import gmail_oauth_service

    db = SessionLocal()
    try:
        active = db.scalars(
            select(EmailCampaign).where(EmailCampaign.status == "active")
        ).all()

        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        stuck_cutoff = now - timedelta(hours=_STUCK_CAMPAIGN_HOURS)

        for campaign in active:
            # Detect stuck campaigns: active for > 48h with no progress
            campaign_created = campaign.created_at
            if campaign_created.tzinfo is None:
                campaign_created = campaign_created.replace(tzinfo=timezone.utc)
            last_activity = campaign.last_sent_at or campaign_created
            if last_activity.tzinfo is None:
                last_activity = last_activity.replace(tzinfo=timezone.utc)

            if last_activity < stuck_cutoff:
                campaign.status = "error"
                campaign.error_message = (
                    f"Campaign stuck: no progress for {_STUCK_CAMPAIGN_HOURS}h. "
                    "Check Gmail connection and re-activate manually."
                )
                db.commit()
                logger.error(
                    "Campaign %s marked as stuck/error after %dh of inactivity.",
                    campaign.id,
                    _STUCK_CAMPAIGN_HOURS,
                )
                continue

            conn = db.scalar(
                select(GmailConnection).where(
                    GmailConnection.user_id == campaign.user_id,
                    GmailConnection.is_connected.is_(True),
                )
            )
            if not conn:
                campaign.status = "error"
                campaign.error_message = "No active Gmail connection found. Please reconnect Gmail and re-activate."
                db.commit()
                logger.error("Campaign %s: no Gmail connection — marked as error.", campaign.id)
                continue

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
                campaign.status = "completed"
                campaign.completed_at = now
                db.commit()
                logger.info("Campaign %s completed.", campaign.id)
                continue

            try:
                access_token = await gmail_oauth_service.get_valid_access_token(db, campaign.user_id)
            except Exception as exc:
                error_msg = f"Gmail token refresh failed: {exc}"
                campaign.status = "error"
                campaign.error_message = error_msg
                db.commit()
                logger.error("Campaign %s: %s", campaign.id, error_msg)
                continue

            from app.models.user import User
            from_name = conn.gmail_address
            user = db.get(User, campaign.user_id)
            if user and user.full_name:
                from_name = user.full_name

            sent_count = 0
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
                    contact.sent_at = now
                    campaign.total_sent += 1
                    campaign.last_sent_at = now
                    sent_count += 1
                    logger.debug("Campaign %s: sent to %s", campaign.id, contact.recipient_email)
                except Exception as exc:
                    contact.status = "failed"
                    contact.error_message = str(exc)[:500]
                    campaign.total_failed += 1
                    logger.warning(
                        "Campaign %s: failed to send to %s: %s",
                        campaign.id,
                        contact.recipient_email,
                        exc,
                    )

                db.commit()

            if sent_count > 0:
                logger.info("Campaign %s: sent %d emails this run.", campaign.id, sent_count)

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
