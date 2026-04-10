from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


def utc_now() -> datetime:
    """Generate a timezone-aware UTC timestamp for Python-side defaults."""
    return datetime.now(timezone.utc)


class UUIDPrimaryKeyMixin:
    """Provide a PostgreSQL UUID primary key for persisted entities."""

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))


class TimestampMixin:
    """Provide created and updated timestamps for mutable entities."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
    )

