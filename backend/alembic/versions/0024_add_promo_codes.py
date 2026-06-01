"""Add promo_codes and promo_code_usages tables for admin discount code management.

Revision ID: 0024
Revises: 0023
Create Date: 2026-06-01
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0024"
down_revision = "0023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "promo_codes",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("discount_type", sa.String(20), nullable=False),
        sa.Column("discount_value", sa.Integer(), nullable=False),
        sa.Column("applicable_to", sa.String(20), nullable=False, server_default="all"),
        sa.Column("plan_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("uses_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_uses_per_user", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_promo_codes_code"),
    )
    op.create_index("ix_promo_codes_code", "promo_codes", ["code"], unique=True)
    op.create_index("ix_promo_codes_is_active", "promo_codes", ["is_active"])
    op.create_index("ix_promo_codes_applicable_to", "promo_codes", ["applicable_to"])
    op.create_index("ix_promo_codes_plan_id", "promo_codes", ["plan_id"])
    op.create_index("ix_promo_codes_created_by_id", "promo_codes", ["created_by_id"])

    op.create_table(
        "promo_code_usages",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("promo_code_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("payment_order_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("discount_applied_minor", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["promo_code_id"], ["promo_codes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payment_order_id"], ["payment_orders.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_promo_code_usages_promo_code_id", "promo_code_usages", ["promo_code_id"])
    op.create_index("ix_promo_code_usages_user_id", "promo_code_usages", ["user_id"])
    op.create_index("ix_promo_code_usages_payment_order_id", "promo_code_usages", ["payment_order_id"])


def downgrade() -> None:
    op.drop_index("ix_promo_code_usages_payment_order_id", table_name="promo_code_usages")
    op.drop_index("ix_promo_code_usages_user_id", table_name="promo_code_usages")
    op.drop_index("ix_promo_code_usages_promo_code_id", table_name="promo_code_usages")
    op.drop_table("promo_code_usages")

    op.drop_index("ix_promo_codes_created_by_id", table_name="promo_codes")
    op.drop_index("ix_promo_codes_plan_id", table_name="promo_codes")
    op.drop_index("ix_promo_codes_applicable_to", table_name="promo_codes")
    op.drop_index("ix_promo_codes_is_active", table_name="promo_codes")
    op.drop_index("ix_promo_codes_code", table_name="promo_codes")
    op.drop_table("promo_codes")
