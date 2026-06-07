"""Add saudization tables: recruiter_companies, saudization_decisions, saudization_reports, saudization_analyses."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0034"
down_revision = "0033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "recruiter_companies",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("cr_number", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_recruiter_companies_user_id", "recruiter_companies", ["user_id"])

    op.execute("""
        DO $$
        BEGIN
            CREATE TYPE saudization_processing_status AS ENUM
                ('uploaded', 'processing', 'extracted', 'failed');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$
        BEGIN
            CREATE TYPE saudization_ai_status AS ENUM
                ('pending', 'completed', 'failed');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.create_table(
        "saudization_decisions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("recruiter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("recruiter_companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("decision_number", sa.String(100), nullable=True),
        sa.Column("decision_date", sa.String(50), nullable=True),
        sa.Column("decision_title", sa.String(500), nullable=True),
        sa.Column("issuing_authority", sa.String(255), nullable=True),
        sa.Column("targeted_professions", postgresql.JSONB, nullable=True),
        sa.Column("storage_key", sa.String(500), nullable=True),
        sa.Column("source_filename", sa.String(255), nullable=True),
        sa.Column("raw_text", sa.Text, nullable=True),
        sa.Column("ai_extracted_data", postgresql.JSONB, nullable=True),
        sa.Column(
            "processing_status",
            sa.Enum("uploaded", "processing", "extracted", "failed", name="saudization_processing_status", create_type=False),
            nullable=False,
            server_default="uploaded",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_saudization_decisions_recruiter_id", "saudization_decisions", ["recruiter_id"])
    op.create_index("ix_saudization_decisions_company_id", "saudization_decisions", ["company_id"])

    op.create_table(
        "saudization_reports",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("recruiter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("recruiter_companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("report_date", sa.String(50), nullable=True),
        sa.Column("report_label", sa.String(255), nullable=True),
        sa.Column("storage_key", sa.String(500), nullable=True),
        sa.Column("source_filename", sa.String(255), nullable=True),
        sa.Column("employees", postgresql.JSONB, nullable=True),
        sa.Column("summary", postgresql.JSONB, nullable=True),
        sa.Column(
            "processing_status",
            sa.Enum("uploaded", "processing", "extracted", "failed", name="saudization_processing_status", create_type=False),
            nullable=False,
            server_default="uploaded",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_saudization_reports_recruiter_id", "saudization_reports", ["recruiter_id"])
    op.create_index("ix_saudization_reports_company_id", "saudization_reports", ["company_id"])

    op.create_table(
        "saudization_analyses",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("recruiter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("decision_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("saudization_decisions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("saudization_reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("current_pct", sa.Float, nullable=True),
        sa.Column("target_pct", sa.Float, nullable=True),
        sa.Column("gap_pct", sa.Float, nullable=True),
        sa.Column("profession_gaps", postgresql.JSONB, nullable=True),
        sa.Column("ai_recommendations", sa.Text, nullable=True),
        sa.Column(
            "ai_status",
            sa.Enum("pending", "completed", "failed", name="saudization_ai_status", create_type=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_saudization_analyses_recruiter_id", "saudization_analyses", ["recruiter_id"])
    op.create_index("ix_saudization_analyses_decision_id", "saudization_analyses", ["decision_id"])
    op.create_index("ix_saudization_analyses_report_id", "saudization_analyses", ["report_id"])


def downgrade() -> None:
    op.drop_index("ix_saudization_analyses_report_id", table_name="saudization_analyses")
    op.drop_index("ix_saudization_analyses_decision_id", table_name="saudization_analyses")
    op.drop_index("ix_saudization_analyses_recruiter_id", table_name="saudization_analyses")
    op.drop_table("saudization_analyses")

    op.drop_index("ix_saudization_reports_company_id", table_name="saudization_reports")
    op.drop_index("ix_saudization_reports_recruiter_id", table_name="saudization_reports")
    op.drop_table("saudization_reports")

    op.drop_index("ix_saudization_decisions_company_id", table_name="saudization_decisions")
    op.drop_index("ix_saudization_decisions_recruiter_id", table_name="saudization_decisions")
    op.drop_table("saudization_decisions")

    op.drop_index("ix_recruiter_companies_user_id", table_name="recruiter_companies")
    op.drop_table("recruiter_companies")

    op.execute("DROP TYPE saudization_ai_status")
    op.execute("DROP TYPE saudization_processing_status")
