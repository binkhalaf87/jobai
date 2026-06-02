"""Add user_feature_credits table for direct pay-per-feature model."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0028"
down_revision = "0027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_feature_credits",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("feature", sa.String(60), nullable=False, index=True),
        sa.Column("quantity_granted", sa.Integer, nullable=False),
        sa.Column("quantity_used", sa.Integer, nullable=False, server_default="0"),
        sa.Column("payment_order_id", sa.String(36), sa.ForeignKey("payment_orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_user_feature_credits_user_feature", "user_feature_credits", ["user_id", "feature"])


def downgrade() -> None:
    op.drop_table("user_feature_credits")
