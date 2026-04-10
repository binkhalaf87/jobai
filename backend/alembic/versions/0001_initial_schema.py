"""Initial schema for the resume analysis platform."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


resume_processing_status = postgresql.ENUM(
    "uploaded",
    "processing",
    "parsed",
    "failed",
    name="resume_processing_status",
)
employment_type = postgresql.ENUM(
    "full_time",
    "part_time",
    "contract",
    "internship",
    "temporary",
    name="employment_type",
)
analysis_status = postgresql.ENUM(
    "queued",
    "processing",
    "completed",
    "failed",
    name="analysis_status",
)
suggestion_section = postgresql.ENUM(
    "summary",
    "experience",
    "skills",
    "education",
    "general",
    name="suggestion_section",
)
subscription_status = postgresql.ENUM(
    "trialing",
    "active",
    "past_due",
    "canceled",
    name="subscription_status",
)
usage_event_type = postgresql.ENUM(
    "analysis_requested",
    "analysis_completed",
    "rewrite_generated",
    "auth_login",
    name="usage_event_type",
)


def upgrade() -> None:
    bind = op.get_bind()
    resume_processing_status.create(bind, checkfirst=True)
    employment_type.create(bind, checkfirst=True)
    analysis_status.create(bind, checkfirst=True)
    suggestion_section.create(bind, checkfirst=True)
    subscription_status.create(bind, checkfirst=True)
    usage_event_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "job_descriptions",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("employment_type", employment_type, nullable=True),
        sa.Column("location_text", sa.String(length=255), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name=op.f("fk_job_descriptions_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_job_descriptions")),
    )
    op.create_index(op.f("ix_job_descriptions_user_id"), "job_descriptions", ["user_id"], unique=False)

    op.create_table(
        "resumes",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("source_filename", sa.String(length=255), nullable=True),
        sa.Column("file_type", sa.String(length=50), nullable=True),
        sa.Column("storage_key", sa.String(length=500), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("page_count", sa.Integer(), nullable=True),
        sa.Column("processing_status", resume_processing_status, server_default="uploaded", nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name=op.f("fk_resumes_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_resumes")),
    )
    op.create_index(op.f("ix_resumes_user_id"), "resumes", ["user_id"], unique=False)

    op.create_table(
        "subscriptions",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("plan_name", sa.String(length=100), nullable=False),
        sa.Column("status", subscription_status, server_default="trialing", nullable=False),
        sa.Column("provider_name", sa.String(length=50), server_default="stripe", nullable=False),
        sa.Column("provider_customer_id", sa.String(length=255), nullable=True),
        sa.Column("provider_subscription_id", sa.String(length=255), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_at_period_end", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name=op.f("fk_subscriptions_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_subscriptions")),
        sa.UniqueConstraint("provider_subscription_id", name=op.f("uq_subscriptions_provider_subscription_id")),
    )
    op.create_index(op.f("ix_subscriptions_provider_customer_id"), "subscriptions", ["provider_customer_id"], unique=False)
    op.create_index(op.f("ix_subscriptions_user_id"), "subscriptions", ["user_id"], unique=False)

    op.create_table(
        "analyses",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("resume_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("job_description_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("status", analysis_status, server_default="queued", nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("overall_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("summary_text", sa.Text(), nullable=True),
        sa.Column("result_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["job_description_id"], ["job_descriptions.id"], ondelete="CASCADE", name=op.f("fk_analyses_job_description_id_job_descriptions")),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE", name=op.f("fk_analyses_resume_id_resumes")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name=op.f("fk_analyses_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_analyses")),
    )
    op.create_index(op.f("ix_analyses_job_description_id"), "analyses", ["job_description_id"], unique=False)
    op.create_index(op.f("ix_analyses_resume_id"), "analyses", ["resume_id"], unique=False)
    op.create_index(op.f("ix_analyses_user_id"), "analyses", ["user_id"], unique=False)

    op.create_table(
        "rewrite_suggestions",
        sa.Column("analysis_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("section", suggestion_section, nullable=False),
        sa.Column("original_text", sa.Text(), nullable=True),
        sa.Column("suggested_text", sa.Text(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("is_applied", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("anchor_label", sa.String(length=255), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["analysis_id"], ["analyses.id"], ondelete="CASCADE", name=op.f("fk_rewrite_suggestions_analysis_id_analyses")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rewrite_suggestions")),
    )
    op.create_index(op.f("ix_rewrite_suggestions_analysis_id"), "rewrite_suggestions", ["analysis_id"], unique=False)

    op.create_table(
        "usage_logs",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("analysis_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("event_type", usage_event_type, nullable=False),
        sa.Column("request_id", sa.String(length=100), nullable=True),
        sa.Column("credits_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("event_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.ForeignKeyConstraint(["analysis_id"], ["analyses.id"], ondelete="SET NULL", name=op.f("fk_usage_logs_analysis_id_analyses")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name=op.f("fk_usage_logs_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_usage_logs")),
    )
    op.create_index(op.f("ix_usage_logs_created_at"), "usage_logs", ["created_at"], unique=False)
    op.create_index(op.f("ix_usage_logs_event_type"), "usage_logs", ["event_type"], unique=False)
    op.create_index(op.f("ix_usage_logs_request_id"), "usage_logs", ["request_id"], unique=False)
    op.create_index(op.f("ix_usage_logs_user_id"), "usage_logs", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_usage_logs_user_id"), table_name="usage_logs")
    op.drop_index(op.f("ix_usage_logs_request_id"), table_name="usage_logs")
    op.drop_index(op.f("ix_usage_logs_event_type"), table_name="usage_logs")
    op.drop_index(op.f("ix_usage_logs_created_at"), table_name="usage_logs")
    op.drop_table("usage_logs")

    op.drop_index(op.f("ix_rewrite_suggestions_analysis_id"), table_name="rewrite_suggestions")
    op.drop_table("rewrite_suggestions")

    op.drop_index(op.f("ix_analyses_user_id"), table_name="analyses")
    op.drop_index(op.f("ix_analyses_resume_id"), table_name="analyses")
    op.drop_index(op.f("ix_analyses_job_description_id"), table_name="analyses")
    op.drop_table("analyses")

    op.drop_index(op.f("ix_subscriptions_user_id"), table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_provider_customer_id"), table_name="subscriptions")
    op.drop_table("subscriptions")

    op.drop_index(op.f("ix_resumes_user_id"), table_name="resumes")
    op.drop_table("resumes")

    op.drop_index(op.f("ix_job_descriptions_user_id"), table_name="job_descriptions")
    op.drop_table("job_descriptions")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    usage_event_type.drop(bind, checkfirst=True)
    subscription_status.drop(bind, checkfirst=True)
    suggestion_section.drop(bind, checkfirst=True)
    analysis_status.drop(bind, checkfirst=True)
    employment_type.drop(bind, checkfirst=True)
    resume_processing_status.drop(bind, checkfirst=True)
