"""Add recruiter_stage column to resumes table."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "CREATE TYPE candidate_stage AS ENUM ('new', 'shortlisted', 'interview', 'rejected')"
    )
    op.add_column(
        "resumes",
        sa.Column(
            "recruiter_stage",
            sa.Enum("new", "shortlisted", "interview", "rejected", name="candidate_stage"),
            nullable=False,
            server_default="new",
        ),
    )


def downgrade() -> None:
    op.drop_column("resumes", "recruiter_stage")
    op.execute("DROP TYPE candidate_stage")
