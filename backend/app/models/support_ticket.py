"""Support ticket and message models for user-admin communication."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import TicketCategory, TicketStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin, utc_now


class SupportTicket(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A support request opened by a user."""

    __tablename__ = "support_tickets"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[TicketCategory] = mapped_column(String(30), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        String(20), nullable=False, default=TicketStatus.OPEN, server_default="open"
    )
    unread_by_user: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    unread_by_admin: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    user = relationship("User", back_populates="support_tickets")
    messages: Mapped[list[TicketMessage]] = relationship(
        "TicketMessage", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketMessage.created_at"
    )


class TicketMessage(UUIDPrimaryKeyMixin, Base):
    """A single message within a support ticket thread."""

    __tablename__ = "ticket_messages"

    ticket_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_admin_message: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, server_default=func.now()
    )

    ticket: Mapped[SupportTicket] = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
