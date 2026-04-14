import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.models.enums import UserRole
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.models.user_wallet import UserWallet
from app.schemas.billing import (
    BillingCheckoutIntentionRequest,
    BillingCheckoutPlanSummary,
    BillingCheckoutResponse,
    BillingCheckoutSession,
    BillingMeResponse,
    BillingOrderSummary,
    BillingPlansResponse,
    BillingPlanRead,
    BillingSubscriptionSummary,
    BillingWalletSummary,
    BillingWebhookResponse,
)
from app.services.billing_service import (
    create_checkout_intention,
    get_current_subscription,
    get_wallet_for_user,
    list_plans_for_user,
    list_recent_payment_orders_for_user,
)
from app.services.paymob_webhook_service import process_paymob_webhook

router = APIRouter(prefix="/billing", tags=["billing"])


def _plan_to_schema(plan: Plan) -> BillingPlanRead:
    return BillingPlanRead.model_validate(plan)


def _subscription_to_schema(subscription: Subscription | None) -> BillingSubscriptionSummary | None:
    if not subscription:
        return None

    return BillingSubscriptionSummary(
        id=subscription.id,
        plan_id=subscription.plan_id,
        plan_name=subscription.plan_name,
        status=subscription.status,
        provider_name=subscription.provider_name,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        cancel_at_period_end=subscription.cancel_at_period_end,
        created_at=subscription.created_at,
        updated_at=subscription.updated_at,
    )


def _wallet_to_schema(wallet: UserWallet | None, user: User) -> BillingWalletSummary | None:
    if wallet:
        return BillingWalletSummary(
            id=wallet.id,
            balance_points=wallet.balance_points,
            lifetime_earned_points=wallet.lifetime_earned_points,
            lifetime_spent_points=wallet.lifetime_spent_points,
            is_active=wallet.is_active,
            created_at=wallet.created_at,
            updated_at=wallet.updated_at,
        )

    if user.role != UserRole.JOBSEEKER:
        return None

    return BillingWalletSummary(
        id=None,
        balance_points=0,
        lifetime_earned_points=0,
        lifetime_spent_points=0,
        is_active=True,
        created_at=None,
        updated_at=None,
    )


@router.get("/plans", response_model=BillingPlansResponse)
def get_billing_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingPlansResponse:
    """Return active billing plans available to the authenticated user."""
    plans = list_plans_for_user(db, current_user)
    return BillingPlansResponse(
        role=current_user.role,
        plans=[_plan_to_schema(plan) for plan in plans],
    )


@router.post("/checkout/intention", response_model=BillingCheckoutResponse, status_code=status.HTTP_201_CREATED)
def create_billing_checkout_intention(
    payload: BillingCheckoutIntentionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingCheckoutResponse:
    """Create an internal payment order, then return a Paymob checkout intention."""
    try:
        result = create_checkout_intention(db, current_user, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return BillingCheckoutResponse(
        payment_order_id=result.payment_order.id,
        merchant_reference=result.payment_order.merchant_reference,
        provider_name=result.payment_order.provider_name,
        status=result.payment_order.status,
        order_type=result.payment_order.order_type,
        amount_minor=result.payment_order.amount_minor,
        currency=result.payment_order.currency,
        plan=BillingCheckoutPlanSummary(
            code=result.plan.code,
            name=result.plan.name,
            kind=result.plan.kind,
            billing_interval=result.plan.billing_interval,
            currency=result.plan.currency,
            price_amount_minor=result.plan.price_amount_minor,
            points_grant=result.plan.points_grant,
        ),
        checkout=BillingCheckoutSession(
            intention_id=result.paymob_intention.intention_id,
            client_secret=result.paymob_intention.client_secret,
            public_key=result.paymob_intention.public_key,
            integration_id=result.paymob_intention.integration_id,
            iframe_id=result.paymob_intention.iframe_id,
        ),
    )


@router.get("/me", response_model=BillingMeResponse)
def get_my_billing_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingMeResponse:
    """Return the authenticated user's billing snapshot."""
    subscription = get_current_subscription(db, current_user.id)
    wallet = get_wallet_for_user(db, current_user.id)
    recent_orders = list_recent_payment_orders_for_user(db, current_user.id)

    return BillingMeResponse(
        user_id=current_user.id,
        role=current_user.role,
        current_subscription=_subscription_to_schema(subscription),
        wallet=_wallet_to_schema(wallet, current_user),
        recent_orders=[
            BillingOrderSummary(
                id=order.id,
                plan_code=order.plan.code if order.plan else "",
                plan_name=order.plan.name if order.plan else "",
                order_type=order.order_type,
                status=order.status,
                amount_minor=order.amount_minor,
                currency=order.currency,
                provider_name=order.provider_name,
                created_at=order.created_at,
                paid_at=order.paid_at,
                failure_reason=order.failure_reason,
            )
            for order in recent_orders
        ],
    )


@router.post("/paymob/webhook", response_model=BillingWebhookResponse)
async def handle_paymob_webhook(
    request: Request,
    db: Session = Depends(get_db),
    hmac_header: str | None = Header(default=None, alias="hmac"),
    x_hmac_header: str | None = Header(default=None, alias="x-hmac"),
) -> BillingWebhookResponse:
    """Verify and reconcile a Paymob webhook callback."""
    raw_body = await request.body()
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook JSON payload.") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook payload must be a JSON object.")

    provided_hmac = (
        request.query_params.get("hmac")
        or hmac_header
        or x_hmac_header
        or payload.get("hmac")
    )

    try:
        result = process_paymob_webhook(
            db,
            payload,
            provided_hmac=str(provided_hmac) if provided_hmac else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return BillingWebhookResponse(
        event_id=result.event_id,
        payment_order_id=result.payment_order_id,
        status=result.status,
        duplicate=result.duplicate,
    )
