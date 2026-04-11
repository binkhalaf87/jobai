"""Gmail SMTP service — connection management + per-email delivery."""

from __future__ import annotations

import base64
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.smtp_connection import SmtpConnection
from app.schemas.smart_send import SmtpConnectionCreate

_GMAIL_HOST = "smtp.gmail.com"
_GMAIL_PORT = 587  # STARTTLS


def _get_fernet() -> Fernet:
    """Derive a Fernet key from JWT_SECRET (URL-safe base64, 32 bytes)."""
    raw = settings.jwt_secret.encode()[:32].ljust(32, b"0")
    key = base64.urlsafe_b64encode(raw)
    return Fernet(key)


def encrypt_password(plaintext: str) -> str:
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt_password(ciphertext: str) -> str:
    return _get_fernet().decrypt(ciphertext.encode()).decode()


# ── SMTP connection CRUD ───────────────────────────────────────────────────────

def get_smtp_connection(db: Session, user_id: str) -> SmtpConnection | None:
    return db.query(SmtpConnection).filter(SmtpConnection.user_id == user_id).first()


def upsert_smtp_connection(db: Session, user_id: str, data: SmtpConnectionCreate) -> SmtpConnection:
    conn = get_smtp_connection(db, user_id)
    encrypted = encrypt_password(data.app_password)

    if conn:
        conn.gmail_address = data.gmail_address
        conn.display_name = data.display_name
        conn.encrypted_app_password = encrypted
        conn.is_verified = False
    else:
        import uuid
        conn = SmtpConnection(
            id=str(uuid.uuid4()),
            user_id=user_id,
            gmail_address=data.gmail_address,
            display_name=data.display_name,
            encrypted_app_password=encrypted,
            is_verified=False,
        )
        db.add(conn)

    db.commit()
    db.refresh(conn)
    return conn


def verify_smtp_connection(db: Session, user_id: str) -> tuple[bool, str]:
    """
    Attempt a real SMTP login to verify credentials.
    Returns (success, message).
    """
    conn = get_smtp_connection(db, user_id)
    if not conn:
        return False, "No SMTP connection saved"

    password = decrypt_password(conn.encrypted_app_password)
    try:
        with smtplib.SMTP(_GMAIL_HOST, _GMAIL_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
            server.login(conn.gmail_address, password)

        conn.is_verified = True
        db.commit()
        return True, "Connection verified"
    except smtplib.SMTPAuthenticationError:
        return False, "Authentication failed — check your Gmail address and app password"
    except smtplib.SMTPException as exc:
        return False, f"SMTP error: {exc}"
    except Exception as exc:
        return False, f"Connection error: {exc}"


def delete_smtp_connection(db: Session, user_id: str) -> bool:
    conn = get_smtp_connection(db, user_id)
    if not conn:
        return False
    db.delete(conn)
    db.commit()
    return True


# ── Email sending ──────────────────────────────────────────────────────────────

def send_email(
    smtp_conn: SmtpConnection,
    to_email: str,
    to_name: str | None,
    subject: str,
    body: str,
) -> None:
    """
    Send a single email via Gmail SMTP.
    Raises on failure.
    """
    password = decrypt_password(smtp_conn.encrypted_app_password)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{smtp_conn.display_name} <{smtp_conn.gmail_address}>"
    msg["To"] = f"{to_name} <{to_email}>" if to_name else to_email

    # Plain text part (good practice alongside HTML)
    plain = MIMEText(body, "plain", "utf-8")
    msg.attach(plain)

    with smtplib.SMTP(_GMAIL_HOST, _GMAIL_PORT, timeout=15) as server:
        server.ehlo()
        server.starttls(context=ssl.create_default_context())
        server.ehlo()
        server.login(smtp_conn.gmail_address, password)
        server.sendmail(smtp_conn.gmail_address, to_email, msg.as_string())
