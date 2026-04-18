"""Add invite token and interview responses to recruiter interviews."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add invite / response tracking columns to recruiter_interviews
    op.add_column("recruiter_interviews", sa.Column("invite_token", sa.String(64), nullable=True, unique=True))
    op.add_column("recruiter_interviews", sa.Column("invite_sent_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("recruiter_interviews", sa.Column("invite_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "recruiter_interviews",
        sa.Column("response_status", sa.String(20), nullable=False, server_default="pending"),
    )
    op.create_index("ix_recruiter_interviews_invite_token", "recruiter_interviews", ["invite_token"], unique=True)

    # New table for candidate video/text responses
    op.create_table(
        "interview_responses",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "interview_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("recruiter_interviews.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("question_index", sa.Integer(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("video_data", sa.Text(), nullable=True),   # base64-encoded WebM
        sa.Column("text_answer", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("interview_responses")
    op.drop_index("ix_recruiter_interviews_invite_token", table_name="recruiter_interviews")
    op.drop_column("recruiter_interviews", "response_status")
    op.drop_column("recruiter_interviews", "invite_expires_at")
    op.drop_column("recruiter_interviews", "invite_sent_at")
    op.drop_column("recruiter_interviews", "invite_token")
