from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class EmailCampaignContact(UUIDPrimaryKeyMixin, Base):
    """Snapshot of a single recipient in an email campaign."""

    __tablename__ = "email_campaign_contacts"

    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("email_campaigns.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_email: Mapped[str] = mapped_column(String(320), nullable=False)
    recipient_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", server_default="pending", index=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    campaign = relationship("EmailCampaign", back_populates="contacts")
