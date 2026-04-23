"""Phase 7 — oauth_clients, oauth_authorization_codes, oauth_refresh_tokens, oauth_consents

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-22 22:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel  # noqa: F401


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "oauth_clients",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.String(), nullable=False),
        sa.Column("client_name", sa.String(), nullable=False),
        sa.Column("redirect_uris", sa.JSON(), nullable=False),
        sa.Column("token_endpoint_auth_method", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("client_id", name="uq_oauth_clients_client_id"),
    )
    op.create_index(
        "ix_oauth_clients_client_id", "oauth_clients", ["client_id"], unique=True
    )

    op.create_table(
        "oauth_authorization_codes",
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("redirect_uri", sa.String(), nullable=False),
        sa.Column("code_challenge", sa.String(), nullable=False),
        sa.Column("code_challenge_method", sa.String(), nullable=False),
        sa.Column("scope", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["client_id"], ["oauth_clients.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("code"),
    )
    op.create_index(
        "ix_oauth_authorization_codes_client_id",
        "oauth_authorization_codes",
        ["client_id"],
    )
    op.create_index(
        "ix_oauth_authorization_codes_user_id",
        "oauth_authorization_codes",
        ["user_id"],
    )

    op.create_table(
        "oauth_refresh_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("scope", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["client_id"], ["oauth_clients.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "token_hash", name="uq_oauth_refresh_tokens_token_hash"
        ),
    )
    op.create_index(
        "ix_oauth_refresh_tokens_client_id",
        "oauth_refresh_tokens",
        ["client_id"],
    )
    op.create_index(
        "ix_oauth_refresh_tokens_user_id", "oauth_refresh_tokens", ["user_id"]
    )
    op.create_index(
        "ix_oauth_refresh_tokens_token_hash",
        "oauth_refresh_tokens",
        ["token_hash"],
        unique=True,
    )

    op.create_table(
        "oauth_consents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("scope", sa.String(), nullable=False),
        sa.Column("granted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["client_id"], ["oauth_clients.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "client_id", name="uq_oauth_consents_user_client"
        ),
    )
    op.create_index("ix_oauth_consents_user_id", "oauth_consents", ["user_id"])
    op.create_index(
        "ix_oauth_consents_client_id", "oauth_consents", ["client_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_oauth_consents_client_id", table_name="oauth_consents")
    op.drop_index("ix_oauth_consents_user_id", table_name="oauth_consents")
    op.drop_table("oauth_consents")

    op.drop_index(
        "ix_oauth_refresh_tokens_token_hash", table_name="oauth_refresh_tokens"
    )
    op.drop_index(
        "ix_oauth_refresh_tokens_user_id", table_name="oauth_refresh_tokens"
    )
    op.drop_index(
        "ix_oauth_refresh_tokens_client_id", table_name="oauth_refresh_tokens"
    )
    op.drop_table("oauth_refresh_tokens")

    op.drop_index(
        "ix_oauth_authorization_codes_user_id",
        table_name="oauth_authorization_codes",
    )
    op.drop_index(
        "ix_oauth_authorization_codes_client_id",
        table_name="oauth_authorization_codes",
    )
    op.drop_table("oauth_authorization_codes")

    op.drop_index("ix_oauth_clients_client_id", table_name="oauth_clients")
    op.drop_table("oauth_clients")
