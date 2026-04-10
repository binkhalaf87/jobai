from fastapi import APIRouter

# This router is reserved for subscription, usage, and payment-related endpoints.
router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/status")
def billing_status() -> dict[str, str]:
    """Placeholder endpoint confirming the billing route group is wired."""
    return {"status": "billing routes ready"}

