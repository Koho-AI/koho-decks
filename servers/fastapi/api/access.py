"""
Deck-access helpers shared across routers (Phase 4e).

`check_deck_access` centralises the rule:
- Owner of the deck → full access.
- Collaborator with role=editor → read + write.
- Collaborator with role=viewer → read only.
- Otherwise → 404 (don't leak deck existence).
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth_context import AuthContext
from models.sql.deck_collaborator import (
    DeckCollaboratorModel,
    ROLE_EDITOR,
    ROLE_VIEWER,
)
from models.sql.presentation import PresentationModel


class DeckRole(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
    NONE = "none"


@dataclass
class DeckAccess:
    deck: PresentationModel
    role: DeckRole

    @property
    def can_write(self) -> bool:
        return self.role in (DeckRole.OWNER, DeckRole.EDITOR)

    @property
    def can_read(self) -> bool:
        return self.role != DeckRole.NONE


async def resolve_deck_access(
    presentation_id: uuid.UUID,
    session: AsyncSession,
    ctx: AuthContext,
) -> Optional[DeckAccess]:
    """Look up the deck + caller's role. Returns None if the deck does
    not exist at all."""
    deck = await session.get(PresentationModel, presentation_id)
    if deck is None:
        return None

    # Legacy org-less decks are treated as belonging to the caller's
    # current org (matches the /presentation/all behaviour).
    if (
        deck.organisation_id is not None
        and deck.organisation_id != ctx.organisation_id
    ):
        return DeckAccess(deck=deck, role=DeckRole.NONE)

    # Owner?
    if deck.owner_user_id is not None and deck.owner_user_id == ctx.user_id:
        return DeckAccess(deck=deck, role=DeckRole.OWNER)
    # Legacy (no owner set) — treat as owner if we're in the same org.
    if deck.owner_user_id is None:
        return DeckAccess(deck=deck, role=DeckRole.OWNER)

    # Collaborator?
    collab = (
        await session.execute(
            select(DeckCollaboratorModel).where(
                DeckCollaboratorModel.presentation_id == presentation_id,
                DeckCollaboratorModel.user_id == ctx.user_id,
            )
        )
    ).scalar_one_or_none()
    if collab is not None:
        if collab.role == ROLE_EDITOR:
            return DeckAccess(deck=deck, role=DeckRole.EDITOR)
        if collab.role == ROLE_VIEWER:
            return DeckAccess(deck=deck, role=DeckRole.VIEWER)

    return DeckAccess(deck=deck, role=DeckRole.NONE)


async def check_deck_access(
    presentation_id: uuid.UUID,
    session: AsyncSession,
    ctx: AuthContext,
    *,
    write: bool = False,
) -> DeckAccess:
    """Raise 404 / 403 as appropriate, else return the access record."""
    access = await resolve_deck_access(presentation_id, session, ctx)
    if access is None or access.role == DeckRole.NONE:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Presentation not found")
    if write and not access.can_write:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Viewers cannot modify this deck"
        )
    return access
