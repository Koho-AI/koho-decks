from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class OAuthConsentModel(SQLModel, table=True):
    """
    A (user, client) record of "I've approved this MCP client to act
    as me". Lets us skip the consent screen on subsequent authorize
    requests — important for UX when refresh tokens expire and the
    client silently re-runs the authorization code flow.

    Revocation: when the user revokes a client from the /settings/oauth-clients
    page, we set `revoked_at` here AND revoke all outstanding refresh
    tokens for the same (user, client). Subsequent authorize requests
    from that client will land back on the consent screen.

    Uniqueness: at most one active consent per (user, client). On
    re-consent (e.g. scope upgrade later), revoke the old row and
    insert a new one.
    """

    __tablename__ = "oauth_consents"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "client_id", name="uq_oauth_consents_user_client"
        ),
    )

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    user_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    client_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("oauth_clients.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    scope: str = Field(sa_column=Column(String, nullable=False, default=""))
    granted_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
    revoked_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
