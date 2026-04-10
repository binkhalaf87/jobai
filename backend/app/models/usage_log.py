from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import UsageEventType
from app.models.mixins import UUIDPrimaryKeyMixin


class UsageLog(UUIDPrimaryKeyMixin, Base):
    """Auditable usage and metering events emitted by the platform."""

    __tablename__ = "usage_logs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    analysis_id: Mapped[str | None] = mapped_column(ForeignKey("analyses.id", ondelete="SET NULL"), nullable=True)
    event_type: Mapped[UsageEventType] = mapped_column(
        SqlEnum(UsageEventType, name="usage_event_type"), nullable=False, index=True
    )
    request_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    credits_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    user = relationship("User", back_populates="usage_logs")
    analysis = relationship("Analysis", back_populates="usage_logs")

