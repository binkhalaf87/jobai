from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import SaudizationProcessingStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class SaudizationDecision(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A Saudization (Nitaqat) government decision uploaded as PDF by a recruiter."""

    __tablename__ = "saudization_decisions"

    recruiter_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id: Mapped[str | None] = mapped_column(ForeignKey("recruiter_companies.id", ondelete="SET NULL"), nullable=True, index=True)

    decision_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    decision_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    decision_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    issuing_authority: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Full definition/description of what the decision mandates
    decision_definition: Mapped[str | None] = mapped_column(Text, nullable=True)

    # [{name, target_percentage, min_employees, min_salary, calculation_method, notes}]
    targeted_professions: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    storage_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_extracted_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    processing_status: Mapped[SaudizationProcessingStatus] = mapped_column(
        SqlEnum(SaudizationProcessingStatus, name="saudization_processing_status", create_type=False, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=SaudizationProcessingStatus.UPLOADED,
        server_default=SaudizationProcessingStatus.UPLOADED.value,
    )

    company = relationship("RecruiterCompany", back_populates="decisions")
    analyses = relationship("SaudizationAnalysis", back_populates="decision", cascade="all, delete-orphan")
