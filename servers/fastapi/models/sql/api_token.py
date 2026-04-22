from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


# Human-visible prefix for every raw PAT. Makes leaked tokens greppable in
# logs/code/scanners and gives the UI something non-sensitive to display.
TOKEN_RAW_PREFIX = "kohod_"

# How many chars of the raw token (including the TOKEN_RAW_PREFIX) to keep
# around for display purposes. GitHub uses 7-8 hex chars after the prefix;
# we store the whole "kohod_" + first 6 hex so the column shows as
# "kohod_a1b2c3" in the UI.
TOKEN_DISPLAY_PREFIX_LEN = len(TOKEN_RAW_PREFIX) + 6


class ApiTokenModel(SQLModel, table=True):
    """
    Personal access token for programmatic access (primarily MCP).

    Mirrors the owning user's web permissions: whatever they can do
    through the browser, a PAT in their name can do through FastAPI.
    The raw token is shown exactly once at creation; only its SHA-256
    hash is persisted.

    Revocation is soft (revoked_at timestamp) rather than row delete
    so users can audit past tokens and we can keep last_used_at around
    for staleness detection.
    """

    __tablename__ = "api_tokens"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    user_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    name: str = Field(sa_column=Column(String, nullable=False))
    # SHA-256 hex digest of the raw token. Unique + indexed — this is the
    # hot-path lookup on every PAT-authenticated request.
    token_hash: str = Field(
        sa_column=Column(String, nullable=False, unique=True, index=True)
    )
    # Leading characters of the raw token (including the "kohod_" prefix)
    # kept for display and greppability. Never sufficient to authenticate.
    token_prefix: str = Field(sa_column=Column(String, nullable=False))
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
    last_used_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
    revoked_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
