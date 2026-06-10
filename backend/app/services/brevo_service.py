"""Brevo service — SMTP for sending, REST API for analytics."""

from __future__ import annotations

import asyncio
import email.mime.multipart
import email.mime.text
import logging
import os
import smtplib
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_BREVO_BASE = "https://api.brevo.com/v3"


def _get_smtp_config() -> dict[str, str | int] | None:
    host = os.getenv("SYSTEM_SMTP_HOST", "").strip()
    user = os.getenv("SYSTEM_SMTP_USER", "").strip()
    password = os.getenv("SYSTEM_SMTP_PASSWORD", "").strip()
    port = int(os.getenv("SYSTEM_SMTP_PORT", "587"))
    if not (host and user and password):
        return None
    return {"host": host, "port": port, "user": user, "password": password}

# Automatic warm-up schedule: (min_day, max_day, daily_limit)
# Days are counted from warmup_start_date (inclusive, 1-indexed).
_WARMUP_SCHEDULE: list[tuple[int, int, int]] = [
    (1, 3, 500),
    (4, 7, 1_000),
    (8, 14, 3_000),
    (15, 21, 8_000),
    (22, 28, 20_000),
    (29, 9999, 50_000),
]


def get_warmup_daily_limit(days_since_start: int) -> int:
    """Return the daily send limit for the given campaign day (1-indexed)."""
    for min_day, max_day, limit in _WARMUP_SCHEDULE:
        if min_day <= days_since_start <= max_day:
            return limit
    return 500


def get_brevo_api_key() -> str | None:
    return os.getenv("BREVO_API_KEY", "").strip() or None


def _send_smtp_blocking(
    smtp_cfg: dict,
    to_email: str,
    to_name: str | None,
    subject: str,
    html_content: str,
    from_name: str,
    from_email: str,
) -> None:
    """Blocking SMTP send — called inside a thread-pool executor."""
    msg = email.mime.multipart.MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = f"{to_name} <{to_email}>" if to_name else to_email
    msg.attach(email.mime.text.MIMEText(html_content, "html", "utf-8"))

    with smtplib.SMTP(smtp_cfg["host"], smtp_cfg["port"], timeout=20) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_cfg["user"], smtp_cfg["password"])
        server.sendmail(from_email, [to_email], msg.as_string())


async def send_marketing_email(
    to_email: str,
    to_name: str | None,
    subject: str,
    html_content: str,
    from_name: str = "JobAI24",
    from_email: str = "marketing@jobai24.com",
) -> str | None:
    """Send via SMTP relay (Brevo). Returns None on success, error string on failure."""
    smtp_cfg = _get_smtp_config()
    if not smtp_cfg:
        return "SMTP غير مضبوط — تحقق من SYSTEM_SMTP_HOST/USER/PASSWORD في Railway"

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            _send_smtp_blocking,
            smtp_cfg, to_email, to_name, subject, html_content, from_name, from_email,
        )
        return None
    except smtplib.SMTPAuthenticationError as exc:
        logger.error("SMTP auth failed: %s", exc)
        return f"SMTP: خطأ في بيانات الاعتماد — {exc}"
    except smtplib.SMTPRecipientsRefused as exc:
        logger.warning("SMTP recipient refused %s: %s", to_email, exc)
        return f"SMTP: البريد مرفوض — {exc}"
    except Exception as exc:
        logger.error("SMTP send error to %s: %s", to_email, exc)
        return f"SMTP خطأ: {exc}"


def _brevo_headers() -> dict[str, str]:
    return {
        "api-key": get_brevo_api_key() or "",
        "Accept": "application/json",
    }


async def get_email_campaigns(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    """Fetch sent email campaigns from Brevo. Returns {campaigns: [...], count: int}."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            f"{_BREVO_BASE}/emailCampaigns",
            headers=_brevo_headers(),
            params={"limit": limit, "offset": offset, "status": "sent", "sort": "desc"},
        )
    resp.raise_for_status()
    return resp.json()


async def get_campaign_openers(campaign_id: int, limit: int = 500, offset: int = 0) -> dict[str, Any]:
    """Fetch contacts who opened a specific campaign. Returns {items: [...], count: int}."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{_BREVO_BASE}/emailCampaigns/{campaign_id}/reports/opens",
            headers=_brevo_headers(),
            params={"limit": limit, "offset": offset},
        )
    resp.raise_for_status()
    return resp.json()


async def get_campaign_clickers(campaign_id: int, limit: int = 500, offset: int = 0) -> dict[str, Any]:
    """Fetch contacts who clicked links in a specific campaign. Returns {items: [...], count: int}."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{_BREVO_BASE}/emailCampaigns/{campaign_id}/reports/clicks",
            headers=_brevo_headers(),
            params={"limit": limit, "offset": offset},
        )
    resp.raise_for_status()
    return resp.json()


async def get_all_openers(campaign_id: int) -> list[dict[str, Any]]:
    """Fetch ALL openers for a campaign (handles pagination automatically)."""
    results: list[dict[str, Any]] = []
    offset = 0
    page_size = 500
    while True:
        data = await get_campaign_openers(campaign_id, limit=page_size, offset=offset)
        items = data.get("items", [])
        results.extend(items)
        if len(items) < page_size:
            break
        offset += page_size
    return results


async def get_all_clickers(campaign_id: int) -> list[dict[str, Any]]:
    """Fetch ALL clickers for a campaign (handles pagination automatically)."""
    results: list[dict[str, Any]] = []
    offset = 0
    page_size = 500
    while True:
        data = await get_campaign_clickers(campaign_id, limit=page_size, offset=offset)
        items = data.get("items", [])
        results.extend(items)
        if len(items) < page_size:
            break
        offset += page_size
    return results
