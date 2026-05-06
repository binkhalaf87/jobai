"""Add composite performance indexes for common query patterns."""

from __future__ import annotations

from alembic import op

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # analyses: best-analysis-per-resume lookup (resume_id + status + score)
    op.create_index(
        "ix_analysis_resume_score",
        "analyses",
        ["resume_id", "status", "overall_score"],
    )

    # resumes: list_candidates orders by created_at per user
    op.create_index(
        "ix_resume_user_created",
        "resumes",
        ["user_id", "created_at"],
    )

    # usage_logs: ai_budget check filters on user_id + event_type + created_at
    op.create_index(
        "ix_usage_log_user_event_date",
        "usage_logs",
        ["user_id", "event_type", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_usage_log_user_event_date", table_name="usage_logs")
    op.drop_index("ix_resume_user_created", table_name="resumes")
    op.drop_index("ix_analysis_resume_score", table_name="analyses")
