"""Extend usage_event_type PostgreSQL enum with new audit event values."""

from __future__ import annotations

from alembic import op

revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None

# New values to add — ALTER TYPE ADD VALUE cannot run inside a transaction.
_NEW_VALUES = [
    "auth_register",
    "auth_logout",
    "auth_token_refresh",
    "smtp_connected",
    "smtp_deleted",
    "file_deleted",
    "admin_user_updated",
    "admin_wallet_adjusted",
]


def upgrade() -> None:
    for value in _NEW_VALUES:
        op.execute(f"ALTER TYPE usage_event_type ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating the type.
    pass
