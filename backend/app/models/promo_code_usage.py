from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class PromoCodeUsage(UUIDPrimaryKeyMixin, Base):
    """Immutable record of a promo code redemption by a user."""

    __tablename__ = "promo_code_usages"

    promo_code_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("promo_codes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    payment_order_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("payment_orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    discount_applied_minor: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    promo_code = relationship("PromoCode", back_populates="usages")
    user = relationship("User", back_populates="promo_code_usages")
    payment_order = relationship("PaymentOrder")
