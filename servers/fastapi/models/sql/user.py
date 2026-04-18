from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class UserModel(SQLModel, table=True):
    """
    Authenticated user, provisioned on first Google SSO sign-in.

    Identity comes from Google — `google_sub` is the stable subject
    claim, never reused even if the user's email address changes.
    `email` is indexed for invitation lookups (Phase 4).
    """

    __tablename__ = "users"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    email: str = Field(sa_column=Column(String, nullable=False, unique=True, index=True))
    google_sub: Optional[str] = Field(
        sa_column=Column(String, nullable=True, unique=True, index=True),
        default=None,
    )
    name: Optional[str] = Field(sa_column=Column(String), default=None)
    avatar_url: Optional[str] = Field(sa_column=Column(String), default=None)
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
    last_login_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
