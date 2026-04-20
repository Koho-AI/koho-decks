from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class ShareViewModel(SQLModel, table=True):
    """
    A single load of /view/{token}. Logged on every render of the
    public viewer page so the deck owner can see view counts and
    recent activity.

    `viewer_email` is set when the link was email-gated (we already
    know who's looking); for open links it's NULL and we deduplicate
    by `ip_hash` per day for unique-viewer counts.

    `ip_hash` is SHA-256(salt + ip) — never store raw IPs.
    """

    __tablename__ = "share_views"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    share_link_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("share_links.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    viewer_email: Optional[str] = Field(
        sa_column=Column(String, nullable=True, index=True), default=None
    )
    viewed_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
    ip_hash: Optional[str] = Field(
        sa_column=Column(String, nullable=True), default=None
    )
    user_agent: Optional[str] = Field(
        sa_column=Column(String, nullable=True), default=None
    )
