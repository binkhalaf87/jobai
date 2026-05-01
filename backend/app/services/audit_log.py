"""Lightweight helper for emitting UsageLog audit events."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.enums import UsageEventType
from app.models.usage_log import UsageLog


def emit(
    db: Session,
    *,
    user_id: str,
    event_type: UsageEventType,
    detail: str | None = None,
    event_payload: dict | None = None,
) -> None:
    """Persist a single audit event. Commits immediately."""
    log = UsageLog(
        user_id=user_id,
        event_type=event_type,
        detail=detail,
        event_payload=event_payload,
    )
    db.add(log)
    db.commit()
