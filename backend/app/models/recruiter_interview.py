from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class RecruiterInterview(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """AI-generated interview question set created by a recruiter for a specific candidate + job."""

    __tablename__ = "recruiter_interviews"

    recruiter_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    resume_id: Mapped[str] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_id: Mapped[str] = mapped_column(
        ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    interview_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="mixed", server_default="mixed"
    )  # hr | technical | mixed
    language: Mapped[str] = mapped_column(
        String(10), nullable=False, default="en", server_default="en"
    )

    # {focus_areas: [...], candidate_summary: "...", questions: [{index, question, type, focus_area}]}
    generated_questions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ready", server_default="ready"
    )  # generating | ready | failed

    # Invite flow
    invite_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)
    invite_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    invite_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending"
    )  # pending | sent | in_progress | completed
