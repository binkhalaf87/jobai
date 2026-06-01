"""Add page_view to usage_event_type enum."""

from __future__ import annotations

from alembic import op

revision = "0025"
down_revision = "0024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE usage_event_type ADD VALUE IF NOT EXISTS 'page_view'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating the type.
    pass
