"""Brevo (Sendinblue) transactional email service for bulk marketing sends."""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"
_BREVO_BASE = "https://api.brevo.com/v3"

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


async def send_marketing_email(
    to_email: str,
    to_name: str | None,
    subject: str,
    html_content: str,
    from_name: str = "JobAI24",
    from_email: str = "marketing@jobai24.com",
) -> str | None:
    """Send a single marketing email via Brevo API. Returns None on success, error string on failure."""
    api_key = get_brevo_api_key()
    if not api_key:
        return "BREVO_API_KEY غير مضبوط في متغيرات البيئة"

    payload = {
        "sender": {"name": from_name, "email": from_email},
        "to": [{"email": to_email, "name": to_name or ""}],
        "subject": subject,
        "htmlContent": html_content,
        "headers": {"X-Mailin-custom": "marketing"},
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                _BREVO_SEND_URL,
                json=payload,
                headers={
                    "api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
        if resp.status_code in (200, 201):
            return None
        detail = resp.json().get("message", resp.text[:120]) if resp.text else str(resp.status_code)
        logger.warning("Brevo rejected email to %s: %s %s", to_email, resp.status_code, resp.text[:200])
        return f"Brevo {resp.status_code}: {detail}"
    except Exception as exc:
        logger.error("Brevo send error to %s: %s", to_email, exc)
        return f"خطأ في الاتصال بـ Brevo: {exc}"


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
