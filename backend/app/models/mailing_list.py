"""
Mailing list models — ready for a full newsletter/contact list manager.
Phase 1: tables exist but are not yet exposed via UI.
Phase 2: CSV import, list segmentation, unsubscribe management.
"""

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class RecipientList(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A named list of contact email addresses owned by a user."""

    __tablename__ = "recipient_lists"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Source hint for the list manager UI
    source: Mapped[str | None] = mapped_column(String(50), nullable=True)  # manual | csv | import
    total_count: Mapped[int] = mapped_column(
        __import__("sqlalchemy").Integer, nullable=False, default=0, server_default="0"
    )

    user = relationship("User", back_populates="recipient_lists")
    recipients = relationship("Recipient", back_populates="list", cascade="all, delete-orphan")


class Recipient(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A single contact in a recipient list."""

    __tablename__ = "recipients"
    __table_args__ = (
        UniqueConstraint("list_id", "email", name="uq_recipients_list_id_email"),
    )

    list_id: Mapped[str] = mapped_column(
        ForeignKey("recipient_lists.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        __import__("sqlalchemy").Boolean, nullable=False, default=True, server_default="true"
    )
    unsubscribed_at: Mapped[None] = mapped_column(DateTime(timezone=True), nullable=True)
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # ["hr", "tech", ...]

    list = relationship("RecipientList", back_populates="recipients")
