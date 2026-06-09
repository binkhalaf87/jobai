from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class MarketingCampaign(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Admin-only bulk marketing campaign with automatic domain warm-up."""

    __tablename__ = "marketing_campaigns"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    html_body: Mapped[str] = mapped_column(Text, nullable=False)
    from_name: Mapped[str] = mapped_column(String(255), nullable=False, default="JobAI24")
    from_email: Mapped[str] = mapped_column(String(255), nullable=False, default="marketing@jobai24.com")

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", server_default="draft", index=True
    )
    warmup_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    current_daily_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=500, server_default="500")

    total_contacts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    total_sent: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    total_failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    last_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    contacts = relationship(
        "MarketingCampaignContact", back_populates="campaign", cascade="all, delete-orphan"
    )


class MarketingCampaignContact(UUIDPrimaryKeyMixin, Base):
    """Single recipient within a marketing campaign."""

    __tablename__ = "marketing_campaign_contacts"

    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("marketing_campaigns.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending", index=True
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    campaign = relationship("MarketingCampaign", back_populates="contacts")
