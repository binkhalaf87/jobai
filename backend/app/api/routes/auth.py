import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.core.security import blacklist_token, decode_access_token
from app.models.enums import UsageEventType
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from app.schemas.user import UserCreate, UserRead
from app.services.audit_log import emit as audit_emit
from app.services.auth import (
    authenticate_user,
    build_auth_response,
    can_resend_verification,
    consume_password_reset_token,
    create_user,
    generate_email_verification_token,
    generate_password_reset_token,
    get_user_by_email,
    hash_refresh_token,
    revoke_refresh_token,
    rotate_refresh_token,
    verify_email_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def _is_production() -> bool:
    return get_settings().environment.lower() == "production"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Write httpOnly auth cookies to the response."""
    secure = _is_production()
    # Cross-origin deployment (Vercel → Railway) requires SameSite=None + Secure.
    # SameSite=Lax blocks cookies on cross-site fetch requests.
    samesite = "none" if secure else "lax"
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        samesite=samesite,
        secure=secure,
        max_age=60 * 15,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        samesite=samesite,
        secure=secure,
        max_age=60 * 60 * 24 * 30,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    """Expire the httpOnly auth cookies."""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)) -> dict:
    """Create a user account and send an email verification link."""
    existing_user = get_user_by_email(db, payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with that email already exists.")

    create_user(db, payload)
    return {"message": "Registration successful. Please check your email to verify your account."}


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Authenticate a user, enforce email verification, and set httpOnly cookies."""
    user = authenticate_user(db, payload)

    if not user:
        logger.warning(
            "Failed login attempt for email=%s ip=%s",
            payload.email,
            request.client.host if request.client else "unknown",
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="email_not_verified",
        )

    auth_data = build_auth_response(user, db)
    _set_auth_cookies(response, auth_data["access_token"], auth_data["refresh_token"])
    return auth_data


@router.post("/refresh", response_model=AuthResponse)
@limiter.limit("10/minute")
def refresh(
    request: Request,
    response: Response,
    payload: RefreshRequest | None = None,
    db: Session = Depends(get_db),
) -> dict:
    """Exchange a valid refresh token for a new token pair. Reads from cookie or request body."""
    raw_token: str | None = None

    if payload and payload.refresh_token:
        raw_token = payload.refresh_token
    if not raw_token:
        raw_token = request.cookies.get("refresh_token")

    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided.")

    result = rotate_refresh_token(db, raw_token)
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")

    access_token, new_refresh_token, user = result
    audit_emit(db, user_id=user.id, event_type=UsageEventType.AUTH_TOKEN_REFRESH)
    _set_auth_cookies(response, access_token, new_refresh_token)
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    payload: LogoutRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Revoke tokens and clear auth cookies. Requires a valid session."""
    # Prefer cookie tokens; fall back to body for API clients
    access_token = request.cookies.get("access_token") or (payload.access_token if payload else None)
    refresh_token_raw = request.cookies.get("refresh_token") or (payload.refresh_token if payload else None) or ""

    if access_token:
        try:
            token_payload = decode_access_token(access_token)
            jti = token_payload.get("jti")
            exp_ts = token_payload.get("exp")
            if jti and exp_ts:
                blacklist_token(jti, datetime.fromtimestamp(exp_ts, tz=timezone.utc))
        except Exception:
            pass

    revoke_refresh_token(db, refresh_token_raw)
    _clear_auth_cookies(response)
    audit_emit(db, user_id=current_user.id, event_type=UsageEventType.AUTH_LOGOUT)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    """Return the currently authenticated user."""
    return current_user


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------


@router.post("/verify-email")
@limiter.limit("10/minute")
def verify_email(request: Request, payload: VerifyEmailRequest, db: Session = Depends(get_db)) -> dict:
    """Mark a user's email as verified using a one-time token."""
    user = verify_email_token(db, payload.token)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token.")
    audit_emit(db, user_id=user.id, event_type=UsageEventType.AUTH_EMAIL_VERIFIED)
    return {"message": "Email verified successfully. You can now log in."}


@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, payload: ResendVerificationRequest, db: Session = Depends(get_db)) -> dict:
    """Resend the email verification link. Always returns 200 to prevent email enumeration."""
    from app.services.email_service import send_verification_email

    user = get_user_by_email(db, payload.email)
    logger.error(
        "RESEND_DEBUG: email=%r user_found=%s verified=%s can_resend=%s",
        payload.email,
        user is not None,
        user.is_email_verified if user else "N/A",
        can_resend_verification(db, user) if user else "N/A",
    )
    if user and not user.is_email_verified and can_resend_verification(db, user):
        token = generate_email_verification_token(db, user)
        send_verification_email(user.email, token, user.full_name)
        audit_emit(db, user_id=user.id, event_type=UsageEventType.AUTH_EMAIL_VERIFICATION_RESENT)

    return {"message": "If that email exists and is unverified, a new link has been sent."}


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> dict:
    """Send a password reset link. Always returns 200 to prevent email enumeration."""
    from app.services.email_service import send_password_reset_email

    user = get_user_by_email(db, payload.email)
    if user and user.is_email_verified:
        token = generate_password_reset_token(db, user)
        send_password_reset_email(user.email, token, user.full_name)
        audit_emit(db, user_id=user.id, event_type=UsageEventType.AUTH_PASSWORD_RESET_REQUESTED)

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> dict:
    """Reset a user's password using a one-time token."""
    # Validate password strength via UserCreate validator
    try:
        UserCreate(email="x@x.com", password=payload.new_password)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    user = consume_password_reset_token(db, payload.token, payload.new_password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    audit_emit(db, user_id=user.id, event_type=UsageEventType.AUTH_PASSWORD_RESET_COMPLETED)
    return {"message": "Password reset successfully. Please log in with your new password."}
