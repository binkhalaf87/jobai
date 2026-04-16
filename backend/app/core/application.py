from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp

from app.core.config import get_optional_env, resolve_cors_configuration

ALLOWED_CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]


def wrap_with_cors(application: ASGIApp) -> CORSMiddleware:
    """Wrap the full ASGI app so CORS headers survive unhandled 500 responses."""
    origins, origin_regex = resolve_cors_configuration()
    return CORSMiddleware(
        app=application,
        allow_origins=origins,
        allow_origin_regex=origin_regex,
        allow_credentials=True,
        allow_methods=ALLOWED_CORS_METHODS,
        allow_headers=["*"],
    )


def create_unavailable_application(startup_error: Exception) -> ASGIApp:
    """Serve a CORS-enabled fallback response when startup fails before the real app is ready."""
    is_production = get_optional_env("ENVIRONMENT", "development").lower() == "production"
    diagnostic_payload: dict[str, Any] = {
        "status": "error",
        "detail": "Backend failed to start.",
    }

    # Always expose the error type so Railway logs and 503 responses help diagnose startup failures.
    diagnostic_payload["error"] = str(startup_error)
    diagnostic_payload["error_type"] = type(startup_error).__name__

    fallback_app = FastAPI(
        title="JobAI Backend Unavailable",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )

    @fallback_app.api_route(
        "/{path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    )
    async def backend_unavailable(path: str) -> JSONResponse:
        return JSONResponse(status_code=503, content=diagnostic_payload, headers={"Retry-After": "5"})

    return wrap_with_cors(fallback_app)
