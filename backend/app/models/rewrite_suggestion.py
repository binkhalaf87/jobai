from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import SuggestionSection
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class RewriteSuggestion(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Suggested resume rewrites produced from an analysis result."""

    __tablename__ = "rewrite_suggestions"

    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    section: Mapped[SuggestionSection] = mapped_column(
        SqlEnum(SuggestionSection, name="suggestion_section", values_callable=lambda e: [m.value for m in e]), nullable=False
    )
    original_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_text: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_applied: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    display_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    anchor_label: Mapped[str | None] = mapped_column(String(255), nullable=True)

    analysis = relationship("Analysis", back_populates="rewrite_suggestions")

