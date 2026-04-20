from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class ShareViewerModel(SQLModel, table=True):
    """
    A specific email that has been (or is being) verified against an
    `email_otp`-gated share link. Unique on (share_link_id, email) so
    repeated requests update the row instead of stacking duplicates.

    `verified_at` flips when the viewer enters a valid OTP. After that
    the public viewer page sets a signed `view_session` cookie and
    skips the gate on subsequent loads.
    """

    __tablename__ = "share_viewers"
    __table_args__ = (
        UniqueConstraint(
            "share_link_id", "email", name="uq_share_viewer_link_email"
        ),
    )

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    share_link_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("share_links.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    email: str = Field(sa_column=Column(String, nullable=False, index=True))
    verified_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
