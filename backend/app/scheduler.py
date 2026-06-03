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

# ── User-facing error messages ─────────────────────────────────────────────────

_MSG_DISCONNECTED   = "انتهت صلاحية اتصال Gmail أو تم قطعه. أعد الربط من إعدادات Gmail."
_MSG_QUOTA          = "تجاوزت حد الإرسال اليومي في Gmail. ستستأنف الحملة تلقائياً غداً."
_MSG_REJECTED       = "رفض Gmail الرسالة. تحقق من عنوان البريد الإلكتروني للمستلم."
_MSG_SERVER         = "خطأ مؤقت في خادم Gmail. ستُعاد المحاولة في الدورة القادمة."
_MSG_GENERIC        = "فشل الإرسال. ستُعاد المحاولة تلقائياً."
_MSG_NO_CONNECTION  = "لم يُعثر على اتصال Gmail نشط. أعد الربط من إعدادات Gmail وأعد تشغيل الحملة."
_MSG_STUCK          = "توقفت الحملة لفترة طويلة دون تقدم. تحقق من اتصال Gmail وأعد تشغيل الحملة."


def _friendly_send_error(raw: str) -> str:
    """Translate a raw Gmail API / network exception to a safe user-facing message."""
    r = raw.lower()
    if any(k in r for k in ("401", "unauthorized", "invalid_grant", "token", "refresh")):
        return _MSG_DISCONNECTED
    if any(k in r for k in ("429", "ratelimitexceeded", "too many request", "daily sending quota")):
        return _MSG_QUOTA
    if any(k in r for k in ("400", "invalid", "bad request", "recipient", "malformed")):
        return _MSG_REJECTED
    if any(k in r for k in ("500", "502", "503", "internal error", "backend error")):
        return _MSG_SERVER
    if any(k in r for k in ("timeout", "connection", "network", "read error")):
        return _MSG_SERVER
    return _MSG_GENERIC


def _friendly_campaign_error(raw: str) -> str:
    """Translate a raw campaign-level error to a safe user-facing message."""
    r = raw.lower()
    if "stuck" in r or "no progress" in r or "inactiv" in r:
        return _MSG_STUCK
    if "no active gmail" in r or "not connected" in r or "gmail not connected" in r:
        return _MSG_NO_CONNECTION
    if any(k in r for k in ("token", "refresh", "invalid_grant", "unauthorized", "401")):
        return _MSG_DISCONNECTED
    return _MSG_NO_CONNECTION


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
                campaign.error_message = _MSG_STUCK
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
                campaign.error_message = _MSG_NO_CONNECTION
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
                campaign.status = "error"
                campaign.error_message = _MSG_DISCONNECTED
                db.commit()
                logger.error("Campaign %s: token refresh failed: %s", campaign.id, exc)
                continue

            from app.models.user import User
            from_name = conn.gmail_address
            user = db.get(User, campaign.user_id)
            if user and user.full_name:
                from_name = user.full_name

            # Load resume attachment once per campaign batch
            attachment_bytes: bytes | None = None
            attachment_filename: str | None = None
            if campaign.resume_id:
                from app.models.resume import Resume
                from app.services.storage.factory import get_storage
                resume = db.get(Resume, campaign.resume_id)
                if resume and resume.storage_key:
                    try:
                        attachment_bytes = get_storage().download(resume.storage_key)
                        attachment_filename = resume.source_filename or f"resume.{resume.file_type or 'pdf'}"
                    except Exception as exc:
                        logger.warning("Campaign %s: could not load resume attachment: %s", campaign.id, exc)

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
                        attachment_bytes=attachment_bytes,
                        attachment_filename=attachment_filename,
                    )
                    contact.status = "sent"
                    contact.sent_at = now
                    campaign.total_sent += 1
                    campaign.last_sent_at = now
                    sent_count += 1
                    logger.debug("Campaign %s: sent to %s", campaign.id, contact.recipient_email)
                except Exception as exc:
                    contact.status = "failed"
                    contact.error_message = _friendly_send_error(str(exc))
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
