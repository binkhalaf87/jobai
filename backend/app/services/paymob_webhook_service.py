"""Webhook verification and finalization logic for Paymob transaction callbacks."""

from __future__ import annotations

import calendar
import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.enums import (
    PaymentOrderStatus,
    PaymentOrderType,
    PaymentWebhookEventStatus,
    PlanKind,
    SubscriptionStatus,
    WalletTransactionDirection,
    WalletTransactionStatus,
    WalletTransactionType,
)
from app.models.mixins import utc_now
from app.models.payment_order import PaymentOrder
from app.models.payment_webhook_event import PaymentWebhookEvent
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user_wallet import UserWallet
from app.models.wallet_transaction import WalletTransaction
from app.services.paymob_service import get_paymob_hmac_secret

PAYMOB_TRANSACTION_HMAC_FIELDS = (
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order.id",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "source_data.type",
    "success",
)

ACTIVE_SUBSCRIPTION_STATUSES = {
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIALING,
    SubscriptionStatus.PAST_DUE,
}


class InvalidPaymobHmacError(ValueError):
    """Raised when a webhook HMAC does not match the expected signature."""


class PaymobWebhookValidationError(ValueError):
    """Raised when a webhook payload cannot be reconciled safely."""


@dataclass(frozen=True)
class PaymobWebhookProcessResult:
    """Summary of a processed Paymob webhook event."""

    event_id: str
    payment_order_id: str | None
    status: str
    duplicate: bool


def _normalize_hmac_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _get_nested_value(payload: dict[str, Any], path: str) -> Any:
    current: Any = payload
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def compute_paymob_transaction_hmac(event_payload: dict[str, Any], hmac_secret: str | None = None) -> str:
    """Compute the expected HMAC signature for a Paymob transaction callback."""
    secret = hmac_secret or get_paymob_hmac_secret()
    signature_source = "".join(
        _normalize_hmac_value(_get_nested_value(event_payload, field_name))
        for field_name in PAYMOB_TRANSACTION_HMAC_FIELDS
    )
    return hmac.new(
        secret.encode("utf-8"),
        signature_source.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()


def verify_paymob_webhook_hmac(event_payload: dict[str, Any], provided_hmac: str | None) -> bool:
    """Verify a Paymob callback HMAC using timing-safe comparison."""
    if not provided_hmac:
        return False

    expected_hmac = compute_paymob_transaction_hmac(event_payload)
    return hmac.compare_digest(expected_hmac.lower(), provided_hmac.strip().lower())


def _extract_event_object(payload: dict[str, Any]) -> dict[str, Any]:
    nested_object = payload.get("obj")
    if isinstance(nested_object, dict):
        return nested_object
    return payload


def _extract_event_type(payload: dict[str, Any], event_object: dict[str, Any]) -> str:
    return str(payload.get("type") or event_object.get("type") or "transaction_processed")


def _extract_transaction_id(event_object: dict[str, Any]) -> str | None:
    transaction_id = event_object.get("id") or event_object.get("transaction_id")
    return str(transaction_id) if transaction_id else None


def _extract_provider_order_id(event_object: dict[str, Any]) -> str | None:
    order_payload = event_object.get("order")
    if isinstance(order_payload, dict):
        order_id = order_payload.get("id") or order_payload.get("order_id")
        if order_id:
            return str(order_id)

    fallback_order_id = event_object.get("order_id")
    return str(fallback_order_id) if fallback_order_id else None


def _extract_merchant_reference(event_object: dict[str, Any]) -> str | None:
    order_payload = event_object.get("order")
    if isinstance(order_payload, dict):
        merchant_order_id = order_payload.get("merchant_order_id")
        if merchant_order_id:
            return str(merchant_order_id)

    fallback_reference = event_object.get("merchant_order_id") or event_object.get("merchant_reference")
    return str(fallback_reference) if fallback_reference else None


def _extract_amount_minor(event_object: dict[str, Any]) -> int | None:
    amount_value = event_object.get("amount_cents") or event_object.get("amount")
    if amount_value in (None, ""):
        return None

    try:
        return int(amount_value)
    except (TypeError, ValueError):
        return None


def _extract_currency(event_object: dict[str, Any]) -> str | None:
    currency = event_object.get("currency")
    return str(currency) if currency else None


def _parse_event_datetime(raw_value: Any) -> datetime | None:
    if not raw_value:
        return None
    if not isinstance(raw_value, str):
        return None

    candidate = raw_value.strip()
    if not candidate:
        return None

    if candidate.endswith("Z"):
        candidate = candidate[:-1] + "+00:00"

    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def _is_successful_payment(event_object: dict[str, Any]) -> bool:
    return bool(event_object.get("success")) and not bool(event_object.get("pending"))


def _map_unsuccessful_order_status(event_object: dict[str, Any]) -> PaymentOrderStatus | None:
    if bool(event_object.get("pending")):
        return None
    if bool(event_object.get("is_voided")):
        return PaymentOrderStatus.CANCELED
    if bool(event_object.get("is_refunded")):
        return PaymentOrderStatus.REFUNDED
    return PaymentOrderStatus.FAILED


def _add_one_month(reference: datetime) -> datetime:
    year = reference.year
    month = reference.month + 1
    if month == 13:
        year += 1
        month = 1

    day = min(reference.day, calendar.monthrange(year, month)[1])
    return reference.replace(year=year, month=month, day=day)


def _get_or_create_webhook_event(
    db: Session,
    *,
    event_type: str,
    provider_event_id: str | None,
    provider_order_id: str | None,
    provider_transaction_id: str | None,
    payload: dict[str, Any],
) -> tuple[PaymentWebhookEvent, bool]:
    existing_event: PaymentWebhookEvent | None = None
    if provider_event_id:
        existing_event = db.scalar(
            select(PaymentWebhookEvent).where(PaymentWebhookEvent.provider_event_id == provider_event_id)
        )

    if existing_event:
        existing_event.retry_count += 1
        existing_event.event_payload = payload
        existing_event.provider_order_id = provider_order_id
        existing_event.provider_transaction_id = provider_transaction_id
        existing_event.event_type = event_type
        return (existing_event, True)

    webhook_event = PaymentWebhookEvent(
        provider_name="paymob",
        event_type=event_type,
        provider_event_id=provider_event_id,
        provider_order_id=provider_order_id,
        provider_transaction_id=provider_transaction_id,
        event_payload=payload,
        retry_count=0,
        status=PaymentWebhookEventStatus.RECEIVED,
        signature_valid=False,
    )
    db.add(webhook_event)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        if not provider_event_id:
            raise

        duplicate_event = db.scalar(
            select(PaymentWebhookEvent).where(PaymentWebhookEvent.provider_event_id == provider_event_id)
        )
        if not duplicate_event:
            raise

        duplicate_event.retry_count += 1
        duplicate_event.event_payload = payload
        duplicate_event.provider_order_id = provider_order_id
        duplicate_event.provider_transaction_id = provider_transaction_id
        duplicate_event.event_type = event_type
        return (duplicate_event, True)

    return (webhook_event, False)


def _get_payment_order_for_event(
    db: Session,
    *,
    merchant_reference: str | None,
    provider_order_id: str | None,
) -> PaymentOrder | None:
    query = (
        select(PaymentOrder)
        .options(selectinload(PaymentOrder.plan), selectinload(PaymentOrder.subscription))
        .with_for_update()
    )

    if merchant_reference:
        return db.scalar(query.where(PaymentOrder.merchant_reference == merchant_reference))

    if provider_order_id:
        return db.scalar(query.where(PaymentOrder.provider_order_id == provider_order_id))

    return None


def _get_order_amount_error(payment_order: PaymentOrder, event_object: dict[str, Any]) -> str | None:
    webhook_amount_minor = _extract_amount_minor(event_object)
    if webhook_amount_minor is not None and webhook_amount_minor != payment_order.amount_minor:
        return "Webhook amount does not match internal payment order amount."

    webhook_currency = _extract_currency(event_object)
    if webhook_currency and webhook_currency.upper() != payment_order.currency.upper():
        return "Webhook currency does not match internal payment order currency."

    return None


def _resolve_subscription_for_activation(db: Session, payment_order: PaymentOrder) -> tuple[Subscription, Subscription | None]:
    placeholder_subscription: Subscription | None = None
    if payment_order.subscription_id:
        placeholder_subscription = db.scalar(
            select(Subscription)
            .where(Subscription.id == payment_order.subscription_id)
            .with_for_update()
        )

    if payment_order.order_type == PaymentOrderType.SUBSCRIPTION_RENEWAL:
        renewal_filters = [
            Subscription.user_id == payment_order.user_id,
            Subscription.plan_id == payment_order.plan_id,
            Subscription.status.in_(tuple(ACTIVE_SUBSCRIPTION_STATUSES)),
        ]
        if payment_order.subscription_id:
            renewal_filters.append(Subscription.id != payment_order.subscription_id)

        current_subscription = db.scalar(
            select(Subscription)
            .where(*renewal_filters)
            .order_by(Subscription.created_at.desc())
            .with_for_update()
        )
        if current_subscription:
            return (current_subscription, placeholder_subscription)

    if placeholder_subscription:
        return (placeholder_subscription, placeholder_subscription)

    subscription = Subscription(
        user_id=payment_order.user_id,
        plan_id=payment_order.plan_id,
        plan_name=payment_order.plan.name if payment_order.plan else "Subscription",
        status=SubscriptionStatus.PENDING_ACTIVATION,
        provider_name="paymob",
    )
    db.add(subscription)
    db.flush()
    return (subscription, placeholder_subscription)


def _activate_subscription_for_order(
    db: Session,
    payment_order: PaymentOrder,
    processed_at: datetime,
) -> None:
    subscription, placeholder_subscription = _resolve_subscription_for_activation(db, payment_order)

    period_start = processed_at
    if (
        payment_order.order_type == PaymentOrderType.SUBSCRIPTION_RENEWAL
        and subscription.current_period_end
        and subscription.current_period_end > processed_at
    ):
        period_start = subscription.current_period_end

    subscription.plan_id = payment_order.plan_id
    subscription.plan_name = payment_order.plan.name if payment_order.plan else subscription.plan_name
    subscription.provider_name = "paymob"
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.current_period_start = period_start
    subscription.current_period_end = _add_one_month(period_start)
    subscription.cancel_at_period_end = False

    if placeholder_subscription and placeholder_subscription.id != subscription.id:
        placeholder_subscription.status = SubscriptionStatus.CANCELED
        placeholder_subscription.current_period_start = None
        placeholder_subscription.current_period_end = None

    payment_order.subscription_id = subscription.id


def _get_or_create_wallet(db: Session, user_id: str) -> UserWallet:
    wallet = db.scalar(
        select(UserWallet)
        .where(UserWallet.user_id == user_id)
        .with_for_update()
    )
    if wallet:
        return wallet

    wallet = UserWallet(
        user_id=user_id,
        balance_points=0,
        lifetime_earned_points=0,
        lifetime_spent_points=0,
        is_active=True,
    )
    db.add(wallet)
    db.flush()
    return wallet


def _credit_wallet_for_order(
    db: Session,
    payment_order: PaymentOrder,
    processed_at: datetime,
    transaction_id: str | None,
    event_payload: dict[str, Any],
) -> None:
    existing_transaction = db.scalar(
        select(WalletTransaction)
        .where(
            WalletTransaction.payment_order_id == payment_order.id,
            WalletTransaction.transaction_type == WalletTransactionType.POINTS_PURCHASE,
            WalletTransaction.status == WalletTransactionStatus.POSTED,
        )
        .with_for_update()
    )
    if existing_transaction:
        return

    if not payment_order.plan or payment_order.plan.points_grant <= 0:
        raise ValueError("Points purchase plan is missing a positive points grant.")

    wallet = _get_or_create_wallet(db, payment_order.user_id)
    balance_before = wallet.balance_points
    balance_after = balance_before + payment_order.plan.points_grant

    wallet.balance_points = balance_after
    wallet.lifetime_earned_points += payment_order.plan.points_grant

    wallet_transaction = WalletTransaction(
        wallet_id=wallet.id,
        user_id=payment_order.user_id,
        payment_order_id=payment_order.id,
        subscription_id=payment_order.subscription_id,
        transaction_type=WalletTransactionType.POINTS_PURCHASE,
        status=WalletTransactionStatus.POSTED,
        direction=WalletTransactionDirection.CREDIT,
        points=payment_order.plan.points_grant,
        balance_before=balance_before,
        balance_after=balance_after,
        description=f"Points purchase for plan {payment_order.plan.code}",
        source_ref=transaction_id,
        event_payload=event_payload,
        effective_at=processed_at,
    )
    db.add(wallet_transaction)


def _finalize_paid_order(
    db: Session,
    payment_order: PaymentOrder,
    event_object: dict[str, Any],
    event_payload: dict[str, Any],
) -> None:
    processed_at = _parse_event_datetime(event_object.get("created_at")) or utc_now()
    transaction_id = _extract_transaction_id(event_object)

    if (
        payment_order.provider_transaction_id
        and transaction_id
        and payment_order.provider_transaction_id != transaction_id
        and payment_order.status == PaymentOrderStatus.PAID
    ):
        raise ValueError("Paid payment order is already linked to a different transaction id.")

    payment_order.status = PaymentOrderStatus.PAID
    payment_order.provider_name = "paymob"
    payment_order.provider_order_id = _extract_provider_order_id(event_object) or payment_order.provider_order_id
    payment_order.provider_transaction_id = transaction_id or payment_order.provider_transaction_id
    payment_order.failure_reason = None
    payment_order.paid_at = processed_at

    if payment_order.plan and payment_order.plan.kind == PlanKind.SUBSCRIPTION:
        _activate_subscription_for_order(db, payment_order, processed_at)
    elif payment_order.plan and payment_order.plan.kind == PlanKind.POINTS_PACK:
        _credit_wallet_for_order(db, payment_order, processed_at, transaction_id, event_payload)


def process_paymob_webhook(
    db: Session,
    payload: dict[str, Any],
    *,
    provided_hmac: str | None,
) -> PaymobWebhookProcessResult:
    """Verify, persist, and reconcile a Paymob transaction callback."""
    event_object = _extract_event_object(payload)
    provider_transaction_id = _extract_transaction_id(event_object)
    provider_order_id = _extract_provider_order_id(event_object)
    merchant_reference = _extract_merchant_reference(event_object)
    event_type = _extract_event_type(payload, event_object)

    webhook_event, was_duplicate_record = _get_or_create_webhook_event(
        db,
        event_type=event_type,
        provider_event_id=provider_transaction_id,
        provider_order_id=provider_order_id,
        provider_transaction_id=provider_transaction_id,
        payload=payload,
    )

    signature_valid = verify_paymob_webhook_hmac(event_object, provided_hmac)
    webhook_event.signature_valid = signature_valid
    if not signature_valid:
        webhook_event.status = PaymentWebhookEventStatus.FAILED
        webhook_event.processing_error = "Invalid Paymob HMAC signature."
        webhook_event.processed_at = utc_now()
        db.commit()
        raise InvalidPaymobHmacError("Invalid Paymob HMAC signature.")

    if webhook_event.status == PaymentWebhookEventStatus.PROCESSED:
        db.commit()
        return PaymobWebhookProcessResult(
            event_id=webhook_event.id,
            payment_order_id=webhook_event.payment_order_id,
            status=webhook_event.status.value,
            duplicate=True,
        )

    payment_order = _get_payment_order_for_event(
        db,
        merchant_reference=merchant_reference,
        provider_order_id=provider_order_id,
    )
    if not payment_order:
        webhook_event.status = PaymentWebhookEventStatus.FAILED
        webhook_event.processing_error = "Payment order not found for Paymob webhook."
        webhook_event.processed_at = utc_now()
        db.commit()
        raise LookupError("Payment order not found for Paymob webhook.")

    webhook_event.payment_order_id = payment_order.id
    webhook_event.subscription_id = payment_order.subscription_id
    webhook_event.user_id = payment_order.user_id

    amount_error = _get_order_amount_error(payment_order, event_object)
    if amount_error:
        webhook_event.status = PaymentWebhookEventStatus.FAILED
        webhook_event.processing_error = amount_error
        webhook_event.processed_at = utc_now()
        db.commit()
        raise PaymobWebhookValidationError(amount_error)

    if payment_order.status == PaymentOrderStatus.PAID and (
        not provider_transaction_id or payment_order.provider_transaction_id == provider_transaction_id
    ):
        webhook_event.status = PaymentWebhookEventStatus.PROCESSED
        webhook_event.processing_error = None
        webhook_event.processed_at = utc_now()
        db.commit()
        return PaymobWebhookProcessResult(
            event_id=webhook_event.id,
            payment_order_id=payment_order.id,
            status=webhook_event.status.value,
            duplicate=True,
        )

    if _is_successful_payment(event_object):
        _finalize_paid_order(db, payment_order, event_object, payload)
        webhook_event.subscription_id = payment_order.subscription_id
        webhook_event.user_id = payment_order.user_id
        webhook_event.status = PaymentWebhookEventStatus.PROCESSED
        webhook_event.processing_error = None
        webhook_event.processed_at = utc_now()
        db.commit()
        return PaymobWebhookProcessResult(
            event_id=webhook_event.id,
            payment_order_id=payment_order.id,
            status=webhook_event.status.value,
            duplicate=was_duplicate_record,
        )

    mapped_order_status = _map_unsuccessful_order_status(event_object)
    if mapped_order_status is None:
        webhook_event.status = PaymentWebhookEventStatus.IGNORED
        webhook_event.processing_error = "Pending Paymob webhook ignored until payment is finalized."
        webhook_event.processed_at = utc_now()
        db.commit()
        return PaymobWebhookProcessResult(
            event_id=webhook_event.id,
            payment_order_id=payment_order.id,
            status=webhook_event.status.value,
            duplicate=was_duplicate_record,
        )

    payment_order.status = mapped_order_status
    payment_order.provider_name = "paymob"
    payment_order.provider_order_id = provider_order_id or payment_order.provider_order_id
    payment_order.provider_transaction_id = provider_transaction_id or payment_order.provider_transaction_id
    payment_order.failure_reason = json.dumps(event_object, ensure_ascii=True)

    webhook_event.status = PaymentWebhookEventStatus.PROCESSED
    webhook_event.processing_error = None
    webhook_event.processed_at = utc_now()
    db.commit()

    return PaymobWebhookProcessResult(
        event_id=webhook_event.id,
        payment_order_id=payment_order.id,
        status=webhook_event.status.value,
        duplicate=was_duplicate_record,
    )
