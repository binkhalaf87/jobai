from datetime import datetime

from app.models.enums import SubscriptionStatus
from app.schemas.base import ORMBaseSchema, TimestampedSchema


class SubscriptionBase(ORMBaseSchema):
    plan_name: str
    status: SubscriptionStatus = SubscriptionStatus.TRIALING
    provider_name: str = "stripe"
    provider_customer_id: str | None = None
    provider_subscription_id: str | None = None
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionRead(SubscriptionBase, TimestampedSchema):
    id: str
    user_id: str

