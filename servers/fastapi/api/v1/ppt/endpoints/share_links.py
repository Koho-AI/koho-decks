"""
Phase 5 — public share-link CRUD (owner-facing).

Owner-only endpoints to create / list / revoke share links and pull
view analytics. The actual public viewer endpoints live in
api/v1/public/share.py (no auth, served at /api/v1/share/*).
"""

from datetime import datetime, timezone
from typing import List, Optional
import secrets
import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.access import DeckRole, check_deck_access
from api.auth_context import AuthContext
from api.deps import get_current_user_strict
from models.sql.share_link import GATE_EMAIL_OTP, GATE_OPEN, ShareLinkModel
from models.sql.share_view import ShareViewModel
from services.database import get_async_session


SHARE_LINKS_ROUTER = APIRouter(
    prefix="/share-links",
    tags=["ShareLinks"],
    dependencies=[Depends(get_current_user_strict)],
)


# ─── Schemas ─────────────────────────────────────────────────────────────────


class CreateShareLinkRequest(BaseModel):
    presentation_id: uuid.UUID
    gate_mode: str = Field(default=GATE_OPEN, pattern="^(open|email_otp)$")
    expires_in_days: Optional[int] = Field(default=None, ge=1, le=365)


class ShareLinkResponse(BaseModel):
    id: uuid.UUID
    presentation_id: uuid.UUID
    token: str
    gate_mode: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    view_count: int = 0
    unique_viewers: int = 0


class RecentView(BaseModel):
    viewer_email: Optional[str]
    viewed_at: datetime


class ShareLinkAnalytics(BaseModel):
    share_link_id: uuid.UUID
    total_views: int
    unique_viewers: int
    recent_views: List[RecentView]


# ─── Endpoints ───────────────────────────────────────────────────────────────


@SHARE_LINKS_ROUTER.post(
    "", response_model=ShareLinkResponse, status_code=status.HTTP_201_CREATED
)
async def create_share_link(
    payload: CreateShareLinkRequest,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> ShareLinkResponse:
    access = await check_deck_access(
        payload.presentation_id, sql_session, ctx, write=True
    )
    if access.role != DeckRole.OWNER:
        raise HTTPException(
            403, "Only the deck owner can create public share links"
        )

    expires_at: Optional[datetime] = None
    if payload.expires_in_days is not None:
        expires_at = datetime.now(timezone.utc).replace(
            microsecond=0
        ) + _days(payload.expires_in_days)

    link = ShareLinkModel(
        presentation_id=payload.presentation_id,
        token=_make_token(),
        gate_mode=payload.gate_mode,
        created_by_user_id=ctx.user_id,
        expires_at=expires_at,
    )
    sql_session.add(link)
    await sql_session.commit()
    await sql_session.refresh(link)

    return ShareLinkResponse(
        id=link.id,
        presentation_id=link.presentation_id,
        token=link.token,
        gate_mode=link.gate_mode,
        created_at=link.created_at,
        expires_at=link.expires_at,
        revoked_at=link.revoked_at,
        view_count=0,
        unique_viewers=0,
    )


@SHARE_LINKS_ROUTER.get(
    "/{presentation_id}", response_model=List[ShareLinkResponse]
)
async def list_share_links(
    presentation_id: uuid.UUID,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> List[ShareLinkResponse]:
    await check_deck_access(presentation_id, sql_session, ctx)
    links = (
        await sql_session.execute(
            select(ShareLinkModel)
            .where(ShareLinkModel.presentation_id == presentation_id)
            .order_by(ShareLinkModel.created_at.desc())
        )
    ).scalars().all()

    out: List[ShareLinkResponse] = []
    for link in links:
        view_count = (
            await sql_session.scalar(
                select(func.count(ShareViewModel.id)).where(
                    ShareViewModel.share_link_id == link.id
                )
            )
            or 0
        )
        unique_viewers = (
            await sql_session.scalar(
                select(
                    func.count(func.distinct(ShareViewModel.viewer_email))
                ).where(
                    ShareViewModel.share_link_id == link.id,
                    ShareViewModel.viewer_email.is_not(None),
                )
            )
            or 0
        )
        out.append(
            ShareLinkResponse(
                id=link.id,
                presentation_id=link.presentation_id,
                token=link.token,
                gate_mode=link.gate_mode,
                created_at=link.created_at,
                expires_at=link.expires_at,
                revoked_at=link.revoked_at,
                view_count=view_count,
                unique_viewers=unique_viewers,
            )
        )
    return out


@SHARE_LINKS_ROUTER.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_share_link(
    link_id: uuid.UUID,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
):
    link = await sql_session.get(ShareLinkModel, link_id)
    if link is None:
        raise HTTPException(404, "Share link not found")
    access = await check_deck_access(
        link.presentation_id, sql_session, ctx, write=True
    )
    if access.role != DeckRole.OWNER:
        raise HTTPException(403, "Only the deck owner can revoke share links")
    link.revoked_at = datetime.now(timezone.utc)
    await sql_session.commit()


@SHARE_LINKS_ROUTER.get(
    "/analytics/{link_id}", response_model=ShareLinkAnalytics
)
async def share_link_analytics(
    link_id: uuid.UUID,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> ShareLinkAnalytics:
    link = await sql_session.get(ShareLinkModel, link_id)
    if link is None:
        raise HTTPException(404, "Share link not found")
    await check_deck_access(link.presentation_id, sql_session, ctx)

    total_views = (
        await sql_session.scalar(
            select(func.count(ShareViewModel.id)).where(
                ShareViewModel.share_link_id == link_id
            )
        )
        or 0
    )
    unique_viewers = (
        await sql_session.scalar(
            select(func.count(func.distinct(ShareViewModel.viewer_email))).where(
                ShareViewModel.share_link_id == link_id,
                ShareViewModel.viewer_email.is_not(None),
            )
        )
        or 0
    )
    recent_rows = (
        await sql_session.execute(
            select(ShareViewModel)
            .where(ShareViewModel.share_link_id == link_id)
            .order_by(ShareViewModel.viewed_at.desc())
            .limit(50)
        )
    ).scalars().all()

    return ShareLinkAnalytics(
        share_link_id=link_id,
        total_views=total_views,
        unique_viewers=unique_viewers,
        recent_views=[
            RecentView(viewer_email=v.viewer_email, viewed_at=v.viewed_at)
            for v in recent_rows
        ],
    )


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _make_token() -> str:
    # 18 bytes → 24 chars URL-safe base64; collision-resistant for our scale.
    return secrets.token_urlsafe(18)


def _days(n: int):
    from datetime import timedelta

    return timedelta(days=n)
