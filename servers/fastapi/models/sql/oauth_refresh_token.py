from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


# Refresh tokens live long — the MCP client rotates them silently, so
# a 30-day TTL is effectively "until revoked."
REFRESH_TOKEN_TTL_DAYS = 30


class OAuthRefreshTokenModel(SQLModel, table=True):
    """
    Long-lived opaque refresh token. Only the SHA-256 hash is persisted;
    the raw value is returned to the client exactly once at issuance
    (inside the /oauth/token response body).

    Rotation on use: each refresh exchange revokes the old row and
    inserts a new one, so a leaked refresh token is usable at most
    once before legitimate rotation invalidates it. Detected reuse
    (presenting a revoked-but-still-within-TTL token) is a signal
    worth logging loudly — likely exfiltration.
    """

    __tablename__ = "oauth_refresh_tokens"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    token_hash: str = Field(
        sa_column=Column(String, nullable=False, unique=True, index=True)
    )
    client_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("oauth_clients.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    scope: str = Field(sa_column=Column(String, nullable=False, default=""))
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    revoked_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
