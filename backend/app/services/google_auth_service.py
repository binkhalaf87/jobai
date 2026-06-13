"""Google OAuth 2.0 — Sign in with Google (login/register flow)."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.enums import UserRole
from app.models.user import User
from app.models.user_wallet import UserWallet

logger = logging.getLogger(__name__)

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
_GOOGLE_LOGIN_SCOPE = "openid email profile"
_STATE_ALGORITHM = "HS256"
_STATE_TTL_SECONDS = 600


def create_login_state() -> str:
    """Create a short-lived signed JWT to prevent CSRF in the OAuth round-trip."""
    settings = get_settings()
    payload = {
        "exp": datetime.now(timezone.utc) + timedelta(seconds=_STATE_TTL_SECONDS),
        "purpose": "google_login",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=_STATE_ALGORITHM)


def verify_login_state(state: str) -> None:
    """Validate the OAuth state JWT; raises ValueError if invalid or expired."""
    settings = get_settings()
    try:
        data = jwt.decode(state, settings.jwt_secret, algorithms=[_STATE_ALGORITHM])
        if data.get("purpose") != "google_login":
            raise ValueError("Invalid state token purpose")
    except jwt.ExpiredSignatureError:
        raise ValueError("OAuth state token expired")
    except jwt.PyJWTError as exc:
        raise ValueError(f"Invalid OAuth state: {exc}")


def get_google_login_url() -> str:
    """Build the Google OAuth authorization URL for login."""
    settings = get_settings()
    if not settings.google_client_id:
        raise ValueError("GOOGLE_CLIENT_ID is not configured")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_login_redirect_uri,
        "response_type": "code",
        "scope": _GOOGLE_LOGIN_SCOPE,
        "state": create_login_state(),
        "access_type": "online",
        "prompt": "select_account",
    }
    return f"{_GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_user_info(code: str) -> dict:
    """Exchange an authorization code for Google user info."""
    settings = get_settings()
    token_response = httpx.post(
        _GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_login_redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    token_response.raise_for_status()
    access_token = token_response.json()["access_token"]

    userinfo_response = httpx.get(
        _GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    userinfo_response.raise_for_status()
    return userinfo_response.json()


def get_or_create_google_user(db: Session, user_info: dict) -> User:
    """Find an existing user by google_id or email, or create a new one."""
    from app.services.audit_log import emit
    from app.models.enums import UsageEventType

    google_id: str = str(user_info["id"])
    email: str = user_info["email"].lower().strip()
    full_name: str | None = user_info.get("name")

    # 1. Look up by google_id first
    user = db.scalar(select(User).where(User.google_id == google_id))
    if user:
        return user

    # 2. Email already registered — link google_id to existing account
    user = db.scalar(select(User).where(User.email == email))
    if user:
        user.google_id = google_id
        if not user.is_email_verified:
            user.is_email_verified = True
        db.commit()
        db.refresh(user)
        return user

    # 3. New user — create account (email pre-verified by Google)
    user = User(
        email=email,
        full_name=full_name,
        password_hash=None,
        google_id=google_id,
        is_active=True,
        is_email_verified=True,
        role=UserRole.JOBSEEKER,
    )
    db.add(user)
    db.flush()

    wallet = UserWallet(user_id=user.id)
    db.add(wallet)
    db.commit()
    db.refresh(user)

    emit(db, user_id=user.id, event_type=UsageEventType.AUTH_REGISTER)
    logger.info("New user created via Google OAuth: email=%s", email)
    return user
