from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import SubscriptionStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Subscription(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Billing subscription state for a user account."""

    __tablename__ = "subscriptions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(
        SqlEnum(SubscriptionStatus, name="subscription_status", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=SubscriptionStatus.TRIALING,
        server_default=SubscriptionStatus.TRIALING.value,
    )
    provider_name: Mapped[str] = mapped_column(String(50), nullable=False, default="stripe", server_default="stripe")
    provider_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    provider_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    user = relationship("User", back_populates="subscriptions")

