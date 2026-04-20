from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class OtpChallengeModel(SQLModel, table=True):
    """
    A short-lived 6-digit OTP for an email-gated share link viewer.

    `code_hash` is bcrypt of the code (never store the plaintext).
    `attempts` increments on every failed verify; we lock the
    challenge at 5 attempts to stop brute force. On success the row
    is consumed (used_at set) and the parent ShareViewer is marked
    verified.
    """

    __tablename__ = "otp_challenges"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    share_viewer_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("share_viewers.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    code_hash: str = Field(sa_column=Column(String, nullable=False))
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    attempts: int = Field(sa_column=Column(Integer, nullable=False, default=0))
    used_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True), default=None
    )
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
