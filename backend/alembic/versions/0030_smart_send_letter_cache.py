"""Add smart_send_letter_cache table for caching generated cover letters."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0030"
down_revision = "0029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "smart_send_letter_cache",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cache_key", sa.String(64), nullable=False),
        sa.Column("subject", sa.Text, nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "cache_key", name="uq_letter_cache_user_key"),
    )
    op.create_index(
        "ix_letter_cache_lookup",
        "smart_send_letter_cache",
        ["user_id", "cache_key", "expires_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_letter_cache_lookup", table_name="smart_send_letter_cache")
    op.drop_table("smart_send_letter_cache")
