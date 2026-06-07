from sqlalchemy import ForeignKey, String
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import SaudizationProcessingStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class SaudizationReport(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A GOSI (Social Insurance) Excel report uploaded by a recruiter."""

    __tablename__ = "saudization_reports"

    recruiter_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("recruiter_companies.id", ondelete="CASCADE"), nullable=False, index=True)

    report_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    report_label: Mapped[str | None] = mapped_column(String(255), nullable=True)

    storage_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Array of employee records from GOSI Excel
    employees: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # {total, saudi_count, non_saudi_count, saudization_pct, by_profession: {title: {total, saudi}}}
    summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    processing_status: Mapped[SaudizationProcessingStatus] = mapped_column(
        SqlEnum(SaudizationProcessingStatus, name="saudization_processing_status", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=SaudizationProcessingStatus.UPLOADED,
        server_default=SaudizationProcessingStatus.UPLOADED.value,
    )

    company = relationship("RecruiterCompany", back_populates="reports")
    analyses = relationship("SaudizationAnalysis", back_populates="report", cascade="all, delete-orphan")
