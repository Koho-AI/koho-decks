"""
Personal access token CRUD.

Endpoints are cookie-session-only — a caller authenticated via a PAT
(X-Koho-Api-Token) is rejected here. This is deliberate: a leaked PAT
must not be able to mint more tokens or revoke legitimate ones. The
raw token is returned exactly once in the POST response; after that
only the SHA-256 hash lives in the DB.
"""

from datetime import datetime, timezone
from typing import List, Optional
import hashlib
import os
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth_context import AuthContext
from api.deps import get_current_user_strict
from models.sql.api_token import (
    ApiTokenModel,
    TOKEN_DISPLAY_PREFIX_LEN,
    TOKEN_RAW_PREFIX,
)
from services.database import get_async_session


TOKENS_ROUTER = APIRouter(
    prefix="/tokens",
    tags=["ApiTokens"],
    dependencies=[Depends(get_current_user_strict)],
)


# ─── Schemas ─────────────────────────────────────────────────────────────────


class CreateTokenRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CreatedTokenResponse(BaseModel):
    """Response for POST — includes the raw token, shown exactly once."""

    id: uuid.UUID
    name: str
    token: str
    prefix: str
    created_at: datetime


class TokenListItem(BaseModel):
    id: uuid.UUID
    name: str
    prefix: str
    created_at: datetime
    last_used_at: Optional[datetime]


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _generate_raw_token() -> str:
    # 32 hex chars = 128 bits of entropy — same order as GitHub fine-grained
    # PATs, well beyond anything brute-force-relevant.
    return f"{TOKEN_RAW_PREFIX}{secrets.token_hex(16)}"


def hash_raw_token(raw: str) -> str:
    """Deterministic SHA-256 hex digest — used by both this module and
    the AuthMiddleware lookup path. Stored, never the raw value."""
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _assert_cookie_session(ctx: AuthContext) -> None:
    """PAT-minting is intentionally gated to browser-session callers.
    A PAT-authenticated request (X-Koho-Api-Token) is forbidden here."""
    if ctx.is_pat_authenticated:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Personal access tokens cannot be managed via PAT auth",
        )


# Origin-header check as a belt-and-braces CSRF defence on top of NextAuth's
# SameSite=Lax cookie. Accepts any configured origin + any same-host request.
# Missing Origin is allowed (curl / native clients do not send it).
#
# DECKS_PUBLIC_ORIGINS is the comma-separated allow-list for cross-origin
# browser requests (e.g. "https://decks.koho.ai"). When unset (dev/test),
# we fall back to host-header matching, which is enough because browsers
# always send Origin matching the scheme+host for same-site fetches.
_ALLOWED_ORIGINS = {
    o.strip()
    for o in os.getenv("DECKS_PUBLIC_ORIGINS", "").split(",")
    if o.strip()
}


def _assert_same_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if not origin:
        return
    if _ALLOWED_ORIGINS and origin in _ALLOWED_ORIGINS:
        return
    host = request.headers.get("host")
    if host and origin.endswith(f"://{host}"):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Cross-origin request rejected",
    )


# ─── Endpoints ───────────────────────────────────────────────────────────────


@TOKENS_ROUTER.post(
    "", response_model=CreatedTokenResponse, status_code=status.HTTP_201_CREATED
)
async def create_token(
    payload: CreateTokenRequest,
    request: Request,
    response: Response,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> CreatedTokenResponse:
    _assert_cookie_session(ctx)
    _assert_same_origin(request)

    raw = _generate_raw_token()
    token = ApiTokenModel(
        user_id=ctx.user_id,
        name=payload.name.strip(),
        token_hash=hash_raw_token(raw),
        token_prefix=raw[:TOKEN_DISPLAY_PREFIX_LEN],
    )
    sql_session.add(token)
    await sql_session.commit()
    await sql_session.refresh(token)

    # Raw value must never be cached by intermediaries.
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"

    return CreatedTokenResponse(
        id=token.id,
        name=token.name,
        token=raw,
        prefix=token.token_prefix,
        created_at=token.created_at,
    )


@TOKENS_ROUTER.get("", response_model=List[TokenListItem])
async def list_tokens(
    request: Request,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> List[TokenListItem]:
    _assert_cookie_session(ctx)
    _assert_same_origin(request)

    rows = (
        await sql_session.execute(
            select(ApiTokenModel)
            .where(
                ApiTokenModel.user_id == ctx.user_id,
                ApiTokenModel.revoked_at.is_(None),
            )
            .order_by(ApiTokenModel.created_at.desc())
        )
    ).scalars().all()
    return [
        TokenListItem(
            id=row.id,
            name=row.name,
            prefix=row.token_prefix,
            created_at=row.created_at,
            last_used_at=row.last_used_at,
        )
        for row in rows
    ]


@TOKENS_ROUTER.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_token(
    token_id: uuid.UUID,
    request: Request,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> Response:
    _assert_cookie_session(ctx)
    _assert_same_origin(request)

    token = (
        await sql_session.execute(
            select(ApiTokenModel).where(
                ApiTokenModel.id == token_id,
                ApiTokenModel.user_id == ctx.user_id,
                ApiTokenModel.revoked_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    # 404 rather than 403 so we don't leak existence of other users' tokens.
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Token not found"
        )

    token.revoked_at = datetime.now(timezone.utc)
    await sql_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
