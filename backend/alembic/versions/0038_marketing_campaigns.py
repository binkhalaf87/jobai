"""add marketing campaigns tables

Revision ID: 0038
Revises: 0037
Create Date: 2026-06-09
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0038"
down_revision = "0037"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "marketing_campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("html_body", sa.Text(), nullable=False),
        sa.Column("from_name", sa.String(255), nullable=False, server_default="JobAI24"),
        sa.Column("from_email", sa.String(255), nullable=False, server_default="marketing@jobai24.com"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("warmup_start_date", sa.Date(), nullable=True),
        sa.Column("current_daily_limit", sa.Integer(), nullable=False, server_default="500"),
        sa.Column("total_contacts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_sent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_failed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id", name="pk_marketing_campaigns"),
    )
    op.create_index("ix_marketing_campaigns_status", "marketing_campaigns", ["status"])

    op.create_table(
        "marketing_campaign_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(
            ["campaign_id"],
            ["marketing_campaigns.id"],
            name="fk_marketing_campaign_contacts_campaign_id_marketing_campaigns",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_marketing_campaign_contacts"),
    )
    op.create_index("ix_marketing_campaign_contacts_campaign_id", "marketing_campaign_contacts", ["campaign_id"])
    op.create_index("ix_marketing_campaign_contacts_email", "marketing_campaign_contacts", ["email"])
    op.create_index("ix_marketing_campaign_contacts_status", "marketing_campaign_contacts", ["status"])


def downgrade() -> None:
    op.drop_table("marketing_campaign_contacts")
    op.drop_table("marketing_campaigns")
