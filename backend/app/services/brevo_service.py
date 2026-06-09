"""Brevo (Sendinblue) transactional email service for bulk marketing sends."""

from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

_BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"

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
) -> bool:
    """Send a single marketing email via Brevo API. Returns True on success."""
    api_key = get_brevo_api_key()
    if not api_key:
        logger.warning("BREVO_API_KEY not set — skipping marketing email to %s", to_email)
        return False

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
            return True
        logger.warning("Brevo rejected email to %s: %s %s", to_email, resp.status_code, resp.text[:200])
        return False
    except Exception as exc:
        logger.error("Brevo send error to %s: %s", to_email, exc)
        return False
