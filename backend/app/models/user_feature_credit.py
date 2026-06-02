from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import UUIDPrimaryKeyMixin


FEATURE_RESUME_ANALYSIS = "resume_analysis"
FEATURE_RESUME_IMPROVEMENT = "resume_improvement"
FEATURE_MOCK_INTERVIEW = "mock_interview"
FEATURE_SMART_SEND_CONTACTS = "smart_send_contacts"

ALL_FEATURES = {
    FEATURE_RESUME_ANALYSIS,
    FEATURE_RESUME_IMPROVEMENT,
    FEATURE_MOCK_INTERVIEW,
    FEATURE_SMART_SEND_CONTACTS,
}


class UserFeatureCredit(UUIDPrimaryKeyMixin, Base):
    """Tracks feature credits purchased by a user via direct payment."""

    __tablename__ = "user_feature_credits"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    feature: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    quantity_granted: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    payment_order_id: Mapped[str | None] = mapped_column(
        ForeignKey("payment_orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user = relationship("User", back_populates="feature_credits")
    payment_order = relationship("PaymentOrder")
