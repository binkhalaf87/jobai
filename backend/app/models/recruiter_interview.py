from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

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

    recruiter = relationship("User", foreign_keys=[recruiter_id])
    resume = relationship("Resume", foreign_keys=[resume_id])
    job = relationship("JobDescription", foreign_keys=[job_id])
