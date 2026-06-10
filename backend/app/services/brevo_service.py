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
    """Blocking SMTP send — called inside a thread-pool executor.
    Port 465 → implicit SSL (SMTP_SSL); all others → STARTTLS."""
    msg = email.mime.multipart.MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = f"{to_name} <{to_email}>" if to_name else to_email
    msg.attach(email.mime.text.MIMEText(html_content, "html", "utf-8"))

    port = int(smtp_cfg["port"])
    if port == 465:
        with smtplib.SMTP_SSL(smtp_cfg["host"], port, timeout=30) as server:
            server.login(smtp_cfg["user"], smtp_cfg["password"])
            server.sendmail(from_email, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(smtp_cfg["host"], port, timeout=30) as server:
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
    """Send via Brevo Transactional Email API (HTTPS). Returns None on success, error string on failure."""
    api_key = get_brevo_api_key()
    if not api_key:
        return "BREVO_API_KEY غير مضبوط في Railway"

    payload = {
        "sender": {"name": from_name, "email": from_email},
        "to": [{"email": to_email, **({"name": to_name} if to_name else {})}],
        "subject": subject,
        "htmlContent": html_content,
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_BREVO_BASE}/smtp/email",
                headers={"api-key": api_key, "Content-Type": "application/json"},
                json=payload,
            )
        if resp.status_code in (200, 201):
            return None
        detail = resp.json().get("message", resp.text[:200])
        return f"Brevo API {resp.status_code}: {detail}"
    except Exception as exc:
        logger.error("Brevo API send error to %s: %s", to_email, exc)
        return f"Brevo API خطأ: {exc}"


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
