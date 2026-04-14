from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import BillingInterval, PlanAudience, PlanKind
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Plan(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Catalog entry for subscription plans and one-time points packs."""

    __tablename__ = "plans"

    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    audience: Mapped[PlanAudience] = mapped_column(
        SqlEnum(PlanAudience, name="plan_audience", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        index=True,
    )
    kind: Mapped[PlanKind] = mapped_column(
        SqlEnum(PlanKind, name="plan_kind", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        index=True,
    )
    billing_interval: Mapped[BillingInterval] = mapped_column(
        SqlEnum(BillingInterval, name="billing_interval", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="SAR", server_default="SAR")
    price_amount_minor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    points_grant: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    subscriptions = relationship("Subscription", back_populates="plan")
    payment_orders = relationship("PaymentOrder", back_populates="plan")
