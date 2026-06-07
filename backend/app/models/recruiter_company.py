from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class RecruiterCompany(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A company managed by a recruiter for saudization tracking."""

    __tablename__ = "recruiter_companies"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cr_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    user = relationship("User")
    decisions = relationship("SaudizationDecision", back_populates="company", cascade="all, delete-orphan")
    reports = relationship("SaudizationReport", back_populates="company", cascade="all, delete-orphan")
