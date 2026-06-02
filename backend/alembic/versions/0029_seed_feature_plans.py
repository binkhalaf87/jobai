"""Seed new pay-per-feature plans for the new pricing model."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0029"
down_revision = "0028"
branch_labels = None
depends_on = None

_NOW = datetime.now(timezone.utc)

plan_audience = sa.Enum("jobseeker", "recruiter", name="plan_audience", create_type=False)
plan_kind = sa.Enum("subscription", "points_pack", name="plan_kind", create_type=False)
billing_interval = sa.Enum("monthly", "one_time", name="billing_interval", create_type=False)


def _plan(code, name, price_sar, feature, quantity, display_order):
    return {
        "id": str(uuid.uuid4()),
        "code": code,
        "name": name,
        "audience": "jobseeker",
        "kind": "points_pack",
        "billing_interval": "one_time",
        "currency": "SAR",
        "price_amount_minor": price_sar * 100,
        "points_grant": 0,
        "is_active": True,
        "display_order": display_order,
        "description": None,
        "metadata_payload": {"feature_grants": [{"feature": feature, "quantity": quantity}]},
        "created_at": _NOW,
        "updated_at": _NOW,
    }


NEW_PLANS = [
    _plan("resume_analysis_7sar", "تحليل السيرة الذاتية", 7, "resume_analysis", 1, 10),
    _plan("resume_improvement_10sar", "تحسين السيرة الذاتية", 10, "resume_improvement", 1, 11),
    _plan("mock_interview_10sar", "تدريب على المقابلة", 10, "mock_interview", 1, 12),
    _plan("smart_send_500_100sar", "إرسال ذكي — 500 شركة", 100, "smart_send_contacts", 500, 20),
    _plan("smart_send_1500_200sar", "إرسال ذكي — 1500 شركة", 200, "smart_send_contacts", 1500, 21),
    _plan("smart_send_3000_269sar", "إرسال ذكي — 3000 شركة", 269, "smart_send_contacts", 3000, 22),
]


def upgrade() -> None:
    conn = op.get_bind()

    plans_table = sa.table(
        "plans",
        sa.column("id", sa.String(36)),
        sa.column("code", sa.String(100)),
        sa.column("name", sa.String(100)),
        sa.column("audience", plan_audience),
        sa.column("kind", plan_kind),
        sa.column("billing_interval", billing_interval),
        sa.column("currency", sa.String(3)),
        sa.column("price_amount_minor", sa.Integer()),
        sa.column("points_grant", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
        sa.column("display_order", sa.Integer()),
        sa.column("description", sa.Text()),
        sa.column("metadata_payload", postgresql.JSONB(astext_type=sa.Text())),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )

    to_insert = []
    for plan in NEW_PLANS:
        existing = conn.execute(
            sa.text("SELECT id FROM plans WHERE code = :code"),
            {"code": plan["code"]},
        ).fetchone()
        if not existing:
            to_insert.append(plan)

    if to_insert:
        op.bulk_insert(plans_table, to_insert)


def downgrade() -> None:
    conn = op.get_bind()
    codes = [p["code"] for p in NEW_PLANS]
    for code in codes:
        conn.execute(sa.text("DELETE FROM plans WHERE code = :code"), {"code": code})
