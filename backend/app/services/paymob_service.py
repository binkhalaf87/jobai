"""Service helpers for creating Paymob payment intentions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Sequence, cast

import httpx

from app.core.config import get_settings
from app.models.enums import PaymentOrderType
from app.models.payment_order import PaymentOrder
from app.models.plan import Plan

PAYMOB_BASE_URL = "https://accept.paymob.com"
PAYMOB_INTENTION_PATH = "/v1/intention/"
PAYMOB_TIMEOUT = 15.0


@dataclass(frozen=True)
class PaymobBillingData:
    """Billing details sent with a Paymob payment intention."""

    email: str
    first_name: str
    last_name: str
    phone_number: str
    apartment: str = "NA"
    floor: str = "NA"
    street: str = "NA"
    building: str = "NA"
    shipping_method: str = "NA"
    postal_code: str = "NA"
    city: str = "NA"
    country: str = "SA"
    state: str = "NA"

    def as_payload(self) -> dict[str, str]:
        """Return the API-ready billing payload."""
        return {
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone_number": self.phone_number,
            "apartment": self.apartment,
            "floor": self.floor,
            "street": self.street,
            "building": self.building,
            "shipping_method": self.shipping_method,
            "postal_code": self.postal_code,
            "city": self.city,
            "country": self.country,
            "state": self.state,
        }


@dataclass(frozen=True)
class PaymobLineItem:
    """Single commercial line item sent to Paymob."""

    name: str
    amount_minor: int
    quantity: int = 1
    description: str | None = None

    def as_payload(self) -> dict[str, Any]:
        """Return the API-ready line item payload."""
        payload: dict[str, Any] = {
            "name": self.name,
            "amount": self.amount_minor,
            "quantity": self.quantity,
        }
        if self.description:
            payload["description"] = self.description
        return payload


@dataclass(frozen=True)
class PaymobMappedOrder:
    """Normalized internal order representation for Paymob requests."""

    merchant_order_id: str
    special_reference: str
    amount_minor: int
    currency: str
    items: tuple[PaymobLineItem, ...]


@dataclass(frozen=True)
class PaymobCheckoutConfiguration:
    """Public Paymob checkout values that may be needed by a later API route."""

    public_key: str
    integration_id: int
    iframe_id: str | None


@dataclass(frozen=True)
class PaymobPaymentIntention:
    """Normalized result returned after a Paymob intention is created."""

    intention_id: str
    client_secret: str
    merchant_order_id: str
    special_reference: str
    public_key: str
    integration_id: int
    iframe_id: str | None
    request_payload: dict[str, Any]
    raw_response: dict[str, Any]


def _require_paymob_api_key() -> str:
    settings = get_settings()
    if not settings.paymob_api_key:
        raise RuntimeError("PAYMOB_API_KEY is not configured in environment variables.")
    return settings.paymob_api_key


def _require_paymob_integration_id() -> int:
    settings = get_settings()
    if not settings.paymob_integration_id:
        raise RuntimeError("PAYMOB_INTEGRATION_ID is not configured in environment variables.")

    try:
        return int(settings.paymob_integration_id)
    except ValueError as exc:
        raise RuntimeError("PAYMOB_INTEGRATION_ID must be a valid integer.") from exc


def get_paymob_checkout_configuration() -> PaymobCheckoutConfiguration:
    """Return the non-secret checkout settings needed by a future frontend bootstrap flow."""
    settings = get_settings()
    if not settings.paymob_public_key:
        raise RuntimeError("PAYMOB_PUBLIC_KEY is not configured in environment variables.")

    return PaymobCheckoutConfiguration(
        public_key=settings.paymob_public_key,
        integration_id=_require_paymob_integration_id(),
        iframe_id=settings.paymob_iframe_id,
    )


def get_paymob_hmac_secret() -> str:
    """Return the configured webhook HMAC secret for future verification flows."""
    settings = get_settings()
    if not settings.paymob_hmac_secret:
        raise RuntimeError("PAYMOB_HMAC_SECRET is not configured in environment variables.")
    return settings.paymob_hmac_secret


def _paymob_headers() -> dict[str, str]:
    return {
        "Authorization": f"Token {_require_paymob_api_key()}",
        "Content-Type": "application/json",
    }


def _resolve_plan(payment_order: PaymentOrder, plan: Plan | None) -> Plan | None:
    if plan is not None:
        return plan
    return cast(Plan | None, getattr(payment_order, "plan", None))


def _default_item_name(payment_order: PaymentOrder, plan: Plan | None) -> str:
    resolved_plan = _resolve_plan(payment_order, plan)
    if resolved_plan and resolved_plan.name:
        return resolved_plan.name
    return payment_order.order_type.value.replace("_", " ").title()


def _default_item_description(payment_order: PaymentOrder, plan: Plan | None) -> str:
    resolved_plan = _resolve_plan(payment_order, plan)
    parts = [
        payment_order.order_type.value,
        f"merchant_reference={payment_order.merchant_reference}",
    ]
    if resolved_plan and resolved_plan.code:
        parts.append(f"plan_code={resolved_plan.code}")
    return " | ".join(parts)


def _default_items(payment_order: PaymentOrder, plan: Plan | None) -> tuple[PaymobLineItem, ...]:
    return (
        PaymobLineItem(
            name=_default_item_name(payment_order, plan),
            amount_minor=payment_order.amount_minor,
            description=_default_item_description(payment_order, plan),
        ),
    )


def map_internal_order_to_paymob_order(
    payment_order: PaymentOrder,
    *,
    plan: Plan | None = None,
    items: Sequence[PaymobLineItem] | None = None,
) -> PaymobMappedOrder:
    """Normalize an internal payment order into the Paymob request shape."""
    if payment_order.amount_minor <= 0:
        raise ValueError("Payment order amount must be a positive minor-unit value.")

    mapped_items = tuple(items) if items is not None else _default_items(payment_order, plan)
    if not mapped_items:
        raise ValueError("At least one Paymob line item is required.")
    if any(item.amount_minor <= 0 or item.quantity <= 0 for item in mapped_items):
        raise ValueError("Paymob line items must have positive amount and quantity values.")
    if sum(item.amount_minor * item.quantity for item in mapped_items) != payment_order.amount_minor:
        raise ValueError("Paymob line items must sum to the internal payment order amount.")

    return PaymobMappedOrder(
        merchant_order_id=payment_order.merchant_reference,
        special_reference=payment_order.merchant_reference,
        amount_minor=payment_order.amount_minor,
        currency=payment_order.currency,
        items=mapped_items,
    )


def build_order_payload(
    payment_order: PaymentOrder,
    billing_data: PaymobBillingData,
    *,
    plan: Plan | None = None,
    items: Sequence[PaymobLineItem] | None = None,
    payment_methods: Sequence[int] | None = None,
    extras: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the request body used to create a Paymob payment intention."""
    mapped_order = map_internal_order_to_paymob_order(payment_order, plan=plan, items=items)
    configured_payment_methods = list(payment_methods) if payment_methods is not None else [_require_paymob_integration_id()]

    if not configured_payment_methods:
        raise ValueError("At least one Paymob payment method is required.")

    extras_payload = {
        key: value
        for key, value in {
            "payment_order_id": payment_order.id,
            "user_id": payment_order.user_id,
            "plan_id": payment_order.plan_id,
            "subscription_id": payment_order.subscription_id,
            "provider_name": payment_order.provider_name,
            "order_type": payment_order.order_type.value,
            "idempotency_key": payment_order.idempotency_key,
            **dict(extras or {}),
        }.items()
        if value is not None
    }

    return {
        "amount": mapped_order.amount_minor,
        "currency": mapped_order.currency,
        "payment_methods": configured_payment_methods,
        "items": [item.as_payload() for item in mapped_order.items],
        "billing_data": billing_data.as_payload(),
        "special_reference": mapped_order.special_reference,
        "merchant_order_id": mapped_order.merchant_order_id,
        "extras": extras_payload,
    }


def _extract_paymob_error(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text.strip() or "Paymob returned an empty error response."

    if isinstance(payload, dict):
        for field_name in ("detail", "message", "error"):
            if isinstance(payload.get(field_name), str) and payload[field_name]:
                return payload[field_name]

        errors = payload.get("errors")
        if isinstance(errors, list) and errors:
            first_error = errors[0]
            if isinstance(first_error, str):
                return first_error
            if isinstance(first_error, dict):
                return str(first_error.get("message") or first_error.get("detail") or first_error)

    return str(payload)


def _post_intention(payload: dict[str, Any]) -> dict[str, Any]:
    with httpx.Client(base_url=PAYMOB_BASE_URL, timeout=PAYMOB_TIMEOUT) as client:
        response = client.post(PAYMOB_INTENTION_PATH, headers=_paymob_headers(), json=payload)

    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"Paymob intention request failed with status {response.status_code}: "
            f"{_extract_paymob_error(response)}"
        ) from exc

    response_payload = response.json()
    if not isinstance(response_payload, dict):
        raise RuntimeError("Paymob intention response did not return a JSON object.")

    return cast(dict[str, Any], response_payload)


def create_payment_intention(
    payment_order: PaymentOrder,
    billing_data: PaymobBillingData,
    *,
    plan: Plan | None = None,
    items: Sequence[PaymobLineItem] | None = None,
    payment_methods: Sequence[int] | None = None,
    extras: Mapping[str, Any] | None = None,
) -> PaymobPaymentIntention:
    """Create a Paymob payment intention for a persisted payment order."""
    checkout_configuration = get_paymob_checkout_configuration()
    payload = build_order_payload(
        payment_order,
        billing_data,
        plan=plan,
        items=items,
        payment_methods=payment_methods,
        extras=extras,
    )
    response_payload = _post_intention(payload)

    intention_id = str(response_payload.get("id") or "")
    client_secret = str(response_payload.get("client_secret") or "")

    if not intention_id:
        raise RuntimeError("Paymob intention response did not include an intention id.")
    if not client_secret:
        raise RuntimeError("Paymob intention response did not include a client_secret.")

    return PaymobPaymentIntention(
        intention_id=intention_id,
        client_secret=client_secret,
        merchant_order_id=str(payload["merchant_order_id"]),
        special_reference=str(payload["special_reference"]),
        public_key=checkout_configuration.public_key,
        integration_id=checkout_configuration.integration_id,
        iframe_id=checkout_configuration.iframe_id,
        request_payload=payload,
        raw_response=response_payload,
    )


def create_subscription_payment_intention(
    payment_order: PaymentOrder,
    billing_data: PaymobBillingData,
    *,
    plan: Plan | None = None,
    items: Sequence[PaymobLineItem] | None = None,
    payment_methods: Sequence[int] | None = None,
    extras: Mapping[str, Any] | None = None,
) -> PaymobPaymentIntention:
    """Create a Paymob intention for a subscription payment order."""
    if payment_order.order_type not in {
        PaymentOrderType.SUBSCRIPTION_INITIAL,
        PaymentOrderType.SUBSCRIPTION_RENEWAL,
    }:
        raise ValueError("Subscription intentions require a subscription payment order type.")

    return create_payment_intention(
        payment_order,
        billing_data,
        plan=plan,
        items=items,
        payment_methods=payment_methods,
        extras=extras,
    )


def create_points_pack_payment_intention(
    payment_order: PaymentOrder,
    billing_data: PaymobBillingData,
    *,
    plan: Plan | None = None,
    items: Sequence[PaymobLineItem] | None = None,
    payment_methods: Sequence[int] | None = None,
    extras: Mapping[str, Any] | None = None,
) -> PaymobPaymentIntention:
    """Create a Paymob intention for a one-time points purchase."""
    if payment_order.order_type is not PaymentOrderType.POINTS_PURCHASE:
        raise ValueError("Points-pack intentions require a points purchase payment order type.")

    return create_payment_intention(
        payment_order,
        billing_data,
        plan=plan,
        items=items,
        payment_methods=payment_methods,
        extras=extras,
    )
