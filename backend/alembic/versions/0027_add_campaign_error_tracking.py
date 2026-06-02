"""Add error_message and last_sent_at to email_campaigns."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0027"
down_revision = "0026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "email_campaigns",
        sa.Column("last_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "email_campaigns",
        sa.Column("error_message", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("email_campaigns", "error_message")
    op.drop_column("email_campaigns", "last_sent_at")
