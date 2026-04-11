"""Add smart send tables: smtp_connections, recipient_lists, recipients, send_campaigns, send_logs."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── smtp_connections ───────────────────────────────────────────────────────
    op.create_table(
        "smtp_connections",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("gmail_address", sa.String(length=320), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("encrypted_app_password", sa.String(length=512), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE",
                                name=op.f("fk_smtp_connections_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_smtp_connections")),
        sa.UniqueConstraint("user_id", name="uq_smtp_connections_user_id"),
    )
    op.create_index(op.f("ix_smtp_connections_user_id"), "smtp_connections", ["user_id"])

    # ── recipient_lists ────────────────────────────────────────────────────────
    op.create_table(
        "recipient_lists",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=True),
        sa.Column("total_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE",
                                name=op.f("fk_recipient_lists_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recipient_lists")),
    )
    op.create_index(op.f("ix_recipient_lists_user_id"), "recipient_lists", ["user_id"])

    # ── recipients ─────────────────────────────────────────────────────────────
    op.create_table(
        "recipients",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("list_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("job_title", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("unsubscribed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["list_id"], ["recipient_lists.id"], ondelete="CASCADE",
                                name=op.f("fk_recipients_list_id_recipient_lists")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE",
                                name=op.f("fk_recipients_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recipients")),
        sa.UniqueConstraint("list_id", "email", name="uq_recipients_list_id_email"),
    )
    op.create_index(op.f("ix_recipients_list_id"), "recipients", ["list_id"])
    op.create_index(op.f("ix_recipients_user_id"), "recipients", ["user_id"])

    # ── send_campaigns ─────────────────────────────────────────────────────────
    op.create_table(
        "send_campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("smtp_connection_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("resume_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("job_title", sa.String(length=255), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("job_description", sa.Text(), nullable=True),
        sa.Column("letters", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("selected_variant", sa.String(length=20), nullable=True),
        sa.Column("subject", sa.String(length=500), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("ad_hoc_recipients", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("recipient_list_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("total_recipients", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sent_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE",
                                name=op.f("fk_send_campaigns_user_id_users")),
        sa.ForeignKeyConstraint(["smtp_connection_id"], ["smtp_connections.id"], ondelete="SET NULL",
                                name=op.f("fk_send_campaigns_smtp_connection_id_smtp_connections")),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="SET NULL",
                                name=op.f("fk_send_campaigns_resume_id_resumes")),
        sa.ForeignKeyConstraint(["recipient_list_id"], ["recipient_lists.id"], ondelete="SET NULL",
                                name=op.f("fk_send_campaigns_recipient_list_id_recipient_lists")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_send_campaigns")),
    )
    op.create_index(op.f("ix_send_campaigns_user_id"), "send_campaigns", ["user_id"])
    op.create_index(op.f("ix_send_campaigns_status"), "send_campaigns", ["status"])

    # ── send_logs ──────────────────────────────────────────────────────────────
    op.create_table(
        "send_logs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("recipient_email", sa.String(length=320), nullable=False),
        sa.Column("recipient_name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["send_campaigns.id"], ondelete="CASCADE",
                                name=op.f("fk_send_logs_campaign_id_send_campaigns")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE",
                                name=op.f("fk_send_logs_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_send_logs")),
    )
    op.create_index(op.f("ix_send_logs_campaign_id"), "send_logs", ["campaign_id"])
    op.create_index(op.f("ix_send_logs_user_id"), "send_logs", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_send_logs_user_id"), table_name="send_logs")
    op.drop_index(op.f("ix_send_logs_campaign_id"), table_name="send_logs")
    op.drop_table("send_logs")

    op.drop_index(op.f("ix_send_campaigns_status"), table_name="send_campaigns")
    op.drop_index(op.f("ix_send_campaigns_user_id"), table_name="send_campaigns")
    op.drop_table("send_campaigns")

    op.drop_index(op.f("ix_recipients_user_id"), table_name="recipients")
    op.drop_index(op.f("ix_recipients_list_id"), table_name="recipients")
    op.drop_table("recipients")

    op.drop_index(op.f("ix_recipient_lists_user_id"), table_name="recipient_lists")
    op.drop_table("recipient_lists")

    op.drop_index(op.f("ix_smtp_connections_user_id"), table_name="smtp_connections")
    op.drop_table("smtp_connections")
