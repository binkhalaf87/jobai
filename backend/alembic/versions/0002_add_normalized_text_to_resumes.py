"""Add normalized_text column to resumes."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("resumes", sa.Column("normalized_text", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("resumes", "normalized_text")
