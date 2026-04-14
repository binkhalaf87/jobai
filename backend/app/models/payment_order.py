from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import PaymentOrderStatus, PaymentOrderType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class PaymentOrder(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Persisted payment order used to reconcile Paymob activity."""

    __tablename__ = "payment_orders"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id: Mapped[str] = mapped_column(ForeignKey("plans.id"), nullable=False, index=True)
    subscription_id: Mapped[str | None] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    order_type: Mapped[PaymentOrderType] = mapped_column(
        SqlEnum(PaymentOrderType, name="payment_order_type", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        index=True,
    )
    status: Mapped[PaymentOrderStatus] = mapped_column(
        SqlEnum(PaymentOrderStatus, name="payment_order_status", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=PaymentOrderStatus.PENDING,
        server_default=PaymentOrderStatus.PENDING.value,
        index=True,
    )
    amount_minor: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="SAR", server_default="SAR")
    provider_name: Mapped[str] = mapped_column(String(50), nullable=False, default="paymob", server_default="paymob")
    provider_order_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    provider_payment_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    merchant_reference: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    request_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    response_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expired_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="payment_orders")
    plan = relationship("Plan", back_populates="payment_orders")
    subscription = relationship("Subscription", back_populates="payment_orders")
    webhook_events = relationship("PaymentWebhookEvent", back_populates="payment_order")
    wallet_transactions = relationship("WalletTransaction", back_populates="payment_order")
