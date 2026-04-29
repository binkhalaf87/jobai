"""Gmail OAuth 2.0 + Gmail REST API service."""

from __future__ import annotations

import base64
import logging
import uuid
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import urlencode

import httpx
import jwt
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.gmail_connection import GmailConnection
from app.models.send_history import SendHistory

logger = logging.getLogger(__name__)

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
_GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
_GMAIL_SCOPE = "https://mail.google.com/ email"
_STATE_ALGORITHM = "HS256"
_STATE_TTL_SECONDS = 600


def _fernet() -> Fernet:
    settings = get_settings()
    secret = settings.smtp_encryption_key or settings.jwt_secret
    raw = secret.encode()[:32].ljust(32, b"0")
    return Fernet(base64.urlsafe_b64encode(raw))


def _encrypt(text: str) -> str:
    return _fernet().encrypt(text.encode()).decode()


def _decrypt(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode()).decode()


def create_oauth_state(user_id: str) -> str:
    """Create a short-lived signed JWT to carry user identity through the OAuth round-trip."""
    settings = get_settings()
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=_STATE_TTL_SECONDS),
        "purpose": "gmail_oauth",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=_STATE_ALGORITHM)


def verify_oauth_state(state: str) -> str:
    """Decode and validate the state JWT; returns user_id or raises."""
    settings = get_settings()
    try:
        data = jwt.decode(state, settings.jwt_secret, algorithms=[_STATE_ALGORITHM])
        if data.get("purpose") != "gmail_oauth":
            raise ValueError("Invalid state token purpose")
        return data["sub"]
    except jwt.ExpiredSignatureError:
        raise ValueError("OAuth state token expired")
    except jwt.PyJWTError as exc:
        raise ValueError(f"Invalid OAuth state: {exc}")


def get_authorization_url(user_id: str) -> str:
    settings = get_settings()
    if not settings.google_client_id:
        raise ValueError("GOOGLE_CLIENT_ID is not configured")
    state = create_oauth_state(user_id)
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": _GMAIL_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{_GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        resp = await client.post(_GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        })
        resp.raise_for_status()
        return resp.json()


async def get_gmail_address(access_token: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        return resp.json()["email"]


async def _refresh_token(refresh_token: str) -> tuple[str, datetime]:
    """Returns (new_access_token, expiry_utc)."""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        resp = await client.post(_GOOGLE_TOKEN_URL, data={
            "refresh_token": refresh_token,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "grant_type": "refresh_token",
        })
        resp.raise_for_status()
        data = resp.json()
    expires_in = data.get("expires_in", 3600)
    expiry = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
    return data["access_token"], expiry


# ── DB helpers ─────────────────────────────────────────────────────────────────

def get_connection(db: Session, user_id: str) -> GmailConnection | None:
    return db.query(GmailConnection).filter(GmailConnection.user_id == user_id).first()


def upsert_connection(
    db: Session,
    user_id: str,
    gmail_address: str,
    refresh_token: str,
    expiry: datetime,
) -> GmailConnection:
    conn = get_connection(db, user_id)
    encrypted_rt = _encrypt(refresh_token)

    if conn:
        conn.gmail_address = gmail_address
        conn.encrypted_refresh_token = encrypted_rt
        conn.token_expiry = expiry
        conn.is_connected = True
    else:
        conn = GmailConnection(
            id=str(uuid.uuid4()),
            user_id=user_id,
            gmail_address=gmail_address,
            encrypted_refresh_token=encrypted_rt,
            token_expiry=expiry,
            is_connected=True,
        )
        db.add(conn)

    db.commit()
    db.refresh(conn)
    return conn


async def get_valid_access_token(db: Session, user_id: str) -> str:
    conn = get_connection(db, user_id)
    if not conn or not conn.is_connected:
        raise ValueError("Gmail not connected")
    refresh_token = _decrypt(conn.encrypted_refresh_token)
    access_token, expiry = await _refresh_token(refresh_token)
    conn.token_expiry = expiry
    db.commit()
    return access_token


def disconnect(db: Session, user_id: str) -> bool:
    conn = get_connection(db, user_id)
    if not conn:
        return False
    db.delete(conn)
    db.commit()
    return True


# ── Email sending ──────────────────────────────────────────────────────────────

async def send_email(
    access_token: str,
    from_email: str,
    from_name: str,
    to_email: str,
    to_name: str | None,
    subject: str,
    body: str,
) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>" if from_name else from_email
    msg["To"] = f"{to_name} <{to_email}>" if to_name else to_email
    msg.attach(MIMEText(body, "plain", "utf-8"))

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _GMAIL_SEND_URL,
            json={"raw": raw},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Gmail API error {resp.status_code}: {resp.text[:400]}")


# ── History helpers ────────────────────────────────────────────────────────────

def save_history(
    db: Session,
    user_id: str,
    job_title: str,
    company_name: str | None,
    subject: str,
    body: str,
    recipient_email: str,
    recipient_name: str | None,
    status: str,
    error_message: str | None,
    resume_id: str | None,
) -> SendHistory:
    now = datetime.now(timezone.utc)
    record = SendHistory(
        id=str(uuid.uuid4()),
        user_id=user_id,
        job_title=job_title,
        company_name=company_name,
        subject=subject,
        body=body,
        recipient_email=recipient_email,
        recipient_name=recipient_name,
        status=status,
        error_message=error_message,
        resume_id=resume_id,
        sent_at=now if status == "sent" else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_history(db: Session, user_id: str) -> list[SendHistory]:
    return (
        db.query(SendHistory)
        .filter(SendHistory.user_id == user_id)
        .order_by(SendHistory.created_at.desc())
        .limit(100)
        .all()
    )
