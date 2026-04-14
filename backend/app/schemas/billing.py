from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    BillingInterval,
    PaymentOrderStatus,
    PaymentOrderType,
    PlanAudience,
    PlanKind,
    SubscriptionStatus,
    UserRole,
)


class BillingBaseSchema(BaseModel):
    """Base configuration for non-ORM billing response models."""

    model_config = ConfigDict(from_attributes=True)


class BillingPlanRead(BillingBaseSchema):
    id: str
    code: str
    name: str
    audience: PlanAudience
    kind: PlanKind
    billing_interval: BillingInterval
    currency: str
    price_amount_minor: int | None = None
    points_grant: int = 0
    is_active: bool = True
    display_order: int = 0
    description: str | None = None
    metadata_payload: dict[str, Any] | None = None


class BillingPlansResponse(BaseModel):
    role: UserRole
    plans: list[BillingPlanRead]


class BillingContactData(BaseModel):
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str = Field(..., min_length=3, max_length=50)
    apartment: str | None = None
    floor: str | None = None
    street: str | None = None
    building: str | None = None
    shipping_method: str | None = None
    postal_code: str | None = None
    city: str | None = None
    country: str | None = None
    state: str | None = None


class BillingCheckoutIntentionRequest(BaseModel):
    plan_code: str = Field(..., min_length=3, max_length=100)
    billing_data: BillingContactData


class BillingCheckoutSession(BaseModel):
    intention_id: str
    client_secret: str
    public_key: str
    integration_id: int
    iframe_id: str | None = None


class BillingCheckoutPlanSummary(BaseModel):
    code: str
    name: str
    kind: PlanKind
    billing_interval: BillingInterval
    currency: str
    price_amount_minor: int | None = None
    points_grant: int = 0


class BillingCheckoutResponse(BaseModel):
    payment_order_id: str
    merchant_reference: str
    provider_name: str
    status: PaymentOrderStatus
    order_type: PaymentOrderType
    amount_minor: int
    currency: str
    plan: BillingCheckoutPlanSummary
    checkout: BillingCheckoutSession


class BillingSubscriptionSummary(BaseModel):
    id: str
    plan_id: str | None = None
    plan_name: str
    status: SubscriptionStatus
    provider_name: str
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False
    created_at: datetime
    updated_at: datetime


class BillingWalletSummary(BaseModel):
    id: str | None = None
    balance_points: int = 0
    lifetime_earned_points: int = 0
    lifetime_spent_points: int = 0
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BillingOrderSummary(BaseModel):
    id: str
    plan_code: str
    plan_name: str
    order_type: PaymentOrderType
    status: PaymentOrderStatus
    amount_minor: int
    currency: str
    provider_name: str
    created_at: datetime
    paid_at: datetime | None = None
    failure_reason: str | None = None


class BillingMeResponse(BaseModel):
    user_id: str
    role: UserRole
    current_subscription: BillingSubscriptionSummary | None = None
    wallet: BillingWalletSummary | None = None
    recent_orders: list[BillingOrderSummary]


class BillingWebhookResponse(BaseModel):
    event_id: str
    payment_order_id: str | None = None
    status: str
    duplicate: bool = False
