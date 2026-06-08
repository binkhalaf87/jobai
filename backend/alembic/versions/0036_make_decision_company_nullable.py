"""Make saudization_decisions.company_id nullable (decisions apply to all companies)."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0036"
down_revision = "0035"
branch_labels = None
depends_on = None


def _col_nullable(conn, table: str, col: str) -> bool:
    """Return True if the column already allows NULL."""
    row = conn.execute(
        sa.text(
            "SELECT is_nullable FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table, "c": col},
    ).fetchone()
    return row is not None and row[0].upper() == "YES"


def upgrade() -> None:
    conn = op.get_bind()
    if not _col_nullable(conn, "saudization_decisions", "company_id"):
        # Drop FK constraint first, then alter nullable, then re-add FK nullable
        conn.execute(sa.text(
            "ALTER TABLE saudization_decisions "
            "DROP CONSTRAINT IF EXISTS saudization_decisions_company_id_fkey"
        ))
        conn.execute(sa.text(
            "ALTER TABLE saudization_decisions "
            "ALTER COLUMN company_id DROP NOT NULL"
        ))
        conn.execute(sa.text(
            "ALTER TABLE saudization_decisions "
            "ADD CONSTRAINT saudization_decisions_company_id_fkey "
            "FOREIGN KEY (company_id) REFERENCES recruiter_companies(id) ON DELETE SET NULL"
        ))

    # Add decision_definition column if missing
    def col_exists(t: str, c: str) -> bool:
        return bool(conn.execute(
            sa.text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
            ),
            {"t": t, "c": c},
        ).scalar())

    if not col_exists("saudization_decisions", "decision_definition"):
        op.add_column(
            "saudization_decisions",
            sa.Column("decision_definition", sa.Text, nullable=True),
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE saudization_decisions "
        "DROP CONSTRAINT IF EXISTS saudization_decisions_company_id_fkey"
    ))
    conn.execute(sa.text(
        "ALTER TABLE saudization_decisions "
        "ALTER COLUMN company_id SET NOT NULL"
    ))
    conn.execute(sa.text(
        "ALTER TABLE saudization_decisions "
        "ADD CONSTRAINT saudization_decisions_company_id_fkey "
        "FOREIGN KEY (company_id) REFERENCES recruiter_companies(id) ON DELETE CASCADE"
    ))
    op.drop_column("saudization_decisions", "decision_definition")
