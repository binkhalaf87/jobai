"""Add admin value to user role — no schema change needed (role is String)."""

from __future__ import annotations

from alembic import op

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # role column is String(20) — 'admin' value is already valid.
    # This migration documents the change and establishes the revision chain.
    pass


def downgrade() -> None:
    op.execute("UPDATE users SET role = 'jobseeker' WHERE role = 'admin'")
