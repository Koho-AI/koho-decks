from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


# Role values. 'editor' can modify the deck; 'viewer' can only view it.
ROLE_EDITOR = "editor"
ROLE_VIEWER = "viewer"


class DeckCollaboratorModel(SQLModel, table=True):
    """
    Grants a User access to a Presentation beyond the owner.

    Unique on (presentation_id, user_id) — one role per user per deck.
    """

    __tablename__ = "deck_collaborators"
    __table_args__ = (
        UniqueConstraint(
            "presentation_id", "user_id", name="uq_collab_presentation_user"
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
    user_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
        )
    )
    role: str = Field(sa_column=Column(String, nullable=False, default=ROLE_VIEWER))
    invited_by_user_id: Optional[uuid.UUID] = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
        default=None,
    )
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
