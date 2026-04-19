"""Add job_description_id to ai_analysis_reports."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ai_analysis_reports",
        sa.Column("job_description_id", sa.String(length=36), nullable=True),
    )
    op.create_index(
        "ix_ai_analysis_reports_job_description_id",
        "ai_analysis_reports",
        ["job_description_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_ai_analysis_reports_job_description_id", table_name="ai_analysis_reports")
    op.drop_column("ai_analysis_reports", "job_description_id")
