import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.models.enums import UserRole
from app.models.plan import Plan
from app.models.promo_code import PromoCode
from app.models.promo_code_usage import PromoCodeUsage
from app.models.subscription import Subscription
from app.models.user import User
from app.models.user_wallet import UserWallet
from app.models.wallet_transaction import WalletTransaction
from app.schemas.billing import (
    BillingCheckoutIntentionRequest,
    BillingCheckoutPlanSummary,
    BillingCheckoutResponse,
    BillingCheckoutSession,
    BillingMeResponse,
    BillingOrderSummary,
    BillingPlansResponse,
    BillingPlanRead,
    BillingPromoValidateRequest,
    BillingPromoValidateResponse,
    BillingSubscriptionSummary,
    BillingWalletSummary,
    BillingWebhookResponse,
    BillingWalletTransactionSummary,
    BillingWalletTransactionsResponse,
    CartCheckoutRequest,
    CartCheckoutResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
)
from app.services.billing_service import (
    create_cart_checkout_intention,
    create_checkout_intention,
    get_current_subscription,
    get_wallet_for_user,
    list_plans_for_user,
    list_recent_payment_orders_for_user,
    list_wallet_transactions_for_user,
)
from app.services.feature_credit_service import get_all_feature_balances
from app.services.paymob_webhook_service import (
    process_paymob_webhook,
    verify_all_pending_for_user,
    verify_and_activate_payment_order,
)

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


def _wallet_transaction_to_schema(transaction: WalletTransaction) -> BillingWalletTransactionSummary:
    return BillingWalletTransactionSummary(
        id=transaction.id,
        transaction_type=transaction.transaction_type.value,
        status=transaction.status.value,
        direction=transaction.direction.value,
        points=transaction.points,
        balance_before=transaction.balance_before,
        balance_after=transaction.balance_after,
        description=transaction.description,
        effective_at=transaction.effective_at,
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


@router.post("/cart/checkout", response_model=CartCheckoutResponse, status_code=status.HTTP_201_CREATED)
def create_cart_checkout(
    payload: CartCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartCheckoutResponse:
    """Create a single payment order for all items in the cart."""
    try:
        result = create_cart_checkout_intention(db, current_user, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return CartCheckoutResponse(
        payment_order_id=result.payment_order.id,
        merchant_reference=result.payment_order.merchant_reference,
        provider_name=result.payment_order.provider_name,
        status=result.payment_order.status,
        amount_minor=result.payment_order.amount_minor,
        currency=result.payment_order.currency,
        item_count=result.item_count,
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


@router.get("/wallet/transactions", response_model=BillingWalletTransactionsResponse)
def get_wallet_transactions(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingWalletTransactionsResponse:
    """Return recent wallet ledger rows for the authenticated user."""
    bounded_limit = max(1, min(limit, 100))
    transactions = list_wallet_transactions_for_user(db, current_user.id, bounded_limit)
    return BillingWalletTransactionsResponse(
        user_id=current_user.id,
        transactions=[_wallet_transaction_to_schema(transaction) for transaction in transactions],
    )


@router.get("/feature-credits", response_model=dict)
def get_feature_credits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Return available feature credit balances for the authenticated user."""
    return get_all_feature_balances(db, current_user.id)


@router.post("/verify-payment", response_model=PaymentVerifyResponse)
def verify_payment(
    payload: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentVerifyResponse:
    """Verify a payment with Paymob after redirect and activate the order if confirmed paid."""
    if not payload.payment_order_id and not payload.merchant_reference and not payload.paymob_transaction_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide payment_order_id, merchant_reference, or paymob_transaction_id.",
        )
    try:
        final_status = verify_and_activate_payment_order(
            db,
            payment_order_id=payload.payment_order_id,
            merchant_reference=payload.merchant_reference,
            user_id=current_user.id,
            paymob_transaction_id=payload.paymob_transaction_id,
            redirect_params=payload.redirect_params,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    from app.models.enums import PaymentOrderStatus as _POS
    return PaymentVerifyResponse(
        status=final_status.value,
        activated=final_status == _POS.PAID,
    )


@router.post("/paymob/webhook", response_model=BillingWebhookResponse)
async def handle_paymob_webhook(
    request: Request,
    db: Session = Depends(get_db),
    hmac_header: str | None = Header(default=None, alias="hmac"),
    x_hmac_header: str | None = Header(default=None, alias="x-hmac"),
    x_paymob_hmac: str | None = Header(default=None, alias="x-paymob-hmac"),
    x_paymob_signature: str | None = Header(default=None, alias="x-paymob-signature"),
) -> BillingWebhookResponse:
    """Verify and reconcile a Paymob webhook callback."""
    raw_body = await request.body()
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook JSON payload.") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook payload must be a JSON object.")

    # Accept HMAC from headers, query string, or top-level payload field.
    # Paymob KSA (unified checkout) may deliver the HMAC via query param ?hmac=
    # or embed it in the JSON body rather than using an HTTP header.
    hmac_from_query = request.query_params.get("hmac") or request.query_params.get("HMAC")
    hmac_from_body = payload.get("hmac") or payload.get("HMAC")
    provided_hmac = (
        hmac_header or x_hmac_header or x_paymob_hmac or x_paymob_signature
        or hmac_from_query or hmac_from_body
    )

    if not provided_hmac:
        # Log everything so we can identify where Paymob KSA puts the HMAC.
        safe_headers = {
            k: (v[:20] + "…" if len(v) > 20 else v)
            for k, v in request.headers.items()
            if k.lower() not in ("cookie", "authorization")
        }
        logger.error(
            "WEBHOOK_MISSING_HMAC: no HMAC found in headers/query/body. "
            "headers=%s | query=%s | body_keys=%s | body_snippet=%s",
            safe_headers,
            dict(request.query_params),
            list(payload.keys()),
            raw_body[:300],
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing HMAC signature.",
        )

    try:
        result = process_paymob_webhook(
            db,
            payload,
            provided_hmac=str(provided_hmac) if provided_hmac else None,
            raw_body=raw_body,
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


@router.post("/verify-all-pending", response_model=dict)
def verify_all_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Check all pending payment orders for the current user against Paymob and activate any confirmed paid."""
    return verify_all_pending_for_user(db, str(current_user.id))


@router.get("/webhook-events", response_model=list)
def get_webhook_events(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list:
    """Return recent Paymob webhook events for the current user's orders (diagnostic)."""
    from app.models.payment_webhook_event import PaymentWebhookEvent as _PWE

    bounded_limit = max(1, min(limit, 50))
    events = db.scalars(
        select(_PWE)
        .where(_PWE.user_id == str(current_user.id))
        .order_by(_PWE.received_at.desc())
        .limit(bounded_limit)
    ).all()
    return [
        {
            "event_id": str(e.id),
            "status": e.status.value,
            "signature_valid": e.signature_valid,
            "event_type": e.event_type,
            "payment_order_id": str(e.payment_order_id) if e.payment_order_id else None,
            "provider_transaction_id": e.provider_transaction_id,
            "processing_error": e.processing_error,
            "retry_count": e.retry_count,
            "received_at": e.received_at.isoformat() if e.received_at else None,
            "processed_at": e.processed_at.isoformat() if e.processed_at else None,
        }
        for e in events
    ]


@router.post("/admin/force-activate", response_model=dict)
def admin_force_activate_order(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Admin-only: force-activate a payment order that Paymob confirmed but the webhook missed.

    Accepts JSON body with one of:
    - { "payment_order_id": "..." }
    - { "user_email": "...", "payment_order_id": "..." }
    """
    from app.models.enums import UserRole as _Role
    from app.models.user import User as _User
    from app.services.paymob_webhook_service import manually_activate_payment_order

    if current_user.role != _Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    payment_order_id = (body.get("payment_order_id") or "").strip()
    if not payment_order_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="payment_order_id is required.")

    # Optionally resolve by user email for cross-checking
    user_email = (body.get("user_email") or "").strip()
    if user_email:
        target_user = db.scalar(select(_User).where(_User.email == user_email))
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {user_email} not found.")

    try:
        manually_activate_payment_order(db, payment_order_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    return {"activated": True, "payment_order_id": payment_order_id}


@router.get("/debug-pending", response_model=list)
def debug_pending_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list:
    """Diagnostic: return pending orders with their Paymob lookup results."""
    from app.models.enums import PaymentOrderStatus as _POS
    from app.models.payment_order import PaymentOrder as _PO
    from app.services.paymob_service import query_paymob_transactions_by_order as _q

    orders = db.scalars(
        select(_PO).where(
            _PO.user_id == str(current_user.id),
            _PO.status.in_([_POS.PAYMENT_KEY_ISSUED, _POS.PENDING]),
        )
    ).all()

    result = []
    for o in orders:
        try:
            txns = _q(merchant_reference=o.merchant_reference, paymob_order_id=o.provider_order_id)
        except Exception as exc:
            txns = [{"error": str(exc)}]
        result.append({
            "order_id": str(o.id),
            "status": o.status.value,
            "amount": o.amount_minor,
            "merchant_reference": o.merchant_reference,
            "provider_order_id": o.provider_order_id,
            "provider_transaction_id": o.provider_transaction_id,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "paymob_transactions_found": len([t for t in txns if not t.get("error")]),
            "paymob_successful": len([t for t in txns if t.get("success") and not t.get("pending")]),
            "paymob_raw": txns[:2],  # first 2 transactions only
        })
    return result


@router.post("/promo/validate", response_model=BillingPromoValidateResponse)
def validate_promo_code(
    body: BillingPromoValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingPromoValidateResponse:
    """Check whether a promo code is valid for the current user and plan. Read-only — never increments uses_count."""
    code = body.code.strip().upper()
    promo = db.scalar(select(PromoCode).where(PromoCode.code == code, PromoCode.is_active.is_(True)))
    if not promo:
        return BillingPromoValidateResponse(valid=False, message="Invalid or inactive promo code.")

    now = datetime.now(timezone.utc)
    if promo.valid_from and promo.valid_from > now:
        return BillingPromoValidateResponse(valid=False, message="This promo code is not yet active.")
    if promo.valid_until and promo.valid_until < now:
        return BillingPromoValidateResponse(valid=False, message="This promo code has expired.")

    if promo.max_uses is not None and promo.uses_count >= promo.max_uses:
        return BillingPromoValidateResponse(valid=False, message="This promo code has reached its usage limit.")

    if promo.applicable_to != "all" and promo.applicable_to != current_user.role.value:
        return BillingPromoValidateResponse(valid=False, message="This promo code is not available for your account type.")

    if promo.plan_id is not None and promo.plan_id != body.plan_id:
        return BillingPromoValidateResponse(valid=False, message="This promo code is not valid for the selected plan.")

    user_uses = db.scalar(
        select(func.count()).select_from(PromoCodeUsage).where(
            PromoCodeUsage.promo_code_id == promo.id,
            PromoCodeUsage.user_id == current_user.id,
        )
    ) or 0
    if user_uses >= promo.max_uses_per_user:
        return BillingPromoValidateResponse(valid=False, message="You have already used this promo code.")

    plan = db.get(Plan, body.plan_id)
    if not plan or plan.price_amount_minor is None:
        return BillingPromoValidateResponse(valid=False, message="Plan not found.")

    if promo.discount_type == "percentage":
        discount_applied = round(plan.price_amount_minor * promo.discount_value / 10000)
    else:
        discount_applied = min(promo.discount_value, plan.price_amount_minor)

    return BillingPromoValidateResponse(
        valid=True,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        discount_applied_minor=discount_applied,
    )
