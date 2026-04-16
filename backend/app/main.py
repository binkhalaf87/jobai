import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp

from app.api.router import api_router
from app.core.application import wrap_with_cors
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def create_application() -> ASGIApp:
    """Build the FastAPI application and attach shared configuration."""
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        description="Starter FastAPI service for resume analysis workflows",
        version=settings.app_version,
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        debug=settings.debug,
    )

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled backend error during %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})

    @app.get("/health", tags=["system"])
    def health_check() -> dict[str, str]:
        """Top-level health endpoint for load balancers and infrastructure probes."""
        return {"status": "ok"}

    return wrap_with_cors(app)
