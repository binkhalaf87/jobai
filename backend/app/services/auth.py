from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate


def get_user_by_email(db: Session, email: str) -> User | None:
    """Look up a user account by email address."""
    return db.scalar(select(User).where(User.email == email.lower().strip()))


def create_user(db: Session, payload: UserCreate) -> User:
    """Create a new user account with a hashed password."""
    user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> User | None:
    """Validate login credentials and update login metadata when successful."""
    user = get_user_by_email(db, payload.email)

    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active:
        return None

    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def build_auth_response(user: User) -> dict[str, object]:
    """Return a normalized auth response payload."""
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": user,
    }

