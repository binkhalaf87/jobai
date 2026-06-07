"""Webhook verification and finalization logic for Paymob transaction callbacks."""

from __future__ import annotations

import calendar
import hashlib
import hmac
import json
import logging
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
from app.models.subscription import Subscription
from app.models.user_wallet import UserWallet
from app.models.wallet_transaction import WalletTransaction
from app.models.user import User
from app.services.email_service import send_payment_invoice_email
from app.services.feature_credit_service import grant_feature_credits
from app.services.paymob_service import get_paymob_hmac_secret

logger = logging.getLogger(__name__)

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


def _compute_hmac_sha256(event_payload: dict[str, Any], hmac_secret: str) -> str:
    secret = hmac_secret
    signature_source = "".join(
        _normalize_hmac_value(_get_nested_value(event_payload, field_name))
        for field_name in PAYMOB_TRANSACTION_HMAC_FIELDS
    )
    return hmac.new(
        secret.encode("utf-8"),
        signature_source.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_paymob_webhook_hmac(
    event_payload: dict[str, Any],
    provided_hmac: str | None,
    *,
    raw_body: bytes | None = None,
) -> bool:
    """Verify a Paymob callback HMAC using timing-safe comparison.

    Tries multiple strategies in order:
    1. SHA-512 HMAC of 20 transaction fields (Paymob Egypt standard)
    2. SHA-256 HMAC of 20 transaction fields
    3. SHA-512 HMAC of the raw request body (Paymob KSA unified checkout)
    4. SHA-256 HMAC of the raw request body
    """
    if not provided_hmac:
        return False

    secret = get_paymob_hmac_secret()
    provided = provided_hmac.strip().lower()

    # Strategy 1 & 2: 20 specific transaction fields
    signature_source = "".join(
        _normalize_hmac_value(_get_nested_value(event_payload, field_name))
        for field_name in PAYMOB_TRANSACTION_HMAC_FIELDS
    )
    src_bytes = signature_source.encode("utf-8")
    key_bytes = secret.encode("utf-8")

    sha512_fields = hmac.new(key_bytes, src_bytes, hashlib.sha512).hexdigest()
    if hmac.compare_digest(sha512_fields, provided):
        return True

    sha256_fields = hmac.new(key_bytes, src_bytes, hashlib.sha256).hexdigest()
    if hmac.compare_digest(sha256_fields, provided):
        logger.info("WEBHOOK_HMAC_MATCHED_FIELDS_SHA256")
        return True

    # Strategy 3 & 4: raw request body (Paymob KSA may sign entire body)
    if raw_body:
        sha512_body = hmac.new(key_bytes, raw_body, hashlib.sha512).hexdigest()
        if hmac.compare_digest(sha512_body, provided):
            logger.info("WEBHOOK_HMAC_MATCHED_BODY_SHA512")
            return True

        sha256_body = hmac.new(key_bytes, raw_body, hashlib.sha256).hexdigest()
        if hmac.compare_digest(sha256_body, provided):
            logger.info("WEBHOOK_HMAC_MATCHED_BODY_SHA256")
            return True

        logger.warning(
            "WEBHOOK_HMAC_MISMATCH_DETAIL: "
            "sig_source_preview=%r sig_source_len=%d "
            "sha512_fields=%s sha256_fields=%s "
            "sha512_body=%s sha256_body=%s provided=%s",
            signature_source[:120], len(signature_source),
            sha512_fields[:16], sha256_fields[:16],
            sha512_body[:16], sha256_body[:16], provided[:16],
        )
    else:
        logger.warning(
            "WEBHOOK_HMAC_MISMATCH_DETAIL: "
            "sig_source_preview=%r sig_source_len=%d "
            "sha512_prefix=%s sha256_prefix=%s provided_prefix=%s",
            signature_source[:120], len(signature_source),
            sha512_fields[:16], sha256_fields[:16], provided[:16],
        )
    return False


def _extract_event_object(payload: dict[str, Any]) -> dict[str, Any]:
    # Paymob KSA (unified checkout) sends transaction data under "transaction" key.
    nested_transaction = payload.get("transaction")
    if isinstance(nested_transaction, dict):
        return nested_transaction
    # Legacy Paymob Egypt API sends under "obj" key.
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
        if (payment_order.plan.points_grant or 0) > 0:
            _credit_wallet_for_order(db, payment_order, processed_at, transaction_id, event_payload)

    # Always attempt feature credit grants if plan defines them (new pricing model)
    _credit_features_for_order(db, payment_order)


def _credit_features_for_order(db: Session, payment_order: PaymentOrder) -> None:
    """Grant feature credits — handles both single-plan and cart orders."""
    from app.models.user_feature_credit import UserFeatureCredit as _UFC

    req = payment_order.request_payload or {}
    if req.get("is_cart"):
        # Cart order: aggregate grants across all cart items
        feature_totals: dict[str, int] = {}
        for cart_item in req.get("cart_items", []):
            for g in cart_item.get("feature_grants", []):
                feat = g.get("feature")
                qty = int(g.get("quantity", 0))
                if feat and qty > 0:
                    feature_totals[feat] = feature_totals.get(feat, 0) + qty
        for feature, total_qty in feature_totals.items():
            existing = db.scalar(
                select(_UFC).where(
                    _UFC.payment_order_id == payment_order.id,
                    _UFC.feature == feature,
                )
            )
            if existing:
                continue
            grant_feature_credits(
                db,
                user_id=payment_order.user_id,
                feature=feature,
                quantity=total_qty,
                payment_order_id=payment_order.id,
            )
            logger.info(
                "CART_FEATURE_CREDIT_GRANTED: order_id=%s user_id=%s feature=%s quantity=%d",
                payment_order.id,
                payment_order.user_id,
                feature,
                total_qty,
            )
        return

    # Single-plan order: read grants from plan.metadata_payload
    if not payment_order.plan:
        return
    plan_payload = payment_order.plan.metadata_payload or {}
    grants = plan_payload.get("feature_grants", [])
    if not grants:
        return

    for grant in grants:
        feature = grant.get("feature")
        quantity = grant.get("quantity", 0)
        if not feature or quantity <= 0:
            continue
        existing = db.scalar(
            select(_UFC).where(
                _UFC.payment_order_id == payment_order.id,
                _UFC.feature == feature,
            )
        )
        if existing:
            continue
        grant_feature_credits(
            db,
            user_id=payment_order.user_id,
            feature=feature,
            quantity=quantity,
            payment_order_id=payment_order.id,
        )
        logger.info(
            "FEATURE_CREDIT_GRANTED: order_id=%s user_id=%s feature=%s quantity=%d",
            payment_order.id,
            payment_order.user_id,
            feature,
            quantity,
        )


def _send_invoice_email(db: Session, payment_order: PaymentOrder) -> None:
    try:
        user = db.get(User, payment_order.user_id)
        if not user:
            logger.warning("INVOICE_EMAIL_SKIP: user %s not found", payment_order.user_id)
            return
        req = payment_order.request_payload or {}
        if req.get("is_cart"):
            names = [item.get("plan_name", "") for item in req.get("cart_items", []) if item.get("plan_name")]
            plan_name = " + ".join(names) if names else "سلة خدمات"
        else:
            plan_name = payment_order.plan.name if payment_order.plan else "خدمة JobAI24"
        send_payment_invoice_email(
            to_email=user.email,
            name=user.full_name,
            plan_name=plan_name,
            amount_minor=payment_order.amount_minor,
            transaction_id=payment_order.provider_transaction_id,
            paid_at=payment_order.paid_at,
        )
    except Exception as exc:
        logger.exception("INVOICE_EMAIL_FAILED: order_id=%s error=%s", payment_order.id, exc)


def manually_activate_payment_order(db: Session, payment_order_id: str) -> None:
    """Admin-only: force-activate a PENDING/FAILED payment order without a webhook.

    Useful when the Paymob webhook was never received but the bank confirmed the charge.
    """
    from sqlalchemy.orm import selectinload as _sel

    order = db.scalar(
        select(PaymentOrder)
        .options(_sel(PaymentOrder.plan), _sel(PaymentOrder.subscription))
        .where(PaymentOrder.id == payment_order_id)
        .with_for_update()
    )
    if not order:
        raise LookupError(f"Payment order {payment_order_id} not found.")
    if order.status == PaymentOrderStatus.PAID:
        raise ValueError("Payment order is already PAID — no action needed.")

    processed_at = utc_now()
    fake_event_object: dict[str, Any] = {
        "success": True,
        "pending": False,
        "amount_cents": order.amount_minor,
        "currency": order.currency,
        "id": order.provider_transaction_id or f"manual-{order.id}",
        "created_at": processed_at.isoformat(),
    }
    fake_payload: dict[str, Any] = {"manual_activation": True}
    _finalize_paid_order(db, order, fake_event_object, fake_payload)
    db.commit()
    logger.warning(
        "MANUAL_ACTIVATION: order_id=%s user_id=%s plan_id=%s by admin",
        order.id,
        order.user_id,
        order.plan_id,
    )
    _send_invoice_email(db, order)


def _build_event_object_from_redirect_params(params: dict[str, str]) -> dict[str, Any]:
    """Build a transaction event_object from Paymob redirect URL query params."""
    return {
        "id": params.get("id"),
        "amount_cents": params.get("amount_cents"),
        "created_at": params.get("created_at"),
        "currency": params.get("currency"),
        "error_occured": params.get("error_occured"),
        "has_parent_transaction": params.get("has_parent_transaction"),
        "integration_id": params.get("integration_id"),
        "is_3d_secure": params.get("is_3d_secure"),
        "is_auth": params.get("is_auth"),
        "is_capture": params.get("is_capture"),
        "is_refunded": params.get("is_refunded"),
        "is_standalone_payment": params.get("is_standalone_payment"),
        "is_voided": params.get("is_voided"),
        "order": {"id": params.get("order")},
        "owner": params.get("owner"),
        "pending": params.get("pending"),
        "source_data": {
            "pan": params.get("source_data.pan"),
            "sub_type": params.get("source_data.sub_type"),
            "type": params.get("source_data.type"),
        },
        "success": params.get("success"),
    }


def _is_redirect_payment_successful(params: dict[str, str]) -> bool:
    return params.get("success", "").lower() == "true" and params.get("pending", "").lower() != "true"


def verify_and_activate_payment_order(
    db: Session,
    *,
    payment_order_id: str | None = None,
    merchant_reference: str | None = None,
    user_id: str,
    paymob_transaction_id: str | None = None,
    redirect_params: dict[str, str] | None = None,
) -> PaymentOrderStatus:
    """Verify a payment with Paymob and activate the order if confirmed successful.

    Called after Paymob redirect when webhook delivery cannot be guaranteed.
    Requires either payment_order_id or merchant_reference.
    """
    from app.services.paymob_service import query_paymob_transaction as _query_tx

    query = (
        select(PaymentOrder)
        .options(selectinload(PaymentOrder.plan), selectinload(PaymentOrder.subscription))
        .where(PaymentOrder.user_id == user_id)
        .with_for_update()
    )
    if payment_order_id:
        order = db.scalar(query.where(PaymentOrder.id == payment_order_id))
    elif merchant_reference:
        order = db.scalar(query.where(PaymentOrder.merchant_reference == merchant_reference))
    elif paymob_transaction_id:
        order = db.scalar(query.where(PaymentOrder.provider_transaction_id == paymob_transaction_id))
    else:
        raise ValueError("Provide payment_order_id, merchant_reference, or paymob_transaction_id.")

    if not order:
        raise LookupError("Payment order not found.")

    if order.status == PaymentOrderStatus.PAID:
        return order.status

    # ── Fast path: verify redirect HMAC locally — zero Paymob API calls needed ──
    # When Paymob redirects the browser after payment it appends all 20 HMAC
    # fields plus ?hmac=... to the callback URL.  We re-compute the HMAC on
    # those flat string values; if it matches we trust the result immediately.
    if redirect_params and redirect_params.get("hmac"):
        rp_hmac = redirect_params["hmac"]
        rp_event_obj = _build_event_object_from_redirect_params(redirect_params)
        if verify_paymob_webhook_hmac(rp_event_obj, rp_hmac):
            if _is_redirect_payment_successful(redirect_params):
                _finalize_paid_order(
                    db, order, rp_event_obj,
                    {"source": "redirect_verify", "redirect_hmac_valid": True},
                )
                db.commit()
                logger.info(
                    "REDIRECT_VERIFY_ACTIVATED: order_id=%s user_id=%s tx_id=%s",
                    order.id, order.user_id, redirect_params.get("id"),
                )
                _send_invoice_email(db, order)
                return PaymentOrderStatus.PAID
            else:
                # HMAC is valid but payment was not successful — map to failure status
                mapped = _map_unsuccessful_order_status(rp_event_obj)
                if mapped and order.status != mapped:
                    order.status = mapped
                    order.provider_transaction_id = redirect_params.get("id") or order.provider_transaction_id
                    db.commit()
                logger.info(
                    "REDIRECT_VERIFY_FAILED: order_id=%s user_id=%s success=%s pending=%s",
                    order.id, order.user_id, redirect_params.get("success"), redirect_params.get("pending"),
                )
                return order.status
        else:
            logger.warning(
                "REDIRECT_HMAC_INVALID: order_id=%s provided_prefix=%s — falling back to API lookup",
                order.id, rp_hmac[:12],
            )

    from app.services.paymob_service import query_paymob_transactions_by_order as _query_by_order

    tx_id = paymob_transaction_id or order.provider_transaction_id
    tx_data: dict[str, Any] | None = None

    # Attempt direct transaction lookup first (fast path: tx_id from redirect URL).
    if tx_id:
        try:
            tx_data = _query_tx(tx_id)
        except RuntimeError as exc:
            logger.warning(
                "Direct Paymob tx lookup failed for tx_id=%s order=%s: %s — falling back to order lookup",
                tx_id, order.id, exc,
            )

    # Fall back to order-based lookup when tx_id is absent or the direct call failed.
    if tx_data is None:
        try:
            txns = _query_by_order(
                merchant_reference=order.merchant_reference,
                paymob_order_id=order.provider_order_id,
            )
        except Exception as exc:
            logger.warning("Paymob order lookup failed for order %s: %s", order.id, exc)
            txns = []
        logger.info(
            "Paymob order lookup: order_id=%s merchant_ref=%s paymob_order_id=%s → %d txn(s)",
            order.id, order.merchant_reference, order.provider_order_id, len(txns),
        )
        successful = [t for t in txns if t.get("success") and not t.get("pending")]
        if not successful:
            return order.status  # not confirmed paid at Paymob yet
        best = successful[0]
        # Try to get full transaction details; use the list entry as fallback.
        try:
            tx_data = _query_tx(str(best.get("id", "")))
        except RuntimeError:
            tx_data = best
        tx_id = str(best.get("id", tx_id or ""))

    if not _is_successful_payment(tx_data):
        mapped_status = _map_unsuccessful_order_status(tx_data)
        if mapped_status and order.status != mapped_status:
            order.status = mapped_status
            order.provider_transaction_id = tx_id
            db.commit()
        return order.status

    _finalize_paid_order(db, order, tx_data, {"source": "payment_verify", "paymob_tx_id": tx_id})
    db.commit()
    logger.info(
        "VERIFY_ACTIVATED: order_id=%s user_id=%s tx_id=%s",
        order.id,
        order.user_id,
        tx_id,
    )
    _send_invoice_email(db, order)
    return PaymentOrderStatus.PAID


def verify_all_pending_for_user(db: Session, user_id: str) -> dict:
    """Check all pending payment orders for a user against Paymob and activate any confirmed paid."""
    from app.services.paymob_service import query_paymob_transactions_by_order as _q

    pending_orders = db.scalars(
        select(PaymentOrder)
        .options(selectinload(PaymentOrder.plan), selectinload(PaymentOrder.subscription))
        .where(
            PaymentOrder.user_id == user_id,
            PaymentOrder.status.in_([PaymentOrderStatus.PAYMENT_KEY_ISSUED, PaymentOrderStatus.PENDING]),
        )
    ).all()

    from app.services.billing_service import _extract_provider_order_id as _extract_oid

    activated = 0
    diagnostics = []

    for order in pending_orders:
        # Retroactively fix missing provider_order_id from stored response_payload
        if not order.provider_order_id and isinstance(order.response_payload, dict):
            recovered_id = _extract_oid(order.response_payload)
            if recovered_id:
                order.provider_order_id = recovered_id
                db.flush()
                logger.info("Recovered provider_order_id=%s for order %s", recovered_id, order.id)
        diag: dict = {
            "order_id": str(order.id),
            "status": order.status.value,
            "amount_sar": order.amount_minor / 100,
            "merchant_reference": order.merchant_reference,
            "provider_order_id": order.provider_order_id,
            "provider_transaction_id": order.provider_transaction_id,
        }
        try:
            txns = _q(merchant_reference=order.merchant_reference, paymob_order_id=order.provider_order_id)
            diag["paymob_txns_found"] = len(txns)
            diag["paymob_successful"] = len([t for t in txns if t.get("success") and not t.get("pending")])
            diag["paymob_raw_first"] = txns[0] if txns else None
        except Exception as exc:
            diag["paymob_txns_found"] = 0
            diag["paymob_error"] = str(exc)
            diag["paymob_raw_first"] = None

        try:
            result = verify_and_activate_payment_order(
                db,
                payment_order_id=str(order.id),
                user_id=user_id,
            )
            diag["result"] = result.value
            if result == PaymentOrderStatus.PAID:
                activated += 1
        except Exception as exc:
            diag["result"] = f"error: {exc}"
            logger.warning("verify_all_pending: order %s error: %s", order.id, exc)

        diagnostics.append(diag)
        logger.info("verify_all_pending diag: %s", diag)

    return {"activated": activated, "checked": len(pending_orders), "details": diagnostics}


def _extract_ksa_payment_order_id(payload: dict[str, Any]) -> str | None:
    """Extract our internal payment_order_id from Paymob KSA intention extras.

    Paymob KSA may return extras either nested under creation_extras or flat.
    """
    intention = payload.get("intention")
    if not isinstance(intention, dict):
        return None
    extras = intention.get("extras") or {}
    # Nested structure: intention.extras.creation_extras.payment_order_id
    creation_extras = extras.get("creation_extras") or {}
    po_id = creation_extras.get("payment_order_id")
    if not po_id:
        # Flat structure: intention.extras.payment_order_id
        po_id = extras.get("payment_order_id")
    return str(po_id) if po_id else None


def _extract_ksa_merchant_reference(payload: dict[str, Any]) -> str | None:
    """Extract merchant reference from Paymob KSA intention special_reference."""
    intention = payload.get("intention")
    if not isinstance(intention, dict):
        return None
    special_ref = intention.get("special_reference") or intention.get("merchant_order_id")
    return str(special_ref) if special_ref else None


def process_paymob_webhook(
    db: Session,
    payload: dict[str, Any],
    *,
    provided_hmac: str | None,
    raw_body: bytes | None = None,
) -> PaymobWebhookProcessResult:
    """Verify, persist, and reconcile a Paymob transaction callback."""
    event_object = _extract_event_object(payload)
    provider_transaction_id = _extract_transaction_id(event_object)
    provider_order_id = _extract_provider_order_id(event_object)
    merchant_reference = _extract_merchant_reference(event_object)
    event_type = _extract_event_type(payload, event_object)

    # Paymob KSA (unified checkout) stores merchant_reference in intention.special_reference.
    if not merchant_reference:
        merchant_reference = _extract_ksa_merchant_reference(payload)

    # Also capture our internal payment_order_id stored in intention extras.
    ksa_payment_order_id = _extract_ksa_payment_order_id(payload)

    webhook_event, was_duplicate_record = _get_or_create_webhook_event(
        db,
        event_type=event_type,
        provider_event_id=provider_transaction_id,
        provider_order_id=provider_order_id,
        provider_transaction_id=provider_transaction_id,
        payload=payload,
    )

    signature_valid = verify_paymob_webhook_hmac(event_object, provided_hmac, raw_body=raw_body)
    webhook_event.signature_valid = signature_valid
    if not signature_valid:
        expected_prefix = compute_paymob_transaction_hmac(event_object)[:12]
        provided_prefix = (provided_hmac or "")[:12]
        logger.error(
            "WEBHOOK_HMAC_INVALID: event_id=%s order_id=%s tx_id=%s merchant_ref=%s "
            "expected_prefix=%s provided_prefix=%s",
            provider_transaction_id,
            provider_order_id,
            provider_transaction_id,
            merchant_reference,
            expected_prefix,
            provided_prefix,
        )
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
    # Paymob KSA fallback: look up directly by our internal payment_order_id from extras.
    if not payment_order and ksa_payment_order_id:
        payment_order = db.scalar(
            select(PaymentOrder)
            .options(selectinload(PaymentOrder.plan), selectinload(PaymentOrder.subscription))
            .where(PaymentOrder.id == ksa_payment_order_id)
            .with_for_update()
        )
        if payment_order:
            logger.info(
                "WEBHOOK_ORDER_FOUND_VIA_EXTRAS: payment_order_id=%s tx_id=%s",
                ksa_payment_order_id,
                provider_transaction_id,
            )
    if not payment_order:
        logger.error(
            "WEBHOOK_ORDER_NOT_FOUND: merchant_ref=%s provider_order_id=%s tx_id=%s ksa_po_id=%s",
            merchant_reference,
            provider_order_id,
            provider_transaction_id,
            ksa_payment_order_id,
        )
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
        logger.error(
            "WEBHOOK_AMOUNT_MISMATCH: order_id=%s internal_amount=%s internal_currency=%s "
            "webhook_amount=%s webhook_currency=%s",
            payment_order.id,
            payment_order.amount_minor,
            payment_order.currency,
            event_object.get("amount_cents"),
            event_object.get("currency"),
        )
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
        logger.info(
            "WEBHOOK_PAYMENT_SUCCESS: order_id=%s user_id=%s plan_id=%s amount=%s tx_id=%s",
            payment_order.id,
            payment_order.user_id,
            payment_order.plan_id,
            payment_order.amount_minor,
            provider_transaction_id,
        )
        _finalize_paid_order(db, payment_order, event_object, payload)
        webhook_event.subscription_id = payment_order.subscription_id
        webhook_event.user_id = payment_order.user_id
        webhook_event.status = PaymentWebhookEventStatus.PROCESSED
        webhook_event.processing_error = None
        webhook_event.processed_at = utc_now()
        db.commit()
        logger.info(
            "WEBHOOK_FINALIZED: order_id=%s subscription_id=%s",
            payment_order.id,
            payment_order.subscription_id,
        )
        _send_invoice_email(db, payment_order)
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
