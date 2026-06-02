"""Feature credit management — query, deduct, and grant credits for direct pay-per-use features."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_feature_credit import (
    FEATURE_MOCK_INTERVIEW,
    FEATURE_RESUME_ANALYSIS,
    FEATURE_RESUME_IMPROVEMENT,
    FEATURE_SMART_SEND_CONTACTS,
    UserFeatureCredit,
)


class InsufficientFeatureCreditError(RuntimeError):
    """Raised when a user has no available credits for a feature."""


def get_feature_balance(db: Session, user_id: str, feature: str) -> int:
    """Return how many usable credits the user has for a given feature."""
    rows = db.scalars(
        select(UserFeatureCredit).where(
            UserFeatureCredit.user_id == user_id,
            UserFeatureCredit.feature == feature,
        )
    ).all()
    return sum(max(0, r.quantity_granted - r.quantity_used) for r in rows)


def deduct_feature_credit(db: Session, user_id: str, feature: str, amount: int = 1) -> None:
    """Consume `amount` credits for `feature`. Raises InsufficientFeatureCreditError if not enough."""
    rows = db.scalars(
        select(UserFeatureCredit)
        .where(
            UserFeatureCredit.user_id == user_id,
            UserFeatureCredit.feature == feature,
        )
        .order_by(UserFeatureCredit.created_at)
        .with_for_update()
    ).all()

    remaining = amount
    for row in rows:
        available = row.quantity_granted - row.quantity_used
        if available <= 0:
            continue
        consume = min(available, remaining)
        row.quantity_used += consume
        remaining -= consume
        if remaining <= 0:
            break

    if remaining > 0:
        raise InsufficientFeatureCreditError(
            f"ليس لديك رصيد كافٍ لـ {feature}. يرجى شراء الخدمة أولاً."
        )


def grant_feature_credits(
    db: Session,
    user_id: str,
    feature: str,
    quantity: int,
    payment_order_id: str | None = None,
) -> UserFeatureCredit:
    """Create a new credit record (called after successful payment)."""
    credit = UserFeatureCredit(
        id=str(uuid.uuid4()),
        user_id=user_id,
        feature=feature,
        quantity_granted=quantity,
        quantity_used=0,
        payment_order_id=payment_order_id,
    )
    db.add(credit)
    db.flush()
    return credit


def get_all_feature_balances(db: Session, user_id: str) -> dict[str, int]:
    """Return a dict of feature → available balance for the user."""
    features = [
        FEATURE_RESUME_ANALYSIS,
        FEATURE_RESUME_IMPROVEMENT,
        FEATURE_MOCK_INTERVIEW,
        FEATURE_SMART_SEND_CONTACTS,
    ]
    return {f: get_feature_balance(db, user_id, f) for f in features}
