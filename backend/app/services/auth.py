from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate

EMAIL_VERIFY_EXPIRE_HOURS = 24
PASSWORD_RESET_EXPIRE_HOURS = 1


def get_user_by_email(db: Session, email: str) -> User | None:
    """Look up a user account by email address."""
    return db.scalar(select(User).where(User.email == email.lower().strip()))


def create_user(db: Session, payload: UserCreate) -> User:
    """Create a new user account with a hashed password. Sends a verification email."""
    from app.models.enums import UsageEventType
    from app.services.audit_log import emit
    from app.services.email_service import send_verification_email

    user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        is_active=True,
        is_email_verified=False,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    emit(db, user_id=user.id, event_type=UsageEventType.AUTH_REGISTER)

    token = generate_email_verification_token(db, user)
    send_verification_email(user.email, token, user.full_name)
    return user


def generate_email_verification_token(db: Session, user: User) -> str:
    """Generate a time-limited email verification token and persist it."""
    token = secrets.token_urlsafe(48)
    user.email_verification_token = token
    user.email_verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=EMAIL_VERIFY_EXPIRE_HOURS)
    db.commit()
    return token


def verify_email_token(db: Session, token: str) -> User | None:
    """Consume a verification token and mark the user's email as verified."""
    user = db.scalar(select(User).where(User.email_verification_token == token))
    if not user:
        return None
    if not user.email_verification_expires_at:
        return None
    if user.email_verification_expires_at < datetime.now(timezone.utc):
        return None
    user.is_email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None
    db.commit()
    return user


def can_resend_verification(db: Session, user: User) -> bool:
    """Return True only if the last token was issued more than 5 minutes ago."""
    return get_verification_resend_retry_after_seconds(user) == 0


def get_verification_resend_retry_after_seconds(user: User) -> int:
    """Return seconds remaining until another verification email may be sent."""
    if not user.email_verification_expires_at:
        return 0
    issued_at = user.email_verification_expires_at - timedelta(hours=EMAIL_VERIFY_EXPIRE_HOURS)
    age = datetime.now(timezone.utc) - issued_at
    return max(0, 300 - int(age.total_seconds()))


def generate_password_reset_token(db: Session, user: User) -> str:
    """Generate a time-limited password reset token and persist it."""
    token = secrets.token_urlsafe(48)
    user.password_reset_token = token
    user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=PASSWORD_RESET_EXPIRE_HOURS)
    db.commit()
    return token


def consume_password_reset_token(db: Session, token: str, new_password: str) -> User | None:
    """Validate reset token, update password, and revoke all refresh tokens."""
    user = db.scalar(select(User).where(User.password_reset_token == token))
    if not user:
        return None
    if not user.password_reset_expires_at:
        return None
    if user.password_reset_expires_at < datetime.now(timezone.utc):
        return None
    user.password_hash = hash_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    # Invalidate all active refresh tokens so stolen sessions are terminated
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked.is_(False),
    ).update({"revoked": True})
    db.commit()
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> User | None:
    """Validate login credentials and update login metadata when successful."""
    from app.models.enums import UsageEventType
    from app.services.audit_log import emit

    user = get_user_by_email(db, payload.email)

    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active:
        return None

    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    db.refresh(user)
    emit(db, user_id=user.id, event_type=UsageEventType.AUTH_LOGIN)
    return user


def _create_refresh_token_record(db: Session, user_id: str) -> str:
    """Persist a hashed refresh token and return the raw token to send to the client."""
    raw, token_hash = create_refresh_token()
    record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(record)
    db.commit()
    return raw


def build_auth_response(user: User, db: Session) -> dict[str, object]:
    """Return a normalized auth response payload including a refresh token."""
    raw_refresh = _create_refresh_token_record(db, user.id)
    return {
        "access_token": create_access_token(user.id, role=user.role),
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "user": user,
    }


def rotate_refresh_token(db: Session, raw_token: str) -> tuple[str, str, User] | None:
    """Consume a valid refresh token and issue a new token pair. Returns (access, refresh, user) or None."""
    token_hash = hash_refresh_token(raw_token)
    record = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    if not record:
        return None

    user = db.get(User, record.user_id)
    if not user or not user.is_active:
        return None

    new_raw, new_hash = create_refresh_token()
    record.revoked = True
    record.replaced_by = new_hash

    new_record = RefreshToken(
        user_id=record.user_id,
        token_hash=new_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_record)
    db.commit()

    access = create_access_token(user.id, role=user.role)
    return access, new_raw, user


def revoke_refresh_token(db: Session, raw_token: str) -> bool:
    """Revoke a refresh token. Returns True if it was found and revoked."""
    token_hash = hash_refresh_token(raw_token)
    record = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
        )
    )
    if not record:
        return False

    record.revoked = True
    db.commit()
    return True
