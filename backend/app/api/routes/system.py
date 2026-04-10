from fastapi import APIRouter

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
