from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class SendCampaign(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A single send job: AI letters + recipients + execution state."""

    __tablename__ = "send_campaigns"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    smtp_connection_id: Mapped[str | None] = mapped_column(
        ForeignKey("smtp_connections.id", ondelete="SET NULL"), nullable=True
    )
    # Optional resume context used when generating letters
    resume_id: Mapped[str | None] = mapped_column(
        ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True
    )

    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # All 3 generated variants stored together
    # {formal: {subject, body}, creative: {subject, body}, concise: {subject, body}}
    letters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # The variant the user chose to send
    selected_variant: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Final subject + body (may be edited by user after generation)
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Ad-hoc recipients for phase-1: {items: [{email, name}]}
    # Phase-2: link to recipient_list_id for bulk sends
    ad_hoc_recipients: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    recipient_list_id: Mapped[str | None] = mapped_column(
        ForeignKey("recipient_lists.id", ondelete="SET NULL"), nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", server_default="draft", index=True
    )  # draft | sending | completed | failed
    total_recipients: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    sent_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="send_campaigns")
    smtp_connection = relationship("SmtpConnection")
    logs = relationship("SendLog", back_populates="campaign", cascade="all, delete-orphan")


class SendLog(UUIDPrimaryKeyMixin, Base):
    """Per-email delivery record for a send campaign."""

    __tablename__ = "send_logs"

    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("send_campaigns.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_email: Mapped[str] = mapped_column(String(320), nullable=False)
    recipient_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # sent | failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    campaign = relationship("SendCampaign", back_populates="logs")
