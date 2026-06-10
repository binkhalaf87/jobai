"""Add open/click tracking fields to marketing campaigns and contacts.

Revision ID: 0040
Revises: 0039
Create Date: 2026-06-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0040"
down_revision = "0039"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("marketing_campaigns", sa.Column("total_opened", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("marketing_campaigns", sa.Column("total_clicked", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("marketing_campaign_contacts", sa.Column("brevo_message_id", sa.String(255), nullable=True))
    op.add_column("marketing_campaign_contacts", sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("marketing_campaign_contacts", sa.Column("clicked_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("marketing_campaign_contacts", "clicked_at")
    op.drop_column("marketing_campaign_contacts", "opened_at")
    op.drop_column("marketing_campaign_contacts", "brevo_message_id")
    op.drop_column("marketing_campaigns", "total_clicked")
    op.drop_column("marketing_campaigns", "total_opened")
