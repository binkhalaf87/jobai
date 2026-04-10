from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import ResumeProcessingStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Resume(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Stored user resume content and file metadata."""

    __tablename__ = "resumes"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    storage_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    normalized_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    structured_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    processing_status: Mapped[ResumeProcessingStatus] = mapped_column(
        SqlEnum(ResumeProcessingStatus, name="resume_processing_status"),
        nullable=False,
        default=ResumeProcessingStatus.UPLOADED,
        server_default=ResumeProcessingStatus.UPLOADED.value,
    )

    user = relationship("User", back_populates="resumes")
    analyses = relationship("Analysis", back_populates="resume", cascade="all, delete-orphan")
