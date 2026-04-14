"""Add Paymob billing tables and plan catalog."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


plan_audience = postgresql.ENUM("jobseeker", "recruiter", name="plan_audience", create_type=False)
plan_kind = postgresql.ENUM("subscription", "points_pack", name="plan_kind", create_type=False)
billing_interval = postgresql.ENUM("monthly", "one_time", name="billing_interval", create_type=False)
payment_order_type = postgresql.ENUM(
    "subscription_initial",
    "subscription_renewal",
    "points_purchase",
    name="payment_order_type",
    create_type=False,
)
payment_order_status = postgresql.ENUM(
    "pending",
    "payment_key_issued",
    "paid",
    "failed",
    "canceled",
    "expired",
    "refunded",
    "partially_refunded",
    name="payment_order_status",
    create_type=False,
)
payment_webhook_event_status = postgresql.ENUM(
    "received",
    "processed",
    "ignored",
    "failed",
    name="payment_webhook_event_status",
    create_type=False,
)
wallet_transaction_type = postgresql.ENUM(
    "subscription_grant",
    "points_purchase",
    "usage_debit",
    "refund_credit",
    "adjustment",
    name="wallet_transaction_type",
    create_type=False,
)
wallet_transaction_status = postgresql.ENUM(
    "posted",
    "reversed",
    name="wallet_transaction_status",
    create_type=False,
)
wallet_transaction_direction = postgresql.ENUM(
    "credit",
    "debit",
    name="wallet_transaction_direction",
    create_type=False,
)


PLAN_ROWS = [
    {
        "id": "2d6a6c9e-5e06-4da4-9d92-3e5d3c30a001",
        "code": "recruiter_starter_monthly",
        "name": "Recruiter Starter",
        "audience": "recruiter",
        "kind": "subscription",
        "billing_interval": "monthly",
        "currency": "SAR",
        "price_amount_minor": None,
        "points_grant": 0,
        "is_active": True,
        "display_order": 1,
        "description": "Starter monthly subscription for recruiter accounts.",
        "metadata_payload": None,
    },
    {
        "id": "2d6a6c9e-5e06-4da4-9d92-3e5d3c30a002",
        "code": "recruiter_growth_monthly",
        "name": "Recruiter Growth",
        "audience": "recruiter",
        "kind": "subscription",
        "billing_interval": "monthly",
        "currency": "SAR",
        "price_amount_minor": None,
        "points_grant": 0,
        "is_active": True,
        "display_order": 2,
        "description": "Growth monthly subscription for recruiter accounts.",
        "metadata_payload": None,
    },
    {
        "id": "2d6a6c9e-5e06-4da4-9d92-3e5d3c30a003",
        "code": "recruiter_scale_monthly",
        "name": "Recruiter Scale",
        "audience": "recruiter",
        "kind": "subscription",
        "billing_interval": "monthly",
        "currency": "SAR",
        "price_amount_minor": None,
        "points_grant": 0,
        "is_active": True,
        "display_order": 3,
        "description": "Scale monthly subscription for recruiter accounts.",
        "metadata_payload": None,
    },
    {
        "id": "2d6a6c9e-5e06-4da4-9d92-3e5d3c30a004",
        "code": "jobseeker_monthly_29_sar",
        "name": "Jobseeker Monthly",
        "audience": "jobseeker",
        "kind": "subscription",
        "billing_interval": "monthly",
        "currency": "SAR",
        "price_amount_minor": 2900,
        "points_grant": 0,
        "is_active": True,
        "display_order": 4,
        "description": "29 SAR monthly subscription for jobseeker accounts.",
        "metadata_payload": None,
    },
]


def upgrade() -> None:
    bind = op.get_bind()

    op.execute("ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'pending_activation'")
    op.execute("ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'expired'")

    plan_audience.create(bind, checkfirst=True)
    plan_kind.create(bind, checkfirst=True)
    billing_interval.create(bind, checkfirst=True)
    payment_order_type.create(bind, checkfirst=True)
    payment_order_status.create(bind, checkfirst=True)
    payment_webhook_event_status.create(bind, checkfirst=True)
    wallet_transaction_type.create(bind, checkfirst=True)
    wallet_transaction_status.create(bind, checkfirst=True)
    wallet_transaction_direction.create(bind, checkfirst=True)

    op.create_table(
        "plans",
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("audience", plan_audience, nullable=False),
        sa.Column("kind", plan_kind, nullable=False),
        sa.Column("billing_interval", billing_interval, nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="SAR", nullable=False),
        sa.Column("price_amount_minor", sa.Integer(), nullable=True),
        sa.Column("points_grant", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("metadata_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_plans")),
        sa.UniqueConstraint("code", name=op.f("uq_plans_code")),
    )
    op.create_index(op.f("ix_plans_audience"), "plans", ["audience"], unique=False)
    op.create_index(op.f("ix_plans_code"), "plans", ["code"], unique=False)
    op.create_index(op.f("ix_plans_kind"), "plans", ["kind"], unique=False)

    plans_table = sa.table(
        "plans",
        sa.column("id", postgresql.UUID(as_uuid=False)),
        sa.column("code", sa.String(length=100)),
        sa.column("name", sa.String(length=100)),
        sa.column("audience", sa.String(length=20)),
        sa.column("kind", sa.String(length=20)),
        sa.column("billing_interval", sa.String(length=20)),
        sa.column("currency", sa.String(length=3)),
        sa.column("price_amount_minor", sa.Integer()),
        sa.column("points_grant", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
        sa.column("display_order", sa.Integer()),
        sa.column("description", sa.Text()),
        sa.column("metadata_payload", postgresql.JSONB(astext_type=sa.Text())),
    )
    op.bulk_insert(plans_table, PLAN_ROWS)

    op.add_column("subscriptions", sa.Column("plan_id", postgresql.UUID(as_uuid=False), nullable=True))
    op.create_foreign_key(
        op.f("fk_subscriptions_plan_id_plans"),
        "subscriptions",
        "plans",
        ["plan_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_subscriptions_plan_id"), "subscriptions", ["plan_id"], unique=False)

    op.create_table(
        "payment_orders",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("order_type", payment_order_type, nullable=False),
        sa.Column("status", payment_order_status, server_default="pending", nullable=False),
        sa.Column("amount_minor", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="SAR", nullable=False),
        sa.Column("provider_name", sa.String(length=50), server_default="paymob", nullable=False),
        sa.Column("provider_order_id", sa.String(length=255), nullable=True),
        sa.Column("provider_payment_key", sa.String(length=255), nullable=True),
        sa.Column("provider_transaction_id", sa.String(length=255), nullable=True),
        sa.Column("merchant_reference", sa.String(length=255), nullable=False),
        sa.Column("idempotency_key", sa.String(length=255), nullable=False),
        sa.Column("request_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("response_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expired_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], name=op.f("fk_payment_orders_plan_id_plans")),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["subscriptions.id"],
            ondelete="SET NULL",
            name=op.f("fk_payment_orders_subscription_id_subscriptions"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name=op.f("fk_payment_orders_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_payment_orders")),
        sa.UniqueConstraint("idempotency_key", name=op.f("uq_payment_orders_idempotency_key")),
        sa.UniqueConstraint("merchant_reference", name=op.f("uq_payment_orders_merchant_reference")),
        sa.UniqueConstraint("provider_transaction_id", name=op.f("uq_payment_orders_provider_transaction_id")),
    )
    op.create_index(op.f("ix_payment_orders_order_type"), "payment_orders", ["order_type"], unique=False)
    op.create_index(op.f("ix_payment_orders_plan_id"), "payment_orders", ["plan_id"], unique=False)
    op.create_index(op.f("ix_payment_orders_provider_order_id"), "payment_orders", ["provider_order_id"], unique=False)
    op.create_index(op.f("ix_payment_orders_status"), "payment_orders", ["status"], unique=False)
    op.create_index(op.f("ix_payment_orders_subscription_id"), "payment_orders", ["subscription_id"], unique=False)
    op.create_index(op.f("ix_payment_orders_user_id"), "payment_orders", ["user_id"], unique=False)

    op.create_table(
        "payment_webhook_events",
        sa.Column("payment_order_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("provider_name", sa.String(length=50), server_default="paymob", nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("provider_event_id", sa.String(length=255), nullable=True),
        sa.Column("provider_order_id", sa.String(length=255), nullable=True),
        sa.Column("provider_transaction_id", sa.String(length=255), nullable=True),
        sa.Column("status", payment_webhook_event_status, server_default="received", nullable=False),
        sa.Column("signature_valid", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("retry_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("event_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("processing_error", sa.Text(), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["payment_order_id"],
            ["payment_orders.id"],
            ondelete="SET NULL",
            name=op.f("fk_payment_webhook_events_payment_order_id_payment_orders"),
        ),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["subscriptions.id"],
            ondelete="SET NULL",
            name=op.f("fk_payment_webhook_events_subscription_id_subscriptions"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="SET NULL",
            name=op.f("fk_payment_webhook_events_user_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_payment_webhook_events")),
        sa.UniqueConstraint("provider_event_id", name=op.f("uq_payment_webhook_events_provider_event_id")),
    )
    op.create_index(op.f("ix_payment_webhook_events_event_type"), "payment_webhook_events", ["event_type"], unique=False)
    op.create_index(
        op.f("ix_payment_webhook_events_payment_order_id"),
        "payment_webhook_events",
        ["payment_order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_payment_webhook_events_provider_order_id"),
        "payment_webhook_events",
        ["provider_order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_payment_webhook_events_provider_transaction_id"),
        "payment_webhook_events",
        ["provider_transaction_id"],
        unique=False,
    )
    op.create_index(op.f("ix_payment_webhook_events_received_at"), "payment_webhook_events", ["received_at"], unique=False)
    op.create_index(op.f("ix_payment_webhook_events_status"), "payment_webhook_events", ["status"], unique=False)
    op.create_index(op.f("ix_payment_webhook_events_subscription_id"), "payment_webhook_events", ["subscription_id"], unique=False)
    op.create_index(op.f("ix_payment_webhook_events_user_id"), "payment_webhook_events", ["user_id"], unique=False)

    op.create_table(
        "user_wallets",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("balance_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column("lifetime_earned_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column("lifetime_spent_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name=op.f("fk_user_wallets_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_wallets")),
        sa.UniqueConstraint("user_id", name=op.f("uq_user_wallets_user_id")),
    )
    op.create_index(op.f("ix_user_wallets_user_id"), "user_wallets", ["user_id"], unique=False)

    op.create_table(
        "wallet_transactions",
        sa.Column("wallet_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("payment_order_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("transaction_type", wallet_transaction_type, nullable=False),
        sa.Column("status", wallet_transaction_status, server_default="posted", nullable=False),
        sa.Column("direction", wallet_transaction_direction, nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("balance_before", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_ref", sa.String(length=255), nullable=True),
        sa.Column("event_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("effective_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["payment_order_id"],
            ["payment_orders.id"],
            ondelete="SET NULL",
            name=op.f("fk_wallet_transactions_payment_order_id_payment_orders"),
        ),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["subscriptions.id"],
            ondelete="SET NULL",
            name=op.f("fk_wallet_transactions_subscription_id_subscriptions"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name=op.f("fk_wallet_transactions_user_id_users")),
        sa.ForeignKeyConstraint(
            ["wallet_id"], ["user_wallets.id"], ondelete="CASCADE", name=op.f("fk_wallet_transactions_wallet_id_user_wallets")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_wallet_transactions")),
    )
    op.create_index(op.f("ix_wallet_transactions_effective_at"), "wallet_transactions", ["effective_at"], unique=False)
    op.create_index(op.f("ix_wallet_transactions_payment_order_id"), "wallet_transactions", ["payment_order_id"], unique=False)
    op.create_index(op.f("ix_wallet_transactions_status"), "wallet_transactions", ["status"], unique=False)
    op.create_index(op.f("ix_wallet_transactions_subscription_id"), "wallet_transactions", ["subscription_id"], unique=False)
    op.create_index(op.f("ix_wallet_transactions_transaction_type"), "wallet_transactions", ["transaction_type"], unique=False)
    op.create_index(op.f("ix_wallet_transactions_user_id"), "wallet_transactions", ["user_id"], unique=False)
    op.create_index(op.f("ix_wallet_transactions_wallet_id"), "wallet_transactions", ["wallet_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_wallet_transactions_wallet_id"), table_name="wallet_transactions")
    op.drop_index(op.f("ix_wallet_transactions_user_id"), table_name="wallet_transactions")
    op.drop_index(op.f("ix_wallet_transactions_transaction_type"), table_name="wallet_transactions")
    op.drop_index(op.f("ix_wallet_transactions_subscription_id"), table_name="wallet_transactions")
    op.drop_index(op.f("ix_wallet_transactions_status"), table_name="wallet_transactions")
    op.drop_index(op.f("ix_wallet_transactions_payment_order_id"), table_name="wallet_transactions")
    op.drop_index(op.f("ix_wallet_transactions_effective_at"), table_name="wallet_transactions")
    op.drop_table("wallet_transactions")

    op.drop_index(op.f("ix_user_wallets_user_id"), table_name="user_wallets")
    op.drop_table("user_wallets")

    op.drop_index(op.f("ix_payment_webhook_events_user_id"), table_name="payment_webhook_events")
    op.drop_index(op.f("ix_payment_webhook_events_subscription_id"), table_name="payment_webhook_events")
    op.drop_index(op.f("ix_payment_webhook_events_status"), table_name="payment_webhook_events")
    op.drop_index(op.f("ix_payment_webhook_events_received_at"), table_name="payment_webhook_events")
    op.drop_index(op.f("ix_payment_webhook_events_provider_transaction_id"), table_name="payment_webhook_events")
    op.drop_index(op.f("ix_payment_webhook_events_provider_order_id"), table_name="payment_webhook_events")
    op.drop_index(op.f("ix_payment_webhook_events_payment_order_id"), table_name="payment_webhook_events")
    op.drop_index(op.f("ix_payment_webhook_events_event_type"), table_name="payment_webhook_events")
    op.drop_table("payment_webhook_events")

    op.drop_index(op.f("ix_payment_orders_user_id"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_subscription_id"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_status"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_provider_order_id"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_plan_id"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_order_type"), table_name="payment_orders")
    op.drop_table("payment_orders")

    op.drop_index(op.f("ix_subscriptions_plan_id"), table_name="subscriptions")
    op.drop_constraint(op.f("fk_subscriptions_plan_id_plans"), "subscriptions", type_="foreignkey")
    op.drop_column("subscriptions", "plan_id")

    op.drop_index(op.f("ix_plans_kind"), table_name="plans")
    op.drop_index(op.f("ix_plans_code"), table_name="plans")
    op.drop_index(op.f("ix_plans_audience"), table_name="plans")
    op.drop_table("plans")

    bind = op.get_bind()
    wallet_transaction_direction.drop(bind, checkfirst=True)
    wallet_transaction_status.drop(bind, checkfirst=True)
    wallet_transaction_type.drop(bind, checkfirst=True)
    payment_webhook_event_status.drop(bind, checkfirst=True)
    payment_order_status.drop(bind, checkfirst=True)
    payment_order_type.drop(bind, checkfirst=True)
    billing_interval.drop(bind, checkfirst=True)
    plan_kind.drop(bind, checkfirst=True)
    plan_audience.drop(bind, checkfirst=True)
