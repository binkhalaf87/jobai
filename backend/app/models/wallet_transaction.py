from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import WalletTransactionDirection, WalletTransactionStatus, WalletTransactionType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class WalletTransaction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Immutable points ledger rows for wallet balance changes."""

    __tablename__ = "wallet_transactions"

    wallet_id: Mapped[str] = mapped_column(ForeignKey("user_wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_order_id: Mapped[str | None] = mapped_column(
        ForeignKey("payment_orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    subscription_id: Mapped[str | None] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    transaction_type: Mapped[WalletTransactionType] = mapped_column(
        SqlEnum(
            WalletTransactionType,
            name="wallet_transaction_type",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        index=True,
    )
    status: Mapped[WalletTransactionStatus] = mapped_column(
        SqlEnum(
            WalletTransactionStatus,
            name="wallet_transaction_status",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=WalletTransactionStatus.POSTED,
        server_default=WalletTransactionStatus.POSTED.value,
        index=True,
    )
    direction: Mapped[WalletTransactionDirection] = mapped_column(
        SqlEnum(
            WalletTransactionDirection,
            name="wallet_transaction_direction",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_before: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    event_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    effective_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    wallet = relationship("UserWallet", back_populates="transactions")
    user = relationship("User", back_populates="wallet_transactions")
    payment_order = relationship("PaymentOrder", back_populates="wallet_transactions")
    subscription = relationship("Subscription", back_populates="wallet_transactions")
