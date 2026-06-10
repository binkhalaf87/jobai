"""fix marketing_campaigns id columns from varchar to uuid

Revision ID: 0039
Revises: 0038
Create Date: 2026-06-10
"""

from alembic import op

revision = "0039"
down_revision = "0038"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop FK before altering the referenced column
    op.drop_constraint(
        "fk_marketing_campaign_contacts_campaign_id_marketing_campaigns",
        "marketing_campaign_contacts",
        type_="foreignkey",
    )

    op.execute(
        "ALTER TABLE marketing_campaigns ALTER COLUMN id TYPE UUID USING id::UUID"
    )
    op.execute(
        "ALTER TABLE marketing_campaign_contacts ALTER COLUMN id TYPE UUID USING id::UUID"
    )
    op.execute(
        "ALTER TABLE marketing_campaign_contacts ALTER COLUMN campaign_id TYPE UUID USING campaign_id::UUID"
    )

    op.create_foreign_key(
        "fk_marketing_campaign_contacts_campaign_id_marketing_campaigns",
        "marketing_campaign_contacts",
        "marketing_campaigns",
        ["campaign_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_marketing_campaign_contacts_campaign_id_marketing_campaigns",
        "marketing_campaign_contacts",
        type_="foreignkey",
    )
    op.execute(
        "ALTER TABLE marketing_campaigns ALTER COLUMN id TYPE VARCHAR USING id::TEXT"
    )
    op.execute(
        "ALTER TABLE marketing_campaign_contacts ALTER COLUMN id TYPE VARCHAR USING id::TEXT"
    )
    op.execute(
        "ALTER TABLE marketing_campaign_contacts ALTER COLUMN campaign_id TYPE VARCHAR USING campaign_id::TEXT"
    )
    op.create_foreign_key(
        "fk_marketing_campaign_contacts_campaign_id_marketing_campaigns",
        "marketing_campaign_contacts",
        "marketing_campaigns",
        ["campaign_id"],
        ["id"],
        ondelete="CASCADE",
    )
