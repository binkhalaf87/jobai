from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import PaymentWebhookEventStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class PaymentWebhookEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Stored provider webhook payload with processing state."""

    __tablename__ = "payment_webhook_events"

    payment_order_id: Mapped[str | None] = mapped_column(
        ForeignKey("payment_orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    subscription_id: Mapped[str | None] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    provider_name: Mapped[str] = mapped_column(String(50), nullable=False, default="paymob", server_default="paymob")
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    provider_event_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    provider_order_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    provider_transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    status: Mapped[PaymentWebhookEventStatus] = mapped_column(
        SqlEnum(
            PaymentWebhookEventStatus,
            name="payment_webhook_event_status",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=PaymentWebhookEventStatus.RECEIVED,
        server_default=PaymentWebhookEventStatus.RECEIVED.value,
        index=True,
    )
    signature_valid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    event_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    processing_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    payment_order = relationship("PaymentOrder", back_populates="webhook_events")
    subscription = relationship("Subscription", back_populates="payment_webhook_events")
    user = relationship("User", back_populates="payment_webhook_events")
