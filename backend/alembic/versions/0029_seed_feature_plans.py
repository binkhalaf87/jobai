"""Seed new pay-per-feature plans for the new pricing model."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op

revision = "0029"
down_revision = "0028"
branch_labels = None
depends_on = None

_NOW = datetime.now(timezone.utc)


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
        "metadata_payload": json.dumps({"feature_grants": [{"feature": feature, "quantity": quantity}]}),
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

_INSERT_SQL = sa.text("""
    INSERT INTO plans (
        id, code, name, audience, kind, billing_interval, currency,
        price_amount_minor, points_grant, is_active, display_order,
        description, metadata_payload, created_at, updated_at
    ) VALUES (
        CAST(:id AS uuid), :code, :name,
        CAST(:audience AS plan_audience), CAST(:kind AS plan_kind),
        CAST(:billing_interval AS billing_interval),
        :currency, :price_amount_minor, :points_grant, :is_active, :display_order,
        :description, CAST(:metadata_payload AS jsonb), :created_at, :updated_at
    )
""")


def upgrade() -> None:
    conn = op.get_bind()
    for plan in NEW_PLANS:
        existing = conn.execute(
            sa.text("SELECT id FROM plans WHERE code = :code"),
            {"code": plan["code"]},
        ).fetchone()
        if not existing:
            conn.execute(_INSERT_SQL, plan)


def downgrade() -> None:
    conn = op.get_bind()
    codes = [p["code"] for p in NEW_PLANS]
    for code in codes:
        conn.execute(sa.text("DELETE FROM plans WHERE code = :code"), {"code": code})
