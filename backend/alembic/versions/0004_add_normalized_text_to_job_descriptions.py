"""Add normalized_text column to job_descriptions."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("job_descriptions", sa.Column("normalized_text", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("job_descriptions", "normalized_text")
