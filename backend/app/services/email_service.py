"""System transactional email service.

Sends auth emails (verification, password reset) via a dedicated SMTP account
configured through SYSTEM_SMTP_* environment variables. This is separate from
the per-user SMTP connections managed by smtp_service.py.

If SYSTEM_SMTP_HOST is not configured the functions log a warning and return
silently so the application keeps working in environments where email is not yet
set up (local dev, early staging).
"""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger(__name__)


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


def _send(to_email: str, subject: str, html_body: str) -> None:
    settings = get_settings()

    if not settings.system_smtp_host:
        logger.warning(
            "SYSTEM_SMTP_HOST not configured — skipping email to %s (subject: %s)",
            to_email,
            subject,
        )
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.system_email_from
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(
            settings.system_smtp_host,
            settings.system_smtp_port,
            context=context,
            timeout=10,
        ) as server:
            if settings.system_smtp_user and settings.system_smtp_password:
                server.login(settings.system_smtp_user, settings.system_smtp_password)
            server.sendmail(settings.system_email_from, to_email, msg.as_string())
        logger.info("Email sent to %s (subject: %s)", to_email, subject)
    except Exception:
        logger.exception("Failed to send email to %s (subject: %s)", to_email, subject)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def send_verification_email(to_email: str, token: str, name: str | None = None) -> None:
    settings = get_settings()
    display_name = name or "there"
    url = f"{settings.frontend_url}/verify-email?token={token}"
    _send(to_email, "Verify your JobAI email address", _verification_html(url, display_name))


def send_password_reset_email(to_email: str, token: str, name: str | None = None) -> None:
    settings = get_settings()
    display_name = name or "there"
    url = f"{settings.frontend_url}/reset-password?token={token}"
    _send(to_email, "Reset your JobAI password", _password_reset_html(url, display_name))
