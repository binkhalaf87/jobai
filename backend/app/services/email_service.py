"""System transactional email service.

Sends auth emails (verification, password reset) via the Resend REST API
(https://api.resend.com/emails) configured through RESEND_API_KEY.

Using the HTTP API instead of SMTP avoids Railway's outbound port 465/587
restrictions — all traffic goes over HTTPS (port 443).

If RESEND_API_KEY is not set the functions log a warning and return silently
so the application keeps working in local dev / early staging.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_RESEND_SEND_URL = "https://api.resend.com/emails"


@dataclass(frozen=True)
class EmailSendResult:
    sent: bool
    provider: str = "brevo"
    error: str | None = None


# ---------------------------------------------------------------------------
# HTML templates
# ---------------------------------------------------------------------------


def _verification_html(verify_url: str, name: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#0f172a;margin-top:0">Verify your JobAI email</h2>
    <p style="color:#475569">Hi {name},</p>
    <p style="color:#475569">Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
    <a href="{verify_url}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#1e40af;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
      Verify Email Address
    </a>
    <p style="color:#94a3b8;font-size:13px">If you did not create a JobAI account you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#94a3b8;font-size:12px">JobAI &mdash; AI-powered career platform</p>
  </div>
</body>
</html>"""


def _password_reset_html(reset_url: str, name: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#0f172a;margin-top:0">Reset your JobAI password</h2>
    <p style="color:#475569">Hi {name},</p>
    <p style="color:#475569">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
    <a href="{reset_url}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#1e40af;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
      Reset Password
    </a>
    <p style="color:#94a3b8;font-size:13px">If you did not request a password reset you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#94a3b8;font-size:12px">JobAI &mdash; AI-powered career platform</p>
  </div>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Core send helper
# ---------------------------------------------------------------------------


def _send(to_email: str, subject: str, html_body: str) -> EmailSendResult:
    settings = get_settings()

    if not settings.resend_api_key:
        error = "RESEND_API_KEY not configured"
        logger.error(
            "EMAIL_SKIP: %s — skipping email to %s (subject: %s)",
            error,
            to_email,
            subject,
        )
        return EmailSendResult(sent=False, provider="resend", error=error)

    payload = {
        "from": f"JobAI <{settings.system_email_from}>",
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }

    try:
        response = httpx.post(
            _RESEND_SEND_URL,
            json=payload,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            timeout=15,
        )
        if response.status_code >= 400:
            error = response.text[:500]
            logger.error(
                "EMAIL_SEND_FAILED: provider=resend status=%s to=%s body=%s",
                response.status_code,
                to_email,
                error,
            )
            return EmailSendResult(sent=False, provider="resend", error=error)
        logger.info("Email sent to %s via Resend API (subject: %s)", to_email, subject)
        return EmailSendResult(sent=True, provider="resend")
    except Exception as exc:
        logger.exception("Failed to send email to %s (subject: %s)", to_email, subject)
        return EmailSendResult(sent=False, provider="resend", error=str(exc))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def send_verification_email(to_email: str, token: str, name: str | None = None) -> EmailSendResult:
    settings = get_settings()
    display_name = name or "there"
    url = f"{settings.frontend_url}/verify-email?token={token}"
    return _send(to_email, "Verify your JobAI email address", _verification_html(url, display_name))


def send_password_reset_email(to_email: str, token: str, name: str | None = None) -> EmailSendResult:
    settings = get_settings()
    display_name = name or "there"
    url = f"{settings.frontend_url}/reset-password?token={token}"
    return _send(to_email, "Reset your JobAI password", _password_reset_html(reset_url=url, name=display_name))
