"""Add requested_gmail to gmail_connection_requests."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0026"
down_revision = "0025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "gmail_connection_requests",
        sa.Column("requested_gmail", sa.String(320), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("gmail_connection_requests", "requested_gmail")
