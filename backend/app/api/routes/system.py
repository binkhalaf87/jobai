import sqlalchemy as sa
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from app.api.deps.db import get_db

# This router holds operational endpoints that help verify the service is alive.
router = APIRouter(prefix="/system", tags=["system"])


@router.get("/ping")
def ping() -> dict[str, str]:
    """Small placeholder endpoint for service wiring checks."""
    return {"message": "pong"}


@router.get("/health")
def system_health() -> dict[str, str]:
    """Versioned health endpoint for API clients and internal service checks."""
    return {"status": "ok"}


@router.get("/health/ready")
def readiness(db: Session = Depends(get_db)) -> JSONResponse:
    """Deep health check: verifies the database is reachable. Returns 503 if not."""
    checks: dict[str, str] = {}
    healthy = True

    try:
        db.execute(sa.text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"
        healthy = False

    return JSONResponse(
        content={"status": "ready" if healthy else "degraded", "checks": checks},
        status_code=200 if healthy else 503,
    )
