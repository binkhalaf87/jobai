from __future__ import annotations

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


def get_user_by_email(db: Session, email: str) -> User | None:
    """Look up a user account by email address."""
    return db.scalar(select(User).where(User.email == email.lower().strip()))


def create_user(db: Session, payload: UserCreate) -> User:
    """Create a new user account with a hashed password."""
    from app.models.enums import UsageEventType
    from app.services.audit_log import emit

    user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        is_active=True,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    emit(db, user_id=user.id, event_type=UsageEventType.AUTH_REGISTER)
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
