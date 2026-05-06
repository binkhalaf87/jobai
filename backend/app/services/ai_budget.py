"""AI usage budget enforcement — per-user daily cap and monthly platform budget."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

# Maximum tokens allowed per single OpenAI request (cost control).
# Override via AI_MAX_TOKENS_PER_REQUEST env var.
MAX_TOKENS_PER_REQUEST: int = int(os.getenv("AI_MAX_TOKENS_PER_REQUEST", "8000"))

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.enums import UsageEventType
from app.models.usage_log import UsageLog

logger = logging.getLogger(__name__)


def _today_start() -> datetime:
    return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)


def check_user_daily_ai_cap(db: Session, user_id: str, feature: str = "ai") -> None:
    """Raise HTTP 429 if the user has exceeded their daily AI token/credit cap.

    Reads AI-related UsageLog rows written today and compares the sum of
    credits_used against settings.ai_per_user_daily_cap.
    """
    settings = get_settings()
    ai_event_types = [
        UsageEventType.ANALYSIS_REQUESTED,
        UsageEventType.ANALYSIS_COMPLETED,
        UsageEventType.REWRITE_GENERATED,
    ]

    used_today: int = db.scalar(
        select(func.coalesce(func.sum(UsageLog.credits_used), 0)).where(
            UsageLog.user_id == user_id,
            UsageLog.event_type.in_(ai_event_types),
            UsageLog.created_at >= _today_start(),
        )
    ) or 0

    if used_today >= settings.ai_per_user_daily_cap:
        logger.warning(
            "User %s hit daily AI cap: used=%d cap=%d feature=%s",
            user_id, used_today, settings.ai_per_user_daily_cap, feature,
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily AI usage limit reached. Try again tomorrow.",
        )
