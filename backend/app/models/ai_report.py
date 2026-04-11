from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class AIAnalysisReport(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Free-form AI-generated resume analysis report stored per-request."""

    __tablename__ = "ai_analysis_reports"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    job_description_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    report_type: Mapped[str] = mapped_column(String(20), nullable=False, default="analysis", server_default="analysis", index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", server_default="pending")
    report_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="ai_analysis_reports")
    resume = relationship("Resume", back_populates="ai_reports")
