from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class InvitationModel(SQLModel, table=True):
    """
    Pending invitation for a user who is not yet provisioned.

    On first Google SSO sign-in that matches `email`, the invitation is
    resolved — a DeckCollaborator row is created and `accepted_at` is
    stamped. Unaccepted invitations expire after `expires_at` (default
    14 days).

    Unique on (presentation_id, email) so repeated invites update the
    existing row rather than pile up duplicates.
    """

    __tablename__ = "invitations"
    __table_args__ = (
        UniqueConstraint(
            "presentation_id", "email", name="uq_invitation_presentation_email"
        ),
    )

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    presentation_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("presentations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    email: str = Field(sa_column=Column(String, nullable=False, index=True))
    role: str = Field(sa_column=Column(String, nullable=False, default="viewer"))
    token: str = Field(sa_column=Column(String, nullable=False, unique=True))
    invited_by_user_id: Optional[uuid.UUID] = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
        default=None,
    )
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    accepted_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
