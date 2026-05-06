import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.core.rate_limit import limiter
from app.models.enums import UsageEventType
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, LogoutRequest, RefreshRequest
from app.schemas.user import UserCreate, UserRead
from app.services.audit_log import emit as audit_emit
from app.services.auth import (
    authenticate_user,
    build_auth_response,
    create_user,
    get_user_by_email,
    hash_refresh_token,
    revoke_refresh_token,
    rotate_refresh_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)) -> dict[str, object]:
    """Create a user account and immediately return an access token."""
    existing_user = get_user_by_email(db, payload.email)

    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with that email already exists.")

    user = create_user(db, payload)
    return build_auth_response(user, db)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    """Authenticate a user and return a bearer token."""
    user = authenticate_user(db, payload)

    if not user:
        logger.warning(
            "Failed login attempt for email=%s ip=%s",
            payload.email,
            request.client.host if request.client else "unknown",
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    return build_auth_response(user, db)


@router.post("/refresh", response_model=AuthResponse)
@limiter.limit("10/minute")
def refresh(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    """Exchange a valid refresh token for a new access + refresh token pair."""
    result = rotate_refresh_token(db, payload.refresh_token)

    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")

    access_token, new_refresh_token, user = result
    audit_emit(db, user_id=user.id, event_type=UsageEventType.AUTH_TOKEN_REFRESH)
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)) -> None:
    """Revoke a refresh token and immediately blacklist the access token."""
    from datetime import timezone

    from sqlalchemy import select

    from app.core.security import blacklist_token, decode_access_token

    if payload.access_token:
        try:
            token_payload = decode_access_token(payload.access_token)
            jti = token_payload.get("jti")
            exp_ts = token_payload.get("exp")
            if jti and exp_ts:
                from datetime import datetime
                blacklist_token(jti, datetime.fromtimestamp(exp_ts, tz=timezone.utc))
        except Exception:
            pass  # invalid or already expired token — nothing to blacklist

    token_hash = hash_refresh_token(payload.refresh_token)
    record = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    user_id = record.user_id if record else None

    revoke_refresh_token(db, payload.refresh_token)

    if user_id:
        audit_emit(db, user_id=user_id, event_type=UsageEventType.AUTH_LOGOUT)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    """Return the currently authenticated user."""
    return current_user
