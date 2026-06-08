"""widen decision varchar columns to 300/500

Revision ID: 0037
Revises: 0036
Create Date: 2026-06-08
"""

from alembic import op

revision = "0037"
down_revision = "0036"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE saudization_decisions
            ALTER COLUMN decision_number   TYPE VARCHAR(300),
            ALTER COLUMN decision_date     TYPE VARCHAR(300),
            ALTER COLUMN issuing_authority TYPE VARCHAR(500);
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE saudization_decisions
            ALTER COLUMN decision_number   TYPE VARCHAR(100),
            ALTER COLUMN decision_date     TYPE VARCHAR(50),
            ALTER COLUMN issuing_authority TYPE VARCHAR(255);
    """)
