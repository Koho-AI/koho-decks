from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


# Gate modes:
GATE_OPEN = "open"             # anyone with the link
GATE_EMAIL_OTP = "email_otp"   # email gate, OTP verification required


class ShareLinkModel(SQLModel, table=True):
    """
    A public link to view a presentation. Created by the deck owner.

    The token is the URL-safe identifier embedded in /view/{token}.
    `gate_mode` toggles between anyone-with-the-link and email-gated
    OTP verification. Revoked / expired links are kept (soft delete)
    so we can show "this link was used N times" in analytics.
    """

    __tablename__ = "share_links"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    presentation_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("presentations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    token: str = Field(
        sa_column=Column(String, nullable=False, unique=True, index=True)
    )
    gate_mode: str = Field(
        sa_column=Column(String, nullable=False, default=GATE_OPEN)
    )
    created_by_user_id: Optional[uuid.UUID] = Field(
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
    expires_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
    revoked_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
