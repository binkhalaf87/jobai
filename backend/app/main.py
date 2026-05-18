import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.types import ASGIApp

# ProxyHeadersMiddleware rewrites request.client.host (and scheme) from the
# X-Forwarded-For / X-Forwarded-Proto headers set by Railway / Vercel / nginx.
# This must be the outermost middleware so every subsequent layer — including
# SlowAPIMiddleware — sees the real client IP, not the proxy's address.
# IMPORTANT: only enable this when the app is deployed behind a trusted proxy.
#            For local development it is harmless but has no visible effect.
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.api.router import api_router
from app.core.application import SecurityHeadersMiddleware, wrap_with_cors
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.middleware.csrf import CSRFMiddleware
from app.scheduler import start_scheduler, stop_scheduler

logger = logging.getLogger(__name__)


def create_application() -> ASGIApp:
    """Build the FastAPI application and attach shared configuration."""
    settings = get_settings()
    is_dev = settings.environment.lower() not in ("production", "staging")

    app = FastAPI(
        title=settings.app_name,
        description="Starter FastAPI service for resume analysis workflows",
        version=settings.app_version,
        openapi_url=f"{settings.api_prefix}/openapi.json" if is_dev else None,
        docs_url="/docs" if is_dev else None,
        redoc_url="/redoc" if is_dev else None,
        debug=settings.debug,
        redirect_slashes=False,
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(CSRFMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    # ProxyHeadersMiddleware must wrap every other middleware so that
    # request.client.host is already the real IP when SlowAPIMiddleware runs.
    # trusted_hosts="*" is appropriate here because Railway/Vercel guarantee
    # that forwarding headers originate from their own infrastructure.
    # If you want to restrict to specific proxy CIDRs, set the
    # FORWARDED_ALLOW_IPS env variable and pass it here instead of "*".
    app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.on_event("startup")
    async def on_startup() -> None:
        if not settings.openai_api_key:
            logger.warning(
                "⚠️  OPENAI_API_KEY not set. AI endpoints (analysis, rewrite, interview) "
                "will return 503. Set OPENAI_API_KEY in backend/.env to enable AI features."
            )
        start_scheduler()

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        stop_scheduler()

    @app.exception_handler(RuntimeError)
    async def openai_config_error_handler(request: Request, exc: RuntimeError) -> JSONResponse:
        if "OPENAI_API_KEY" in str(exc):
            return JSONResponse(
                status_code=503,
                content={"detail": "AI analysis is not configured on this server."},
            )
        logger.exception("Unhandled RuntimeError during %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled backend error during %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})

    @app.get("/health", tags=["system"])
    def health_check() -> dict[str, str]:
        """Top-level health endpoint for load balancers and infrastructure probes."""
        return {"status": "ok"}

    return wrap_with_cors(app)
