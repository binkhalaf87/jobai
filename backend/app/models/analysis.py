from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import AnalysisStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Analysis(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A persisted analysis run between a resume and a job description."""

    __tablename__ = "analyses"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    job_description_id: Mapped[str] = mapped_column(
        ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[AnalysisStatus] = mapped_column(
        SqlEnum(AnalysisStatus, name="analysis_status"),
        nullable=False,
        default=AnalysisStatus.QUEUED,
        server_default=AnalysisStatus.QUEUED.value,
    )
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    overall_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    summary_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="analyses")
    resume = relationship("Resume", back_populates="analyses")
    job_description = relationship("JobDescription", back_populates="analyses")
    rewrite_suggestions = relationship("RewriteSuggestion", back_populates="analysis", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="analysis")

