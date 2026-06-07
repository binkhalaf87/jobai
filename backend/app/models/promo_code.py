from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import PromoApplicableTo, PromoDiscountType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class PromoCode(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Admin-created discount codes applicable to subscription plan checkouts."""

    __tablename__ = "promo_codes"

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    discount_type: Mapped[PromoDiscountType] = mapped_column(
        SqlEnum(PromoDiscountType, name="promo_discount_type", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    discount_value: Mapped[int] = mapped_column(Integer, nullable=False)
    applicable_to: Mapped[PromoApplicableTo] = mapped_column(
        SqlEnum(PromoApplicableTo, name="promo_applicable_to", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        index=True,
        default=PromoApplicableTo.ALL,
        server_default="all",
    )
    plan_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("plans.id", ondelete="SET NULL"), nullable=True, index=True
    )
    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    uses_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    max_uses_per_user: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true", index=True)
    created_by_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    plan = relationship("Plan")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="promo_codes_created")
    usages = relationship("PromoCodeUsage", back_populates="promo_code", cascade="all, delete-orphan")
