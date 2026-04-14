from sqlalchemy import Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class UserWallet(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Wallet balance for points-backed jobseeker purchases and usage."""

    __tablename__ = "user_wallets"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    balance_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    lifetime_earned_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    lifetime_spent_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    user = relationship("User", back_populates="user_wallet")
    transactions = relationship("WalletTransaction", back_populates="wallet", cascade="all, delete-orphan")
