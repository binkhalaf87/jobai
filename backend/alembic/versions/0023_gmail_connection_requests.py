"""Add gmail_connection_requests table for admin-gated Gmail OAuth.

Revision ID: 0023
Revises: 0022
Create Date: 2026-05-18
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0023"
down_revision = "0022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gmail_connection_requests",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_gmail_connection_requests_user_id", "gmail_connection_requests", ["user_id"])
    op.create_index("ix_gmail_connection_requests_status", "gmail_connection_requests", ["status"])


def downgrade() -> None:
    op.drop_index("ix_gmail_connection_requests_status", table_name="gmail_connection_requests")
    op.drop_index("ix_gmail_connection_requests_user_id", table_name="gmail_connection_requests")
    op.drop_table("gmail_connection_requests")
