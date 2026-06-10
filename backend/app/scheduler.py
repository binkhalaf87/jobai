"""Background scheduler — processes active email campaigns at daily_limit/day."""

from __future__ import annotations

import asyncio
import logging
import random
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
                        campaign.status = "error"
                        campaign.error_message = "تعذّر تحميل ملف السيرة الذاتية من التخزين. تحقق من ملف السيرة الذاتية وأعد تشغيل الحملة."
                        db.commit()
                        logger.error("Campaign %s: could not load resume attachment — halting: %s", campaign.id, exc)
                        continue
                else:
                    campaign.status = "error"
                    campaign.error_message = "ملف السيرة الذاتية المرتبط بالحملة غير موجود. أعد إنشاء الحملة واختر سيرة ذاتية."
                    db.commit()
                    logger.error("Campaign %s: resume_id set but resume/storage_key missing.", campaign.id)
                    continue

            sent_count = 0
            for i, contact in enumerate(pending):
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

                # 2-3 minute delay between emails to avoid Gmail rate limits
                if i < len(pending) - 1:
                    delay = random.uniform(120, 180)
                    logger.debug("Campaign %s: waiting %.0fs before next email.", campaign.id, delay)
                    await asyncio.sleep(delay)

            if sent_count > 0:
                logger.info("Campaign %s: sent %d emails this run.", campaign.id, sent_count)

    except Exception as exc:
        logger.exception("Scheduler error: %s", exc)
    finally:
        db.close()


async def _process_marketing_campaigns() -> None:
    """Send pending marketing campaign contacts via Brevo, respecting warm-up daily limits."""
    from app.models.marketing_campaign import MarketingCampaign, MarketingCampaignContact
    from app.services.brevo_service import get_warmup_daily_limit, send_marketing_email

    db = SessionLocal()
    try:
        active = db.scalars(
            select(MarketingCampaign).where(MarketingCampaign.status == "active")
        ).all()

        now = datetime.now(timezone.utc)
        today = now.date()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        for campaign in active:
            # Set warm-up start date on first run
            if campaign.warmup_start_date is None:
                campaign.warmup_start_date = today
                db.commit()

            days_since_start = (today - campaign.warmup_start_date).days + 1
            daily_limit = get_warmup_daily_limit(days_since_start)

            # Update stored daily limit if changed (for UI display)
            if campaign.current_daily_limit != daily_limit:
                campaign.current_daily_limit = daily_limit
                db.commit()

            sent_today = db.query(MarketingCampaignContact).filter(
                MarketingCampaignContact.campaign_id == campaign.id,
                MarketingCampaignContact.status == "sent",
                MarketingCampaignContact.sent_at >= today_start,
            ).count()

            remaining_quota = daily_limit - sent_today
            if remaining_quota <= 0:
                logger.debug("Marketing campaign %s: daily quota reached (%d).", campaign.id, daily_limit)
                continue

            pending = db.scalars(
                select(MarketingCampaignContact)
                .where(
                    MarketingCampaignContact.campaign_id == campaign.id,
                    MarketingCampaignContact.status == "pending",
                )
                .limit(remaining_quota)
            ).all()

            if not pending:
                campaign.status = "completed"
                campaign.completed_at = now
                db.commit()
                logger.info("Marketing campaign %s completed.", campaign.id)
                continue

            # Abort immediately if BREVO_API_KEY is missing — no point iterating contacts
            from app.services.brevo_service import get_brevo_api_key
            if not get_brevo_api_key():
                campaign.status = "error"
                campaign.error_message = "BREVO_API_KEY غير مضبوط في متغيرات البيئة. أضفه في Railway ثم أعد تفعيل الحملة."
                db.commit()
                logger.error("Marketing campaign %s: BREVO_API_KEY not set — marked as error.", campaign.id)
                continue

            sent_count = 0
            for contact in pending:
                send_error = await send_marketing_email(
                    to_email=contact.email,
                    to_name=contact.full_name,
                    subject=campaign.subject,
                    html_content=campaign.html_body,
                    from_name=campaign.from_name,
                    from_email=campaign.from_email,
                )
                if send_error is None:
                    contact.status = "sent"
                    contact.sent_at = now
                    campaign.total_sent += 1
                    campaign.last_sent_at = now
                    sent_count += 1
                else:
                    contact.status = "failed"
                    contact.error_message = send_error
                    campaign.total_failed += 1
                    logger.warning("Marketing campaign %s: send failed — %s", campaign.id, send_error)
                db.commit()

                # Small delay between sends to avoid bursting
                await asyncio.sleep(0.5)

            if sent_count > 0:
                logger.info(
                    "Marketing campaign %s: sent %d/%d today (day %d, limit %d).",
                    campaign.id, sent_today + sent_count, daily_limit, days_since_start, daily_limit,
                )

    except Exception as exc:
        logger.exception("Marketing campaign scheduler error: %s", exc)
    finally:
        db.close()


async def _poll_pending_payments() -> None:
    """Poll Paymob for pending orders older than 5 minutes and activate if paid."""
    from app.models.enums import PaymentOrderStatus
    from app.models.payment_order import PaymentOrder
    from app.services.paymob_webhook_service import verify_and_activate_payment_order

    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
        pending_orders = db.scalars(
            select(PaymentOrder).where(
                PaymentOrder.status.in_([
                    PaymentOrderStatus.PAYMENT_KEY_ISSUED,
                    PaymentOrderStatus.PENDING,
                ]),
                PaymentOrder.created_at < cutoff,
            )
        ).all()

        if not pending_orders:
            return

        logger.info("Payment poller: checking %d pending order(s).", len(pending_orders))
        for order in pending_orders:
            try:
                result = verify_and_activate_payment_order(
                    db,
                    payment_order_id=str(order.id),
                    user_id=str(order.user_id),
                )
                if result == PaymentOrderStatus.PAID:
                    logger.info("Payment poller: activated order %s for user %s.", order.id, order.user_id)
                else:
                    logger.debug("Payment poller: order %s still %s.", order.id, result.value)
            except Exception as exc:
                logger.debug("Payment poller: order %s skipped: %s", order.id, exc)
    except Exception as exc:
        logger.exception("Payment poller error: %s", exc)
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
    _scheduler.add_job(_process_campaigns, "interval", minutes=5)
    _scheduler.add_job(_process_marketing_campaigns, "interval", minutes=5)
    _scheduler.add_job(_poll_pending_payments, "interval", minutes=10)
    _scheduler.add_job(_cleanup_refresh_tokens, "cron", hour="3", minute="0")
    _scheduler.start()
    logger.info("Campaign scheduler started.")


def stop_scheduler() -> None:
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Campaign scheduler stopped.")
