from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


# Role values. Kept as string enum for simplicity and easy future extension.
ROLE_OWNER = "owner"
ROLE_ADMIN = "admin"
ROLE_MEMBER = "member"


class MembershipModel(SQLModel, table=True):
    """
    Links a User to an Organisation with a role.

    Unique on (user_id, organisation_id) — one role per org per user.
    Deletion cascades from either side so we don't leave dangling rows.
    """

    __tablename__ = "memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "organisation_id", name="uq_membership_user_org"),
    )

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    user_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
        )
    )
    organisation_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("organisations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    role: str = Field(sa_column=Column(String, nullable=False, default=ROLE_MEMBER))
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
