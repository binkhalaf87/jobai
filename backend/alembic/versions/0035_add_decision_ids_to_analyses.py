"""Add decision_ids JSONB to saudization_analyses for multi-decision support."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0035"
down_revision = "0034"
branch_labels = None
depends_on = None


def _col_exists(conn, table: str, col: str) -> bool:
    return bool(conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table, "c": col},
    ).scalar())


def upgrade() -> None:
    conn = op.get_bind()
    if not _col_exists(conn, "saudization_analyses", "decision_ids"):
        op.add_column(
            "saudization_analyses",
            sa.Column("decision_ids", postgresql.JSONB, nullable=True),
        )


def downgrade() -> None:
    op.drop_column("saudization_analyses", "decision_ids")
