from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


# PKCE — the spec allows "plain" but we only accept "S256" to avoid the
# downgrade footgun. MCP clients uniformly support S256.
CODE_CHALLENGE_METHOD_S256 = "S256"

# Lifetime for a freshly issued authorization code — short-lived on
# purpose. The spec recommends 60s; 10 min gives comfortable slack for
# slow browsers without widening the attack window materially.
AUTH_CODE_TTL_SECONDS = 600


class OAuthAuthorizationCodeModel(SQLModel, table=True):
    """
    One-time authorization code issued at /oauth/authorize and redeemed
    at /oauth/token within AUTH_CODE_TTL_SECONDS.

    Enforces:
    - single-use (`consumed_at` set on first successful exchange)
    - PKCE S256 code_verifier matches code_challenge
    - redirect_uri matches the one used at authorize
    - expiry
    """

    __tablename__ = "oauth_authorization_codes"

    code: str = Field(sa_column=Column(String, primary_key=True))
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
    redirect_uri: str = Field(sa_column=Column(String, nullable=False))
    code_challenge: str = Field(sa_column=Column(String, nullable=False))
    code_challenge_method: str = Field(
        sa_column=Column(String, nullable=False, default=CODE_CHALLENGE_METHOD_S256)
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
    consumed_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
