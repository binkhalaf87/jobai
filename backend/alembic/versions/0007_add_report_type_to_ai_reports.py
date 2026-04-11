"""Add report_type column to ai_analysis_reports to distinguish analysis vs enhancement."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ai_analysis_reports",
        sa.Column("report_type", sa.String(length=20), server_default="analysis", nullable=False),
    )
    op.create_index(
        op.f("ix_ai_analysis_reports_report_type"),
        "ai_analysis_reports",
        ["report_type"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_analysis_reports_report_type"), table_name="ai_analysis_reports")
    op.drop_column("ai_analysis_reports", "report_type")
