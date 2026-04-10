"""Add ai_analysis_reports table for free-form GPT resume reports."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_analysis_reports",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("resume_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("resume_title", sa.String(length=255), nullable=True),
        sa.Column("job_description_text", sa.Text(), nullable=True),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("report_text", sa.Text(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"],
            ondelete="CASCADE",
            name=op.f("fk_ai_analysis_reports_user_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["resume_id"], ["resumes.id"],
            ondelete="CASCADE",
            name=op.f("fk_ai_analysis_reports_resume_id_resumes"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_analysis_reports")),
    )
    op.create_index(op.f("ix_ai_analysis_reports_user_id"), "ai_analysis_reports", ["user_id"])
    op.create_index(op.f("ix_ai_analysis_reports_resume_id"), "ai_analysis_reports", ["resume_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_analysis_reports_resume_id"), table_name="ai_analysis_reports")
    op.drop_index(op.f("ix_ai_analysis_reports_user_id"), table_name="ai_analysis_reports")
    op.drop_table("ai_analysis_reports")
