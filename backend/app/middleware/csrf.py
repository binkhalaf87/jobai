"""CSRF protection using the double-submit cookie pattern.

Every response gets a ``csrf_token`` cookie (not httpOnly so JavaScript can
read it). State-changing requests (POST / PUT / PATCH / DELETE) must include
the same value in the ``X-CSRF-Token`` request header. The middleware compares
them with ``secrets.compare_digest`` to prevent timing attacks.

Exemptions
----------
External webhooks (Paymob) cannot include the CSRF cookie so those paths are
explicitly exempt. Add any other inbound-only webhook paths to ``_EXEMPT_PREFIXES``.
"""

from __future__ import annotations

import secrets

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp

from app.core.config import get_settings

CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "x-csrf-token"
_SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS", "TRACE"})
_EXEMPT_PREFIXES = (
    "/api/v1/billing/paymob/webhook",
    "/health",
    # Auth endpoints have no authenticated state to protect and are often the
    # first POST a user makes — exempting them avoids the CSRF bootstrap problem
    # where no cookie exists yet on the first visit.
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/verify-email",
    "/api/v1/auth/resend-verification",
)


def _is_exempt(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in _EXEMPT_PREFIXES)


class CSRFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        if request.method not in _SAFE_METHODS and not _is_exempt(request.url.path):
            cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
            header_token = request.headers.get(CSRF_HEADER_NAME)

            if not cookie_token or not header_token:
                return JSONResponse(
                    {"detail": "CSRF token missing."},
                    status_code=403,
                )
            if not secrets.compare_digest(cookie_token, header_token):
                return JSONResponse(
                    {"detail": "CSRF validation failed."},
                    status_code=403,
                )

        response: Response = await call_next(request)

        if CSRF_COOKIE_NAME not in request.cookies:
            token = secrets.token_urlsafe(32)
            is_prod = get_settings().environment.lower() == "production"
            response.set_cookie(
                CSRF_COOKIE_NAME,
                token,
                httponly=False,
                samesite="lax",
                secure=is_prod,
                max_age=86400 * 7,
                path="/",
            )

        return response
