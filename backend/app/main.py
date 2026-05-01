import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.types import ASGIApp

from app.api.router import api_router
from app.core.application import SecurityHeadersMiddleware, wrap_with_cors
from app.core.config import get_settings
from app.core.rate_limit import limiter
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
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.on_event("startup")
    async def on_startup() -> None:
        start_scheduler()

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        stop_scheduler()

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled backend error during %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})

    @app.get("/health", tags=["system"])
    def health_check() -> dict[str, str]:
        """Top-level health endpoint for load balancers and infrastructure probes."""
        return {"status": "ok"}

    return wrap_with_cors(app)
