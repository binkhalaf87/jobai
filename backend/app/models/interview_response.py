from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class InterviewResponse(UUIDPrimaryKeyMixin, Base):
    """Single question answer submitted by a candidate via the invite link."""

    __tablename__ = "interview_responses"

    interview_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("recruiter_interviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_index: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    video_data: Mapped[str | None] = mapped_column(Text, nullable=True)   # base64 WebM
    text_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
