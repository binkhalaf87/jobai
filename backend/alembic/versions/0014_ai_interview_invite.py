"""Create recruiter_interviews table and add invite/response columns."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the base recruiter_interviews table if it does not already exist.
    # This guards against deployments where the table was never created by a prior migration.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS recruiter_interviews (
            id          UUID         NOT NULL,
            recruiter_id UUID        NOT NULL,
            resume_id    UUID        NOT NULL,
            job_id       UUID        NOT NULL,
            interview_type VARCHAR(20) NOT NULL DEFAULT 'mixed',
            language     VARCHAR(10) NOT NULL DEFAULT 'en',
            generated_questions JSONB,
            status       VARCHAR(20) NOT NULL DEFAULT 'ready',
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_recruiter_interviews PRIMARY KEY (id),
            CONSTRAINT fk_recruiter_interviews_recruiter_id_users
                FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_recruiter_interviews_resume_id_resumes
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
            CONSTRAINT fk_recruiter_interviews_job_id_job_descriptions
                FOREIGN KEY (job_id) REFERENCES job_descriptions(id) ON DELETE CASCADE
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_recruiter_interviews_recruiter_id "
        "ON recruiter_interviews (recruiter_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_recruiter_interviews_resume_id "
        "ON recruiter_interviews (resume_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_recruiter_interviews_job_id "
        "ON recruiter_interviews (job_id)"
    )

    # Add invite / response-tracking columns (idempotent via ADD COLUMN IF NOT EXISTS)
    op.execute(
        "ALTER TABLE recruiter_interviews "
        "ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64)"
    )
    op.execute(
        "ALTER TABLE recruiter_interviews "
        "ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ"
    )
    op.execute(
        "ALTER TABLE recruiter_interviews "
        "ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ"
    )
    op.execute(
        "ALTER TABLE recruiter_interviews "
        "ADD COLUMN IF NOT EXISTS response_status VARCHAR(20) NOT NULL DEFAULT 'pending'"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_recruiter_interviews_invite_token "
        "ON recruiter_interviews (invite_token)"
    )

    # interview_responses table
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS interview_responses (
            id              UUID         NOT NULL,
            interview_id    UUID         NOT NULL,
            question_index  INTEGER      NOT NULL,
            question_text   TEXT         NOT NULL,
            video_data      TEXT,
            text_answer     TEXT,
            submitted_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_interview_responses PRIMARY KEY (id),
            CONSTRAINT fk_interview_responses_interview_id_recruiter_interviews
                FOREIGN KEY (interview_id)
                REFERENCES recruiter_interviews(id) ON DELETE CASCADE
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_interview_responses_interview_id "
        "ON interview_responses (interview_id)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS interview_responses")
    op.execute("DROP INDEX IF EXISTS ix_recruiter_interviews_invite_token")
    op.execute(
        "ALTER TABLE IF EXISTS recruiter_interviews "
        "DROP COLUMN IF EXISTS response_status"
    )
    op.execute(
        "ALTER TABLE IF EXISTS recruiter_interviews "
        "DROP COLUMN IF EXISTS invite_expires_at"
    )
    op.execute(
        "ALTER TABLE IF EXISTS recruiter_interviews "
        "DROP COLUMN IF EXISTS invite_sent_at"
    )
    op.execute(
        "ALTER TABLE IF EXISTS recruiter_interviews "
        "DROP COLUMN IF EXISTS invite_token"
    )
    op.execute("DROP INDEX IF EXISTS ix_recruiter_interviews_recruiter_id")
    op.execute("DROP INDEX IF EXISTS ix_recruiter_interviews_resume_id")
    op.execute("DROP INDEX IF EXISTS ix_recruiter_interviews_job_id")
    op.execute("DROP TABLE IF EXISTS recruiter_interviews")
