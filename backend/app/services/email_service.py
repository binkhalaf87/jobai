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
from datetime import datetime

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
    <h2 style="color:#0f172a;margin-top:0">Verify your JobAI24 email</h2>
    <p style="color:#475569">Hi {name},</p>
    <p style="color:#475569">Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
    <a href="{verify_url}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#1e40af;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
      Verify Email Address
    </a>
    <p style="color:#94a3b8;font-size:13px">If you did not create a JobAI24 account you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#94a3b8;font-size:12px">JobAI24 &mdash; AI-powered career platform</p>
  </div>
</body>
</html>"""


def _invoice_html(name: str, plan_name: str, amount_sar: str, transaction_id: str, paid_at: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px;direction:rtl">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#0f172a;margin-top:0">✅ تم الدفع بنجاح — JobAI24</h2>
    <p style="color:#475569">مرحباً {name}،</p>
    <p style="color:#475569">شكراً لك! تم استلام دفعتك وتفعيل خدمتك بنجاح.</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#64748b;padding:6px 0;font-size:14px">الخدمة</td>
          <td style="color:#0f172a;font-weight:600;text-align:left">{plan_name}</td>
        </tr>
        <tr>
          <td style="color:#64748b;padding:6px 0;font-size:14px">المبلغ</td>
          <td style="color:#0f172a;font-weight:600;text-align:left">{amount_sar} ريال سعودي</td>
        </tr>
        <tr>
          <td style="color:#64748b;padding:6px 0;font-size:14px">رقم العملية</td>
          <td style="color:#0f172a;font-size:13px;text-align:left">{transaction_id}</td>
        </tr>
        <tr>
          <td style="color:#64748b;padding:6px 0;font-size:14px">تاريخ الدفع</td>
          <td style="color:#0f172a;font-size:13px;text-align:left">{paid_at}</td>
        </tr>
      </table>
    </div>
    <p style="color:#94a3b8;font-size:13px">يُرجى الاحتفاظ بهذا البريد كإيصال للدفع.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#94a3b8;font-size:12px">JobAI24 &mdash; منصة المسار المهني بالذكاء الاصطناعي</p>
  </div>
</body>
</html>"""


def _password_reset_html(reset_url: str, name: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#0f172a;margin-top:0">Reset your JobAI24 password</h2>
    <p style="color:#475569">Hi {name},</p>
    <p style="color:#475569">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
    <a href="{reset_url}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#1e40af;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
      Reset Password
    </a>
    <p style="color:#94a3b8;font-size:13px">If you did not request a password reset you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#94a3b8;font-size:12px">JobAI24 &mdash; AI-powered career platform</p>
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
        "from": f"JobAI24 <{settings.system_email_from}>",
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


def send_gmail_approval_email(to_email: str, name: str | None = None) -> EmailSendResult:
    settings = get_settings()
    display_name = name or "عزيزي المستخدم"
    dashboard_url = f"{settings.frontend_url}/dashboard/smart-send"
    return _send(to_email, "تمت الموافقة على ربط Gmail — JobAI24", _gmail_approval_html(display_name, dashboard_url))


def send_gmail_rejection_email(to_email: str, name: str | None = None, reason: str | None = None) -> EmailSendResult:
    display_name = name or "عزيزي المستخدم"
    return _send(to_email, "تحديث طلب ربط Gmail — JobAI24", _gmail_rejection_html(display_name, reason))


def send_verification_email(to_email: str, token: str, name: str | None = None) -> EmailSendResult:
    settings = get_settings()
    display_name = name or "there"
    url = f"{settings.frontend_url}/verify-email?token={token}"
    return _send(to_email, "Verify your JobAI24 email address", _verification_html(url, display_name))


def _gmail_approval_html(name: str, dashboard_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px;direction:rtl">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#0f172a;margin-top:0">✅ تمت الموافقة على ربط Gmail</h2>
    <p style="color:#475569">مرحباً {name}،</p>
    <p style="color:#475569">تمت الموافقة على طلبك لربط حساب Gmail بمنصة JobAI24. يمكنك الآن الانتقال إلى لوحة التحكم وإكمال ربط حسابك لبدء حملات الإرسال الذكي.</p>
    <a href="{dashboard_url}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#1e40af;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
      اذهب إلى الإرسال الذكي
    </a>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#94a3b8;font-size:12px">JobAI24 &mdash; منصة المسار المهني بالذكاء الاصطناعي</p>
  </div>
</body>
</html>"""


def _gmail_rejection_html(name: str, reason: str | None) -> str:
    reason_text = f"<p style='color:#475569'><strong>السبب:</strong> {reason}</p>" if reason else ""
    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px;direction:rtl">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#0f172a;margin-top:0">طلب ربط Gmail</h2>
    <p style="color:#475569">مرحباً {name}،</p>
    <p style="color:#475569">للأسف، لم تتم الموافقة على طلب ربط Gmail الخاص بك في الوقت الحالي.</p>
    {reason_text}
    <p style="color:#475569">يمكنك التواصل مع فريق الدعم لمزيد من المعلومات.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#94a3b8;font-size:12px">JobAI24 &mdash; منصة المسار المهني بالذكاء الاصطناعي</p>
  </div>
</body>
</html>"""


def send_payment_invoice_email(
    to_email: str,
    name: str | None,
    plan_name: str,
    amount_minor: int,
    transaction_id: str | None,
    paid_at: datetime | None = None,
) -> EmailSendResult:
    from datetime import timezone as _tz
    display_name = name or "عزيزي العميل"
    amount_sar = f"{amount_minor / 100:.2f}"
    tx_id = transaction_id or "—"
    paid_str = (
        paid_at.astimezone(_tz.utc).strftime("%Y-%m-%d %H:%M UTC")
        if paid_at
        else "—"
    )
    return _send(
        to_email,
        f"إيصال دفع JobAI24 — {plan_name}",
        _invoice_html(display_name, plan_name, amount_sar, tx_id, paid_str),
    )


def send_password_reset_email(to_email: str, token: str, name: str | None = None) -> EmailSendResult:
    settings = get_settings()
    display_name = name or "there"
    url = f"{settings.frontend_url}/reset-password?token={token}"
    return _send(to_email, "Reset your JobAI24 password", _password_reset_html(reset_url=url, name=display_name))
