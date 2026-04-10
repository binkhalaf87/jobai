from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings

settings = get_settings()


def create_application() -> FastAPI:
    """Build the FastAPI application and attach shared configuration."""
    app = FastAPI(
        title=settings.app_name,
        description="Starter FastAPI service for resume analysis workflows",
        version=settings.app_version,
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        debug=settings.debug,
    )

    # The Vercel frontend sends browser requests to this Railway-hosted backend.
    # CORS is locked to explicit origins from ALLOWED_ORIGIN, with localhost added
    # automatically outside production so local Next.js development still works.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(api_router, prefix=settings.api_prefix)
    return app


# This application instance is used by the ASGI server in local and deployed environments.
app = create_application()


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Top-level health endpoint for load balancers and infrastructure probes."""
    return {"status": "ok"}
