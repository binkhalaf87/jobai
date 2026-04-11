from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class SavedJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A job listing saved/bookmarked by the user from search results."""

    __tablename__ = "saved_jobs"
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_saved_jobs_user_id_job_id"),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # External JSearch job identifier
    job_id: Mapped[str] = mapped_column(String(512), nullable=False)

    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    employment_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    apply_link: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    employer_logo: Mapped[str | None] = mapped_column(String(500), nullable=True)

    salary_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    salary_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    salary_currency: Mapped[str | None] = mapped_column(String(20), nullable=True)

    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fit_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Full raw JSearch response for this job (future-proof)
    raw_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    user = relationship("User", back_populates="saved_jobs")
