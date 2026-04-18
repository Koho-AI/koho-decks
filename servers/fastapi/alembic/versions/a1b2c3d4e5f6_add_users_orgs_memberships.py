"""Phase 3 — add users, organisations, memberships + presentation FKs

Revision ID: a1b2c3d4e5f6
Revises: f42ad4074449
Create Date: 2026-04-18 11:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel  # noqa: F401


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f42ad4074449"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("google_sub", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)

    # organisations
    op.create_table(
        "organisations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_organisations_slug", "organisations", ["slug"], unique=True)

    # memberships
    op.create_table(
        "memberships",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("organisation_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="member"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["organisation_id"], ["organisations.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "organisation_id", name="uq_membership_user_org"),
    )
    op.create_index("ix_memberships_user_id", "memberships", ["user_id"])
    op.create_index(
        "ix_memberships_organisation_id", "memberships", ["organisation_id"]
    )

    # presentations: ownership + tenancy FKs (nullable for legacy rows)
    op.add_column(
        "presentations", sa.Column("owner_user_id", sa.Uuid(), nullable=True)
    )
    op.add_column(
        "presentations", sa.Column("organisation_id", sa.Uuid(), nullable=True)
    )
    op.create_foreign_key(
        "fk_presentations_owner_user_id",
        "presentations",
        "users",
        ["owner_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_presentations_organisation_id",
        "presentations",
        "organisations",
        ["organisation_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_presentations_owner_user_id", "presentations", ["owner_user_id"]
    )
    op.create_index(
        "ix_presentations_organisation_id", "presentations", ["organisation_id"]
    )

    # Seed the singleton Koho organisation so Phase 3c can always look it up.
    op.execute(
        """
        INSERT INTO organisations (id, slug, name, created_at)
        VALUES (gen_random_uuid(), 'koho', 'Koho', now())
        ON CONFLICT (slug) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.drop_index("ix_presentations_organisation_id", table_name="presentations")
    op.drop_index("ix_presentations_owner_user_id", table_name="presentations")
    op.drop_constraint(
        "fk_presentations_organisation_id", "presentations", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_presentations_owner_user_id", "presentations", type_="foreignkey"
    )
    op.drop_column("presentations", "organisation_id")
    op.drop_column("presentations", "owner_user_id")

    op.drop_index("ix_memberships_organisation_id", table_name="memberships")
    op.drop_index("ix_memberships_user_id", table_name="memberships")
    op.drop_table("memberships")

    op.drop_index("ix_organisations_slug", table_name="organisations")
    op.drop_table("organisations")

    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
