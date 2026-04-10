from sqlalchemy import ForeignKey, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import EmploymentType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class JobDescription(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Job descriptions submitted for fit analysis against resumes."""

    __tablename__ = "job_descriptions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    keyword_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    employment_type: Mapped[EmploymentType | None] = mapped_column(
        SqlEnum(EmploymentType, name="employment_type", values_callable=lambda e: [m.value for m in e]), nullable=True
    )
    location_text: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user = relationship("User", back_populates="job_descriptions")
    analyses = relationship("Analysis", back_populates="job_description", cascade="all, delete-orphan")
