"""Phase 5 — share_links, share_viewers, share_views, otp_challenges

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-20 09:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel  # noqa: F401


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "share_links",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("presentation_id", sa.Uuid(), nullable=False),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("gate_mode", sa.String(), nullable=False, server_default="open"),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["presentation_id"], ["presentations.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_share_links_token", "share_links", ["token"], unique=True)
    op.create_index(
        "ix_share_links_presentation_id", "share_links", ["presentation_id"]
    )

    op.create_table(
        "share_viewers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("share_link_id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["share_link_id"], ["share_links.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "share_link_id", "email", name="uq_share_viewer_link_email"
        ),
    )
    op.create_index("ix_share_viewers_share_link_id", "share_viewers", ["share_link_id"])
    op.create_index("ix_share_viewers_email", "share_viewers", ["email"])

    op.create_table(
        "share_views",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("share_link_id", sa.Uuid(), nullable=False),
        sa.Column("viewer_email", sa.String(), nullable=True),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_hash", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["share_link_id"], ["share_links.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_share_views_share_link_id", "share_views", ["share_link_id"])
    op.create_index("ix_share_views_viewer_email", "share_views", ["viewer_email"])

    op.create_table(
        "otp_challenges",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("share_viewer_id", sa.Uuid(), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["share_viewer_id"], ["share_viewers.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_otp_challenges_share_viewer_id", "otp_challenges", ["share_viewer_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_otp_challenges_share_viewer_id", table_name="otp_challenges")
    op.drop_table("otp_challenges")
    op.drop_index("ix_share_views_viewer_email", table_name="share_views")
    op.drop_index("ix_share_views_share_link_id", table_name="share_views")
    op.drop_table("share_views")
    op.drop_index("ix_share_viewers_email", table_name="share_viewers")
    op.drop_index("ix_share_viewers_share_link_id", table_name="share_viewers")
    op.drop_table("share_viewers")
    op.drop_index("ix_share_links_presentation_id", table_name="share_links")
    op.drop_index("ix_share_links_token", table_name="share_links")
    op.drop_table("share_links")
