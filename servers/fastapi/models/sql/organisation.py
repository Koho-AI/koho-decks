from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class OrganisationModel(SQLModel, table=True):
    """
    Tenant. Koho Decks is single-tenant from a user perspective — the
    Koho org is seeded on first boot — but the schema supports multiple
    orgs so later tenants (if any) don't require a migration.
    """

    __tablename__ = "organisations"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    slug: str = Field(sa_column=Column(String, nullable=False, unique=True, index=True))
    name: str = Field(sa_column=Column(String, nullable=False))
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
