from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class GmailConnectionRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Tracks user requests to enable Gmail connection, awaiting admin approval."""

    __tablename__ = "gmail_connection_requests"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending | approved | rejected
    requested_gmail: Mapped[str | None] = mapped_column(
        String(320), nullable=True
    )  # optional alternate Gmail address to send from
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    user = relationship("User", foreign_keys=[user_id], back_populates="gmail_connection_request")
