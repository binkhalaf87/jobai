"""Add gmail_connections and send_history tables for OAuth-based Smart Send."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── gmail_connections ──────────────────────────────────────────────────────
    op.create_table(
        "gmail_connections",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("gmail_address", sa.String(length=320), nullable=False),
        sa.Column("encrypted_refresh_token", sa.Text, nullable=False),
        sa.Column("token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_connected", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE",
                                name=op.f("fk_gmail_connections_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_gmail_connections")),
        sa.UniqueConstraint("user_id", name="uq_gmail_connections_user_id"),
    )
    op.create_index("ix_gmail_connections_user_id", "gmail_connections", ["user_id"])

    # ── send_history ───────────────────────────────────────────────────────────
    op.create_table(
        "send_history",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("resume_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("job_title", sa.String(length=255), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("subject", sa.String(length=500), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("recipient_email", sa.String(length=320), nullable=False),
        sa.Column("recipient_name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE",
                                name=op.f("fk_send_history_user_id_users")),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="SET NULL",
                                name=op.f("fk_send_history_resume_id_resumes")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_send_history")),
    )
    op.create_index("ix_send_history_user_id", "send_history", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_send_history_user_id", table_name="send_history")
    op.drop_table("send_history")
    op.drop_index("ix_gmail_connections_user_id", table_name="gmail_connections")
    op.drop_table("gmail_connections")
