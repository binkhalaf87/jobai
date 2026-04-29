from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class EmailCampaign(UUIDPrimaryKeyMixin, Base):
    """Drip campaign — sends to a full recipient list at daily_limit emails/day."""

    __tablename__ = "email_campaigns"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    list_id: Mapped[str | None] = mapped_column(
        ForeignKey("recipient_lists.id", ondelete="SET NULL"), nullable=True
    )
    resume_id: Mapped[str | None] = mapped_column(
        ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True
    )
    list_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active", index=True)
    daily_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=100, server_default="100")
    total_contacts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    total_sent: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    total_failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user = relationship("User", back_populates="email_campaigns")
    contacts = relationship("EmailCampaignContact", back_populates="campaign", cascade="all, delete-orphan")
