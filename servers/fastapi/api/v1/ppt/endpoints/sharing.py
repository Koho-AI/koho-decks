"""
Phase 4 — internal team sharing API.

Endpoints let a deck owner (or org admin) invite teammates by email:
- If the email belongs to an existing user, a DeckCollaborator row is
  created immediately.
- If the email is @koho.ai but not yet provisioned, an Invitation row
  is created and resolved on the user's first sign-in (see
  resolve_pending_invitations in api/middlewares.py).

All endpoints require a signed-in caller (router-level dependency);
invite/revoke additionally require the caller to be the deck owner.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List, Optional
import secrets
import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.access import DeckRole, resolve_deck_access
from api.auth_context import AuthContext
from api.deps import get_current_user_strict
from models.sql.deck_collaborator import (
    DeckCollaboratorModel,
    ROLE_EDITOR,
    ROLE_VIEWER,
)
from models.sql.invitation import InvitationModel
from models.sql.presentation import PresentationModel
from models.sql.user import UserModel
from services.database import get_async_session
from services.email import invitation_email, send_email


SHARING_ROUTER = APIRouter(
    prefix="/sharing",
    tags=["Sharing"],
    dependencies=[Depends(get_current_user_strict)],
)

INVITATION_TTL = timedelta(days=14)
KOHO_DOMAIN = "koho.ai"


# ─── Schemas ─────────────────────────────────────────────────────────────────


class InviteRequest(BaseModel):
    presentation_id: uuid.UUID
    email: EmailStr
    role: str = Field(default=ROLE_VIEWER, pattern="^(viewer|editor)$")


class CollaboratorResponse(BaseModel):
    id: uuid.UUID
    kind: str  # "collaborator" | "invitation"
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    invited_at: datetime
    # For pending invitations only:
    accepted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class CollaboratorListResponse(BaseModel):
    presentation_id: uuid.UUID
    owner_email: Optional[str]
    collaborators: List[CollaboratorResponse]


# ─── Helpers ─────────────────────────────────────────────────────────────────


async def _get_deck_and_require_owner(
    presentation_id: uuid.UUID,
    session: AsyncSession,
    ctx: AuthContext,
) -> PresentationModel:
    deck = await session.get(PresentationModel, presentation_id)
    if not deck:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Presentation not found")
    # Only the owner (or legacy owner-less decks in the caller's org)
    # may manage collaborators.
    if deck.owner_user_id is not None and deck.owner_user_id != ctx.user_id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Only the deck owner can manage sharing"
        )
    if (
        deck.organisation_id is not None
        and deck.organisation_id != ctx.organisation_id
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Presentation not found")
    return deck


# ─── Endpoints ───────────────────────────────────────────────────────────────


@SHARING_ROUTER.post(
    "/invite", response_model=CollaboratorResponse, status_code=status.HTTP_201_CREATED
)
async def invite_collaborator(
    payload: InviteRequest,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> CollaboratorResponse:
    deck = await _get_deck_and_require_owner(
        payload.presentation_id, sql_session, ctx
    )

    email = payload.email.lower().strip()

    # Enforce @koho.ai for internal sharing (Phase 4). Non-koho emails
    # will go through public share links in Phase 5.
    domain = email.split("@")[1] if "@" in email else ""
    if domain != KOHO_DOMAIN:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Internal sharing is limited to @{KOHO_DOMAIN} addresses. "
            "Use a public share link for external viewers.",
        )

    if email == ctx.email:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "You already have access to this deck"
        )

    # Is the invitee already a user?
    existing_user = (
        await sql_session.execute(select(UserModel).where(UserModel.email == email))
    ).scalar_one_or_none()

    if existing_user is not None:
        # Direct collaboration — upsert.
        existing_collab = (
            await sql_session.execute(
                select(DeckCollaboratorModel).where(
                    DeckCollaboratorModel.presentation_id == deck.id,
                    DeckCollaboratorModel.user_id == existing_user.id,
                )
            )
        ).scalar_one_or_none()
        if existing_collab is not None:
            existing_collab.role = payload.role
            collab = existing_collab
        else:
            collab = DeckCollaboratorModel(
                presentation_id=deck.id,
                user_id=existing_user.id,
                role=payload.role,
                invited_by_user_id=ctx.user_id,
            )
            sql_session.add(collab)
        await sql_session.commit()
        await sql_session.refresh(collab)
        await send_email(
            **invitation_email(
                to_email=existing_user.email,
                deck_title=deck.title,
                inviter_name=ctx.name,
                inviter_email=ctx.email,
                role=collab.role,
                presentation_id=str(deck.id),
            )
        )
        return CollaboratorResponse(
            id=collab.id,
            kind="collaborator",
            email=existing_user.email,
            name=existing_user.name,
            avatar_url=existing_user.avatar_url,
            role=collab.role,
            invited_at=collab.created_at,
        )

    # Unprovisioned — upsert pending Invitation.
    existing_invite = (
        await sql_session.execute(
            select(InvitationModel).where(
                InvitationModel.presentation_id == deck.id,
                InvitationModel.email == email,
            )
        )
    ).scalar_one_or_none()
    expires_at = datetime.now(timezone.utc) + INVITATION_TTL
    if existing_invite is not None:
        existing_invite.role = payload.role
        existing_invite.invited_by_user_id = ctx.user_id
        existing_invite.expires_at = expires_at
        existing_invite.accepted_at = None
        invite = existing_invite
    else:
        invite = InvitationModel(
            presentation_id=deck.id,
            email=email,
            role=payload.role,
            token=secrets.token_urlsafe(24),
            invited_by_user_id=ctx.user_id,
            expires_at=expires_at,
        )
        sql_session.add(invite)
    await sql_session.commit()
    await sql_session.refresh(invite)

    # Best-effort email notification — if SMTP isn't configured, the
    # row still persists and the collaborator list still shows the
    # pending invite, so this can't block the invite flow.
    await send_email(
        **invitation_email(
            to_email=invite.email,
            deck_title=deck.title,
            inviter_name=ctx.name,
            inviter_email=ctx.email,
            role=invite.role,
            presentation_id=str(deck.id),
        )
    )

    return CollaboratorResponse(
        id=invite.id,
        kind="invitation",
        email=invite.email,
        role=invite.role,
        invited_at=invite.created_at,
        expires_at=invite.expires_at,
    )


@SHARING_ROUTER.get(
    "/collaborators/{presentation_id}",
    response_model=CollaboratorListResponse,
)
async def list_collaborators(
    presentation_id: uuid.UUID,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> CollaboratorListResponse:
    deck = await sql_session.get(PresentationModel, presentation_id)
    if not deck:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Presentation not found")
    if (
        deck.organisation_id is not None
        and deck.organisation_id != ctx.organisation_id
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Presentation not found")

    owner_email: Optional[str] = None
    if deck.owner_user_id is not None:
        owner_user = await sql_session.get(UserModel, deck.owner_user_id)
        if owner_user is not None:
            owner_email = owner_user.email

    collaborators: List[CollaboratorResponse] = []

    # Existing collaborators
    collab_rows = (
        await sql_session.execute(
            select(DeckCollaboratorModel, UserModel)
            .join(UserModel, UserModel.id == DeckCollaboratorModel.user_id)
            .where(DeckCollaboratorModel.presentation_id == presentation_id)
            .order_by(DeckCollaboratorModel.created_at)
        )
    ).all()
    for collab, user in collab_rows:
        collaborators.append(
            CollaboratorResponse(
                id=collab.id,
                kind="collaborator",
                email=user.email,
                name=user.name,
                avatar_url=user.avatar_url,
                role=collab.role,
                invited_at=collab.created_at,
            )
        )

    # Pending invitations
    invite_rows = (
        await sql_session.execute(
            select(InvitationModel)
            .where(
                InvitationModel.presentation_id == presentation_id,
                InvitationModel.accepted_at.is_(None),
            )
            .order_by(InvitationModel.created_at)
        )
    ).scalars().all()
    for invite in invite_rows:
        collaborators.append(
            CollaboratorResponse(
                id=invite.id,
                kind="invitation",
                email=invite.email,
                role=invite.role,
                invited_at=invite.created_at,
                expires_at=invite.expires_at,
            )
        )

    return CollaboratorListResponse(
        presentation_id=presentation_id,
        owner_email=owner_email,
        collaborators=collaborators,
    )


@SHARING_ROUTER.delete(
    "/collaborator/{collaborator_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def revoke_collaborator(
    collaborator_id: uuid.UUID,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
):
    collab = await sql_session.get(DeckCollaboratorModel, collaborator_id)
    if not collab:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Collaborator not found")
    await _get_deck_and_require_owner(collab.presentation_id, sql_session, ctx)
    await sql_session.delete(collab)
    await sql_session.commit()


@SHARING_ROUTER.delete(
    "/invitation/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def revoke_invitation(
    invitation_id: uuid.UUID,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
):
    invite = await sql_session.get(InvitationModel, invitation_id)
    if not invite:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invitation not found")
    await _get_deck_and_require_owner(invite.presentation_id, sql_session, ctx)
    await sql_session.delete(invite)
    await sql_session.commit()


# ─── Shared-with-me dashboard feed ───────────────────────────────────────────


class SharedDeckSummary(BaseModel):
    presentation_id: uuid.UUID
    title: Optional[str]
    role: str
    owner_email: Optional[str]
    shared_at: datetime


class MyRoleResponse(BaseModel):
    presentation_id: uuid.UUID
    role: str  # "owner" | "editor" | "viewer" | "none"


@SHARING_ROUTER.get(
    "/my-role/{presentation_id}", response_model=MyRoleResponse
)
async def my_role(
    presentation_id: uuid.UUID,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> MyRoleResponse:
    access = await resolve_deck_access(presentation_id, sql_session, ctx)
    role = access.role.value if access else DeckRole.NONE.value
    return MyRoleResponse(presentation_id=presentation_id, role=role)


@SHARING_ROUTER.get("/shared-with-me", response_model=List[SharedDeckSummary])
async def shared_with_me(
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> List[SharedDeckSummary]:
    rows = (
        await sql_session.execute(
            select(DeckCollaboratorModel, PresentationModel, UserModel)
            .join(
                PresentationModel,
                PresentationModel.id == DeckCollaboratorModel.presentation_id,
            )
            .outerjoin(UserModel, UserModel.id == PresentationModel.owner_user_id)
            .where(DeckCollaboratorModel.user_id == ctx.user_id)
            .order_by(DeckCollaboratorModel.created_at.desc())
        )
    ).all()

    return [
        SharedDeckSummary(
            presentation_id=deck.id,
            title=deck.title,
            role=collab.role,
            owner_email=owner.email if owner else None,
            shared_at=collab.created_at,
        )
        for collab, deck, owner in rows
    ]
