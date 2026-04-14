"""Billing orchestration helpers for plans, checkout, and account state."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import (
    PaymentOrderStatus,
    PaymentOrderType,
    PlanAudience,
    PlanKind,
    SubscriptionStatus,
    UserRole,
)
from app.models.mixins import utc_now
from app.models.payment_order import PaymentOrder
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.models.user_wallet import UserWallet
from app.models.wallet_transaction import WalletTransaction
from app.schemas.billing import BillingCheckoutIntentionRequest
from app.services.paymob_service import (
    PaymobBillingData,
    PaymobPaymentIntention,
    create_points_pack_payment_intention,
    create_subscription_payment_intention,
)

OPEN_SUBSCRIPTION_STATUSES = {
    SubscriptionStatus.PENDING_ACTIVATION,
    SubscriptionStatus.TRIALING,
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAST_DUE,
}

RENEWAL_SUBSCRIPTION_STATUSES = {
    SubscriptionStatus.TRIALING,
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAST_DUE,
}

PAYMENT_ORDER_EXPIRY_MINUTES = 30


@dataclass(frozen=True)
class BillingCheckoutResult:
    """Result of a newly created checkout session."""

    plan: Plan
    payment_order: PaymentOrder
    paymob_intention: PaymobPaymentIntention


def _plan_audience_for_role(role: UserRole) -> PlanAudience:
    if role == UserRole.RECRUITER:
        return PlanAudience.RECRUITER
    return PlanAudience.JOBSEEKER


def list_plans_for_user(db: Session, user: User) -> list[Plan]:
    """Return active commercial plans available to the authenticated user."""
    return list(
        db.scalars(
            select(Plan)
            .where(
                Plan.is_active.is_(True),
                Plan.audience == _plan_audience_for_role(user.role),
            )
            .order_by(Plan.display_order.asc(), Plan.created_at.asc())
        )
    )


def get_plan_for_user_or_raise(db: Session, user: User, plan_code: str) -> Plan:
    """Resolve a plan code and ensure it is valid for the user's role."""
    normalized_code = plan_code.strip()
    if not normalized_code:
        raise ValueError("Plan code is required.")

    plan = db.scalar(
        select(Plan).where(
            Plan.code == normalized_code,
            Plan.is_active.is_(True),
        )
    )
    if not plan:
        raise LookupError("Plan not found.")

    if plan.audience != _plan_audience_for_role(user.role):
        raise PermissionError("This plan is not available for your account role.")

    if plan.kind == PlanKind.POINTS_PACK and user.role != UserRole.JOBSEEKER:
        raise PermissionError("Only jobseeker accounts can purchase points packs.")

    if plan.kind == PlanKind.SUBSCRIPTION and plan.billing_interval.value != "monthly":
        raise ValueError("Only monthly subscription plans are supported for checkout.")

    if plan.kind == PlanKind.POINTS_PACK and plan.billing_interval.value != "one_time":
        raise ValueError("Points packs must use a one-time billing interval.")

    if not plan.price_amount_minor or plan.price_amount_minor <= 0:
        raise ValueError("Selected plan is missing a valid price configuration.")

    return plan


def get_current_subscription(db: Session, user_id: str) -> Subscription | None:
    """Return the latest active or pending subscription for a user."""
    current_subscription = db.scalar(
        select(Subscription)
        .where(
            Subscription.user_id == user_id,
            Subscription.status.in_(tuple(OPEN_SUBSCRIPTION_STATUSES)),
        )
        .order_by(Subscription.created_at.desc())
    )
    if current_subscription:
        return current_subscription

    return db.scalar(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc())
    )


def get_wallet_for_user(db: Session, user_id: str) -> UserWallet | None:
    """Return the wallet row for a user, if one exists."""
    return db.scalar(
        select(UserWallet).where(UserWallet.user_id == user_id)
    )


def list_recent_payment_orders_for_user(db: Session, user_id: str, limit: int = 10) -> list[PaymentOrder]:
    """Return recent payment orders with their plan relationship preloaded."""
    return list(
        db.scalars(
            select(PaymentOrder)
            .options(selectinload(PaymentOrder.plan))
            .where(PaymentOrder.user_id == user_id)
            .order_by(PaymentOrder.created_at.desc())
            .limit(limit)
        )
    )



def list_wallet_transactions_for_user(db: Session, user_id: str, limit: int = 20) -> list[WalletTransaction]:
    """Return recent wallet ledger rows for a user."""
    return list(
        db.scalars(
            select(WalletTransaction)
            .where(WalletTransaction.user_id == user_id)
            .order_by(WalletTransaction.effective_at.desc(), WalletTransaction.created_at.desc())
            .limit(limit)
        )
    )

def _split_full_name(full_name: str | None) -> tuple[str, str]:
    normalized_name = (full_name or "").strip()
    if not normalized_name:
        return ("JobAI", "Customer")

    parts = normalized_name.split()
    if len(parts) == 1:
        return (parts[0], "Customer")

    return (parts[0], " ".join(parts[1:]))


def _build_paymob_billing_data(user: User, payload: BillingCheckoutIntentionRequest) -> PaymobBillingData:
    fallback_first_name, fallback_last_name = _split_full_name(user.full_name)
    billing_data = payload.billing_data

    return PaymobBillingData(
        email=billing_data.email or user.email,
        first_name=billing_data.first_name or fallback_first_name,
        last_name=billing_data.last_name or fallback_last_name,
        phone_number=billing_data.phone_number,
        apartment=billing_data.apartment or "NA",
        floor=billing_data.floor or "NA",
        street=billing_data.street or "NA",
        building=billing_data.building or "NA",
        shipping_method=billing_data.shipping_method or "NA",
        postal_code=billing_data.postal_code or "NA",
        city=billing_data.city or "NA",
        country=billing_data.country or "SA",
        state=billing_data.state or "NA",
    )


def _build_merchant_reference(user: User, plan: Plan) -> str:
    return f"jobai-{user.role}-{plan.code}-{uuid4().hex}"


def _build_idempotency_key() -> str:
    return uuid4().hex


def _extract_provider_order_id(response_payload: dict | None) -> str | None:
    if not isinstance(response_payload, dict):
        return None

    for key in ("order_id", "merchant_order_id"):
        value = response_payload.get(key)
        if value:
            return str(value)

    nested_order = response_payload.get("order")
    if isinstance(nested_order, dict):
        nested_value = nested_order.get("id") or nested_order.get("order_id")
        if nested_value:
            return str(nested_value)

    return None


def _build_subscription_order_type(subscription: Subscription | None) -> PaymentOrderType:
    if subscription and subscription.status in RENEWAL_SUBSCRIPTION_STATUSES:
        return PaymentOrderType.SUBSCRIPTION_RENEWAL
    return PaymentOrderType.SUBSCRIPTION_INITIAL


def _prepare_subscription_for_checkout(db: Session, user: User, plan: Plan) -> tuple[Subscription, bool]:
    existing_subscription = get_current_subscription(db, user.id)

    if (
        existing_subscription
        and existing_subscription.plan_id == plan.id
        and existing_subscription.status == SubscriptionStatus.PENDING_ACTIVATION
    ):
        existing_subscription.provider_name = "paymob"
        existing_subscription.plan_name = plan.name
        return (existing_subscription, False)

    subscription = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        plan_name=plan.name,
        status=SubscriptionStatus.PENDING_ACTIVATION,
        provider_name="paymob",
        provider_customer_id=None,
        provider_subscription_id=None,
        current_period_start=None,
        current_period_end=None,
        cancel_at_period_end=False,
    )
    db.add(subscription)
    db.flush()
    return (subscription, True)


def _build_payment_order(
    user: User,
    plan: Plan,
    *,
    order_type: PaymentOrderType,
    subscription: Subscription | None = None,
) -> PaymentOrder:
    return PaymentOrder(
        user_id=user.id,
        plan_id=plan.id,
        subscription_id=subscription.id if subscription else None,
        order_type=order_type,
        status=PaymentOrderStatus.PENDING,
        amount_minor=plan.price_amount_minor or 0,
        currency=plan.currency,
        provider_name="paymob",
        merchant_reference=_build_merchant_reference(user, plan),
        idempotency_key=_build_idempotency_key(),
        expired_at=utc_now() + timedelta(minutes=PAYMENT_ORDER_EXPIRY_MINUTES),
    )


def create_checkout_intention(
    db: Session,
    user: User,
    payload: BillingCheckoutIntentionRequest,
) -> BillingCheckoutResult:
    """Create a local payment order, then request a Paymob payment intention."""
    plan = get_plan_for_user_or_raise(db, user, payload.plan_code)
    billing_data = _build_paymob_billing_data(user, payload)

    existing_subscription = get_current_subscription(db, user.id) if plan.kind == PlanKind.SUBSCRIPTION else None
    subscription: Subscription | None = None
    created_subscription = False
    if plan.kind == PlanKind.SUBSCRIPTION:
        subscription, created_subscription = _prepare_subscription_for_checkout(db, user, plan)
    order_type = (
        _build_subscription_order_type(existing_subscription)
        if plan.kind == PlanKind.SUBSCRIPTION
        else PaymentOrderType.POINTS_PURCHASE
    )

    payment_order = _build_payment_order(
        user,
        plan,
        order_type=order_type,
        subscription=subscription,
    )
    db.add(payment_order)
    db.flush()

    try:
        if plan.kind == PlanKind.SUBSCRIPTION:
            intention = create_subscription_payment_intention(
                payment_order,
                billing_data,
                plan=plan,
            )
        else:
            intention = create_points_pack_payment_intention(
                payment_order,
                billing_data,
                plan=plan,
            )
    except Exception as exc:
        if created_subscription and subscription is not None:
            payment_order.subscription_id = None
            db.delete(subscription)
        payment_order.status = PaymentOrderStatus.FAILED
        payment_order.failure_reason = str(exc)
        db.commit()
        raise

    payment_order.status = PaymentOrderStatus.PAYMENT_KEY_ISSUED
    payment_order.provider_order_id = _extract_provider_order_id(intention.raw_response)
    payment_order.provider_payment_key = intention.client_secret
    payment_order.request_payload = intention.request_payload
    payment_order.response_payload = intention.raw_response

    db.commit()
    db.refresh(payment_order)

    return BillingCheckoutResult(
        plan=plan,
        payment_order=payment_order,
        paymob_intention=intention,
    )
