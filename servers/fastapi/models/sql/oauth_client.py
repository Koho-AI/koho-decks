from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import JSON, Column, DateTime, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


# Display prefix on the raw client_id, same greppability rationale as PATs.
CLIENT_ID_PREFIX = "kohoc_"

# Only public clients (PKCE without a client secret) are supported today.
# MCP clients are always native/browser-installed — they can't protect a
# shared secret. RFC 7591 terminology for this is token_endpoint_auth_method="none".
TOKEN_ENDPOINT_AUTH_METHOD_NONE = "none"


class OAuthClientModel(SQLModel, table=True):
    """
    A registered OAuth 2.1 client.

    Clients self-register via RFC 7591 Dynamic Client Registration at
    POST /oauth/register. Registration is auto-approved — a client is
    just a record of (client_id, human label, allowed redirect URIs).
    Trust is not placed in the client itself; it comes from the user's
    consent grant at authorize time (see OAuthConsentModel).

    Cascade: if a user's consent is revoked and all their refresh tokens
    for this client are deleted, the client row may still exist and can
    be reused. Orphan clients (no active refresh tokens or consents)
    are harmless — a future janitor can prune them.
    """

    __tablename__ = "oauth_clients"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    # Publicly visible identifier, passed in authorize / token requests.
    client_id: str = Field(
        sa_column=Column(String, nullable=False, unique=True, index=True)
    )
    # Human-readable label from the DCR request (e.g. "Claude Code").
    client_name: str = Field(sa_column=Column(String, nullable=False))
    # Array of allowed redirect URIs. Validated on register + matched
    # exactly on each authorize request (no partial matching).
    redirect_uris: list[str] = Field(
        sa_column=Column(JSON, nullable=False), default_factory=list
    )
    token_endpoint_auth_method: str = Field(
        sa_column=Column(
            String, nullable=False, default=TOKEN_ENDPOINT_AUTH_METHOD_NONE
        )
    )
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
    last_used_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
