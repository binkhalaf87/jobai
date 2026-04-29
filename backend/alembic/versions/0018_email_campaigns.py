"""Add email_campaigns and email_campaign_contacts tables for drip sending."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── email_campaigns ────────────────────────────────────────────────────────
    op.create_table(
        "email_campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("list_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("resume_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("list_name", sa.String(length=255), nullable=True),
        sa.Column("subject", sa.String(length=500), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("daily_limit", sa.Integer, nullable=False, server_default="100"),
        sa.Column("total_contacts", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_sent", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_failed", sa.Integer, nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE",
                                name=op.f("fk_email_campaigns_user_id_users")),
        sa.ForeignKeyConstraint(["list_id"], ["recipient_lists.id"], ondelete="SET NULL",
                                name=op.f("fk_email_campaigns_list_id_recipient_lists")),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="SET NULL",
                                name=op.f("fk_email_campaigns_resume_id_resumes")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_email_campaigns")),
    )
    op.create_index("ix_email_campaigns_user_id", "email_campaigns", ["user_id"])
    op.create_index("ix_email_campaigns_status", "email_campaigns", ["status"])

    # ── email_campaign_contacts ────────────────────────────────────────────────
    op.create_table(
        "email_campaign_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("recipient_email", sa.String(length=320), nullable=False),
        sa.Column("recipient_name", sa.String(length=255), nullable=True),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["campaign_id"], ["email_campaigns.id"], ondelete="CASCADE",
                                name=op.f("fk_email_campaign_contacts_campaign_id_email_campaigns")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_email_campaign_contacts")),
    )
    op.create_index("ix_ecc_campaign_status", "email_campaign_contacts", ["campaign_id", "status"])


def downgrade() -> None:
    op.drop_index("ix_ecc_campaign_status", table_name="email_campaign_contacts")
    op.drop_table("email_campaign_contacts")
    op.drop_index("ix_email_campaigns_status", table_name="email_campaigns")
    op.drop_index("ix_email_campaigns_user_id", table_name="email_campaigns")
    op.drop_table("email_campaigns")
