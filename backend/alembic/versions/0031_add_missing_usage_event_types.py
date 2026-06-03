"""Add missing usage_event_type enum values."""

from __future__ import annotations

from alembic import op

revision = "0031"
down_revision = "0030"
branch_labels = None
depends_on = None

_NEW_VALUES = [
    "resume_uploaded",
    "resume_deleted",
    "billing_checkout_initiated",
    "billing_payment_confirmed",
    "billing_promo_applied",
    "admin_promo_created",
    "admin_promo_deleted",
    "admin_payment_activated",
]


def upgrade() -> None:
    for value in _NEW_VALUES:
        op.execute(
            f"ALTER TYPE usage_event_type ADD VALUE IF NOT EXISTS '{value}'"
        )


def downgrade() -> None:
    pass
