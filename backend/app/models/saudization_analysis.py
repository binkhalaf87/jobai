from sqlalchemy import Float, ForeignKey, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import SaudizationAIStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class SaudizationAnalysis(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Links a Saudization decision with a GOSI report to produce gap analysis and AI recommendations."""

    __tablename__ = "saudization_analyses"

    recruiter_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    decision_id: Mapped[str] = mapped_column(ForeignKey("saudization_decisions.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("saudization_reports.id", ondelete="CASCADE"), nullable=False, index=True)

    current_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    gap_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    # [{profession, current_count, current_pct, target_pct, gap_pct, needed}]
    profession_gaps: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # List of ALL decision IDs used in this analysis (supports multi-decision)
    decision_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    ai_recommendations: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_status: Mapped[SaudizationAIStatus] = mapped_column(
        SqlEnum(SaudizationAIStatus, name="saudization_ai_status", create_type=False, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=SaudizationAIStatus.PENDING,
        server_default=SaudizationAIStatus.PENDING.value,
    )

    decision = relationship("SaudizationDecision", back_populates="analyses")
    report = relationship("SaudizationReport", back_populates="analyses")
