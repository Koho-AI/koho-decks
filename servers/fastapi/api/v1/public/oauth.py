"""
OAuth 2.1 authorization server endpoints.

Layout:
  POST /oauth/register               — RFC 7591 Dynamic Client Registration
  GET  /oauth/authorize              — browser entry; redirects to the Next.js consent page (or directly to redirect_uri if consent exists)
  POST /oauth/consent                — consent submission from the Next.js page
  POST /oauth/token                  — authorization_code + refresh_token grants
  POST /oauth/revoke                 — refresh token revocation (RFC 7009)

Cookie-session endpoints (NextAuth) for the /settings/oauth-clients UI:
  GET  /oauth/my-clients             — list the caller's active clients
  DELETE /oauth/my-clients/{id}      — revoke: wipe consent + all refresh tokens for this (user, client)

Internal design:
- User identity for the authorize flow comes from AuthMiddleware (same
  as every other cookie-authed request). If ANONYMOUS, we 302 to /signin
  with a callbackUrl that round-trips back through authorize.
- Consent is persisted; re-authorization (silent or explicit) skips the
  consent UI if an active grant exists for (user, client).
- Refresh tokens rotate on every use. Reuse of a revoked refresh token
  (stolen token replay) is logged as a warning — a future hardening
  step could revoke the whole family on detection, but initial cut
  just fails the request.
"""

from __future__ import annotations

import hashlib
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth_context import AuthContext
from api.deps import get_current_user, get_current_user_strict
from models.sql.oauth_authorization_code import OAuthAuthorizationCodeModel
from models.sql.oauth_client import OAuthClientModel
from models.sql.oauth_consent import OAuthConsentModel
from models.sql.oauth_refresh_token import OAuthRefreshTokenModel
from services.database import get_async_session
from services.oauth_server import (
    ACCESS_TOKEN_TTL_SECONDS,
    AUTH_CODE_TTL_SECONDS,
    DEFAULT_SCOPE,
    REFRESH_TOKEN_TTL_SECONDS,
    base_url,
    exact_redirect_match,
    hash_refresh_token,
    is_valid_client_name,
    is_valid_client_redirect_uri,
    mint_access_token,
    new_auth_code,
    new_client_id,
    new_refresh_token,
    parse_scope,
    verify_pkce_s256,
)


log = logging.getLogger(__name__)


OAUTH_ROUTER = APIRouter(prefix="/oauth", tags=["OAuth"])


# Same Origin-check pattern as the legacy tokens endpoint. Browser-side
# POSTs (consent submit, client revocation) go through NextAuth cookies;
# this is a belt-and-braces CSRF defence on top of SameSite=Lax.
_ALLOWED_ORIGINS: set[str] = set()


def _compute_allowed_origins() -> set[str]:
    origins: set[str] = set()
    base = os.getenv("APP_BASE_URL", "").strip().rstrip("/")
    if base:
        origins.add(base)
    for o in os.getenv("DECKS_PUBLIC_ORIGINS", "").split(","):
        o = o.strip().rstrip("/")
        if o:
            origins.add(o)
    return origins


def _allowed_origins() -> set[str]:
    # Recompute lazily so tests that tweak env vars don't get surprised.
    global _ALLOWED_ORIGINS
    if not _ALLOWED_ORIGINS:
        _ALLOWED_ORIGINS = _compute_allowed_origins()
    return _ALLOWED_ORIGINS


def _assert_same_origin(request: Request) -> None:
    """CSRF defence for cookie-authenticated state-changing endpoints.

    Strict mode: we require EITHER an Origin header matching our allow-list
    OR a Referer header from the same origin. Missing both is rejected —
    the previous permissive-on-absent behaviour let stripped-proxy or
    hand-crafted non-browser clients sidestep the check entirely.
    Browsers always send at least one of Origin/Referer on cookie-bearing
    fetch POSTs to decks.koho.ai."""
    allowed = _allowed_origins()
    origin = (request.headers.get("origin") or "").rstrip("/")
    if origin:
        if origin in allowed:
            return
        if not allowed and origin.startswith(
            ("http://localhost", "http://127.0.0.1")
        ):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-origin request rejected",
        )

    # No Origin — fall back to Referer. This covers older clients and
    # same-origin fetches where some browsers strip Origin on redirects.
    referer = request.headers.get("referer") or ""
    if referer:
        for ok in allowed:
            if referer.startswith(f"{ok}/") or referer == ok:
                return
        if not allowed and referer.startswith(
            ("http://localhost", "http://127.0.0.1")
        ):
            return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Cross-origin request rejected",
    )


# ─── RFC 7591: Dynamic Client Registration ─────────────────────────────────


class RegisterClientRequest(BaseModel):
    client_name: str = Field(min_length=1, max_length=100)
    redirect_uris: List[str] = Field(min_length=1, max_length=10)
    token_endpoint_auth_method: str = Field(default="none")


class RegisterClientResponse(BaseModel):
    client_id: str
    client_name: str
    redirect_uris: List[str]
    client_id_issued_at: int
    token_endpoint_auth_method: str


@OAUTH_ROUTER.post(
    "/register",
    response_model=RegisterClientResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_client(
    payload: RegisterClientRequest,
    sql_session: AsyncSession = Depends(get_async_session),
) -> RegisterClientResponse:
    if not is_valid_client_name(payload.client_name):
        raise HTTPException(400, "invalid_client_metadata: client_name not allowed")
    if payload.token_endpoint_auth_method != "none":
        # Only public clients (PKCE without a client_secret) are supported.
        # MCP clients are native/installed and cannot protect a secret.
        raise HTTPException(
            400,
            "invalid_client_metadata: only token_endpoint_auth_method=none is supported",
        )
    for uri in payload.redirect_uris:
        if not is_valid_client_redirect_uri(uri):
            raise HTTPException(400, f"invalid_redirect_uri: {uri}")

    client = OAuthClientModel(
        client_id=new_client_id(),
        client_name=payload.client_name.strip(),
        redirect_uris=list(payload.redirect_uris),
        token_endpoint_auth_method="none",
    )
    sql_session.add(client)
    await sql_session.commit()
    await sql_session.refresh(client)

    return RegisterClientResponse(
        client_id=client.client_id,
        client_name=client.client_name,
        redirect_uris=list(client.redirect_uris),
        client_id_issued_at=int(client.created_at.timestamp()),
        token_endpoint_auth_method=client.token_endpoint_auth_method,
    )


# ─── Authorize (browser entry) ──────────────────────────────────────────────


def _authorize_error_redirect(
    redirect_uri: str, error: str, description: str, state: str | None
) -> RedirectResponse:
    """Redirect the client back to its redirect_uri with an OAuth error.
    Used for validation failures that happen AFTER we've verified the
    redirect_uri belongs to the client — earlier validation failures
    surface as HTTP 400 instead."""
    params = {"error": error, "error_description": description}
    if state:
        params["state"] = state
    sep = "&" if "?" in redirect_uri else "?"
    return RedirectResponse(
        url=f"{redirect_uri}{sep}{urlencode(params)}", status_code=302
    )


async def _load_client_or_400(
    client_id: str, sql_session: AsyncSession
) -> OAuthClientModel:
    client = (
        await sql_session.execute(
            select(OAuthClientModel).where(OAuthClientModel.client_id == client_id)
        )
    ).scalar_one_or_none()
    if client is None:
        raise HTTPException(400, "invalid_client")
    return client


async def _has_active_consent(
    sql_session: AsyncSession,
    user_id: uuid.UUID,
    client_pk: uuid.UUID,
    scope: str,
) -> bool:
    row = (
        await sql_session.execute(
            select(OAuthConsentModel).where(
                OAuthConsentModel.user_id == user_id,
                OAuthConsentModel.client_id == client_pk,
                OAuthConsentModel.revoked_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if row is None:
        return False
    # For now scope is all-or-nothing, so presence of any grant suffices.
    # When we add fine-grained scopes, check that requested scopes ⊆ granted.
    return True


@OAUTH_ROUTER.get("/authorize")
async def authorize(
    request: Request,
    client_id: str,
    redirect_uri: str,
    response_type: str = "code",
    scope: str | None = None,
    state: str | None = None,
    code_challenge: str | None = None,
    code_challenge_method: str | None = None,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user),
) -> Response:
    # Validate client + redirect_uri FIRST, before doing anything with the
    # other params — OAuth 2.1 §4.1.2.1 says errors here MUST NOT redirect.
    client = await _load_client_or_400(client_id, sql_session)
    if not exact_redirect_match(list(client.redirect_uris), redirect_uri):
        raise HTTPException(400, "invalid_redirect_uri")

    if response_type != "code":
        return _authorize_error_redirect(
            redirect_uri,
            "unsupported_response_type",
            "only 'code' is supported",
            state,
        )
    if code_challenge_method != "S256":
        return _authorize_error_redirect(
            redirect_uri,
            "invalid_request",
            "PKCE with code_challenge_method=S256 is required",
            state,
        )
    if not code_challenge or len(code_challenge) < 43 or len(code_challenge) > 128:
        return _authorize_error_redirect(
            redirect_uri, "invalid_request", "malformed code_challenge", state
        )

    canonical_scope = parse_scope(scope)

    # Not signed in → bounce to NextAuth's sign-in page with a callback
    # that brings us back here.
    if not ctx.is_authenticated or ctx.user_id is None:
        current_path = request.url.path
        query = request.url.query
        callback = f"{current_path}?{query}" if query else current_path
        signin_url = f"{base_url()}/signin?callbackUrl={callback}"
        return RedirectResponse(url=signin_url, status_code=302)

    # Already consented → mint code + redirect back to the client.
    if await _has_active_consent(sql_session, ctx.user_id, client.id, canonical_scope):
        code = await _issue_auth_code(
            sql_session=sql_session,
            client_pk=client.id,
            user_id=ctx.user_id,
            redirect_uri=redirect_uri,
            code_challenge=code_challenge,
            scope=canonical_scope,
        )
        params = {"code": code}
        if state:
            params["state"] = state
        sep = "&" if "?" in redirect_uri else "?"
        return RedirectResponse(
            url=f"{redirect_uri}{sep}{urlencode(params)}", status_code=302
        )

    # Need consent → bounce the browser to the Next.js consent page with
    # the original authorize params + the client's display name (so the
    # page can render "Approve <name>?" without a separate API fetch).
    # The consent page POSTs to /oauth/consent on approve.
    consent_params = {
        "client_id": client_id,
        "client_name": client.client_name,
        "redirect_uri": redirect_uri,
        "scope": canonical_scope,
        "code_challenge": code_challenge,
        "code_challenge_method": code_challenge_method,
    }
    if state:
        consent_params["state"] = state
    consent_url = f"{base_url()}/settings/oauth/consent?{urlencode(consent_params)}"
    return RedirectResponse(url=consent_url, status_code=302)


async def _issue_auth_code(
    *,
    sql_session: AsyncSession,
    client_pk: uuid.UUID,
    user_id: uuid.UUID,
    redirect_uri: str,
    code_challenge: str,
    scope: str,
) -> str:
    code = new_auth_code()
    now = datetime.now(tz=timezone.utc)
    row = OAuthAuthorizationCodeModel(
        code=code,
        client_id=client_pk,
        user_id=user_id,
        redirect_uri=redirect_uri,
        code_challenge=code_challenge,
        code_challenge_method="S256",
        scope=scope,
        expires_at=now + timedelta(seconds=AUTH_CODE_TTL_SECONDS),
    )
    sql_session.add(row)
    await sql_session.commit()
    return code


# ─── Consent submission from the Next.js page ──────────────────────────────


class ConsentSubmitRequest(BaseModel):
    client_id: str
    redirect_uri: str
    scope: str
    code_challenge: str
    code_challenge_method: str = "S256"
    state: str | None = None


class ConsentSubmitResponse(BaseModel):
    redirect_url: str


@OAUTH_ROUTER.post("/consent", response_model=ConsentSubmitResponse)
async def submit_consent(
    payload: ConsentSubmitRequest,
    request: Request,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> ConsentSubmitResponse:
    # Cookie-session only — PAT-auth is blocked implicitly because this
    # endpoint is called via fetch from the Next.js page, which sends
    # cookies, not JWTs.
    _assert_same_origin(request)

    if ctx.user_id is None:
        raise HTTPException(401, "unauthenticated")

    client = await _load_client_or_400(payload.client_id, sql_session)
    if not exact_redirect_match(list(client.redirect_uris), payload.redirect_uri):
        raise HTTPException(400, "invalid_redirect_uri")
    if payload.code_challenge_method != "S256":
        raise HTTPException(400, "code_challenge_method must be S256")
    if not payload.code_challenge or len(payload.code_challenge) < 43:
        raise HTTPException(400, "malformed code_challenge")

    canonical_scope = parse_scope(payload.scope)

    # Upsert consent row. Replace-by-(user, client) per unique constraint:
    # mark any existing row revoked, then insert a fresh one. Keeps an
    # audit trail.
    existing = (
        await sql_session.execute(
            select(OAuthConsentModel).where(
                OAuthConsentModel.user_id == ctx.user_id,
                OAuthConsentModel.client_id == client.id,
                OAuthConsentModel.revoked_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    now = datetime.now(tz=timezone.utc)
    if existing is not None:
        existing.revoked_at = now
    sql_session.add(
        OAuthConsentModel(
            user_id=ctx.user_id,
            client_id=client.id,
            scope=canonical_scope,
        )
    )

    # Touch the client's last-used timestamp for display in the UI.
    client.last_used_at = now

    await sql_session.commit()

    code = await _issue_auth_code(
        sql_session=sql_session,
        client_pk=client.id,
        user_id=ctx.user_id,
        redirect_uri=payload.redirect_uri,
        code_challenge=payload.code_challenge,
        scope=canonical_scope,
    )

    params = {"code": code}
    if payload.state:
        params["state"] = payload.state
    sep = "&" if "?" in payload.redirect_uri else "?"
    return ConsentSubmitResponse(
        redirect_url=f"{payload.redirect_uri}{sep}{urlencode(params)}"
    )


# ─── Token endpoint (code + refresh grants) ────────────────────────────────


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    refresh_token: str
    scope: str


async def _mint_token_response(
    *,
    sql_session: AsyncSession,
    client_pk: uuid.UUID,
    client_id_str: str,
    user_id: uuid.UUID,
    scope: str,
) -> TokenResponse:
    """Load the user, mint a JWT + refresh token, persist the refresh row."""
    # Need user profile fields for the access token claims. Imported lazily
    # to avoid a circular import at module load time.
    from models.sql.membership import MembershipModel
    from models.sql.user import UserModel

    row = (
        await sql_session.execute(
            select(UserModel, MembershipModel)
            .join(
                MembershipModel,
                MembershipModel.user_id == UserModel.id,
                isouter=True,
            )
            .where(UserModel.id == user_id)
            .limit(1)
        )
    ).first()
    if row is None:
        raise HTTPException(400, "invalid_grant: user missing")
    user, membership = row

    access_token, ttl = mint_access_token(
        user_id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        organisation_id=(
            str(membership.organisation_id) if membership else None
        ),
        client_id=client_id_str,
        scope=scope,
    )
    raw_refresh = new_refresh_token()
    refresh_row = OAuthRefreshTokenModel(
        token_hash=hash_refresh_token(raw_refresh),
        client_id=client_pk,
        user_id=user_id,
        scope=scope,
        expires_at=datetime.now(tz=timezone.utc)
        + timedelta(seconds=REFRESH_TOKEN_TTL_SECONDS),
    )
    sql_session.add(refresh_row)
    await sql_session.commit()

    return TokenResponse(
        access_token=access_token,
        expires_in=ttl,
        refresh_token=raw_refresh,
        scope=scope,
    )


@OAUTH_ROUTER.post("/token")
async def token(
    request: Request,
    response: Response,
    sql_session: AsyncSession = Depends(get_async_session),
) -> Response:
    """application/x-www-form-urlencoded per RFC 6749 §3.2."""
    form = await request.form()
    grant_type = str(form.get("grant_type") or "")

    # Don't let the access/refresh tokens get cached anywhere.
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"

    if grant_type == "authorization_code":
        return await _grant_authorization_code(form, sql_session, response)
    if grant_type == "refresh_token":
        return await _grant_refresh_token(form, sql_session, response)
    raise HTTPException(400, f"unsupported_grant_type: {grant_type!r}")


async def _grant_authorization_code(
    form: Any, sql_session: AsyncSession, response: Response
) -> Response:
    code = str(form.get("code") or "")
    client_id_str = str(form.get("client_id") or "")
    redirect_uri = str(form.get("redirect_uri") or "")
    code_verifier = str(form.get("code_verifier") or "")
    if not all([code, client_id_str, redirect_uri, code_verifier]):
        raise HTTPException(400, "invalid_request: missing required fields")

    client = (
        await sql_session.execute(
            select(OAuthClientModel).where(OAuthClientModel.client_id == client_id_str)
        )
    ).scalar_one_or_none()
    if client is None:
        raise HTTPException(400, "invalid_client")

    # Row-level lock so two concurrent token exchanges for the same code
    # serialise: the first commits consumed_at, the second reads the
    # already-consumed row and rejects. Without FOR UPDATE the check +
    # write pair is a race window that lets a stolen code be redeemed
    # twice before either marks the row.
    code_row = (
        await sql_session.execute(
            select(OAuthAuthorizationCodeModel)
            .where(OAuthAuthorizationCodeModel.code == code)
            .with_for_update()
        )
    ).scalar_one_or_none()
    if code_row is None:
        raise HTTPException(400, "invalid_grant: unknown code")
    if code_row.consumed_at is not None:
        # Single-use enforcement. Re-redemption attempt is a signal of
        # interception — log loudly and fail.
        log.warning(
            "oauth: authorization code reused (client=%s user=%s)",
            client.client_id,
            code_row.user_id,
        )
        raise HTTPException(400, "invalid_grant: code already used")
    if code_row.expires_at < datetime.now(tz=timezone.utc):
        raise HTTPException(400, "invalid_grant: code expired")
    if code_row.client_id != client.id:
        raise HTTPException(400, "invalid_grant: code/client mismatch")
    if code_row.redirect_uri != redirect_uri:
        raise HTTPException(400, "invalid_grant: redirect_uri mismatch")
    if not verify_pkce_s256(code_verifier, code_row.code_challenge):
        raise HTTPException(400, "invalid_grant: PKCE verification failed")

    # Mark consumed before minting so a crash between these two can never
    # leak a double-spend.
    code_row.consumed_at = datetime.now(tz=timezone.utc)
    await sql_session.commit()

    token_resp = await _mint_token_response(
        sql_session=sql_session,
        client_pk=client.id,
        client_id_str=client.client_id,
        user_id=code_row.user_id,
        scope=code_row.scope or DEFAULT_SCOPE,
    )
    # Pydantic will serialize via FastAPI's response handling, but we
    # have a Response object for header control; return JSON explicitly.
    from fastapi.responses import JSONResponse

    return JSONResponse(
        content=token_resp.model_dump(),
        headers=dict(response.headers),
    )


async def _grant_refresh_token(
    form: Any, sql_session: AsyncSession, response: Response
) -> Response:
    raw_token = str(form.get("refresh_token") or "")
    client_id_str = str(form.get("client_id") or "")
    if not raw_token or not client_id_str:
        raise HTTPException(400, "invalid_request")

    client = (
        await sql_session.execute(
            select(OAuthClientModel).where(OAuthClientModel.client_id == client_id_str)
        )
    ).scalar_one_or_none()
    if client is None:
        raise HTTPException(400, "invalid_client")

    token_hash = hash_refresh_token(raw_token)
    # Lock the refresh row for the duration of the rotation so two
    # parallel refresh requests can't both pass the revoked_at check and
    # both mint new tokens. The second caller will see revoked_at set.
    row = (
        await sql_session.execute(
            select(OAuthRefreshTokenModel)
            .where(OAuthRefreshTokenModel.token_hash == token_hash)
            .with_for_update()
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(400, "invalid_grant: unknown refresh_token")
    if row.client_id != client.id:
        raise HTTPException(400, "invalid_grant: client mismatch")
    if row.revoked_at is not None:
        log.warning(
            "oauth: revoked refresh_token replayed (user=%s client=%s)",
            row.user_id,
            client.client_id,
        )
        raise HTTPException(400, "invalid_grant: refresh_token revoked")
    if row.expires_at < datetime.now(tz=timezone.utc):
        raise HTTPException(400, "invalid_grant: refresh_token expired")

    # Rotate: revoke old, mint new.
    row.revoked_at = datetime.now(tz=timezone.utc)
    await sql_session.commit()

    token_resp = await _mint_token_response(
        sql_session=sql_session,
        client_pk=client.id,
        client_id_str=client.client_id,
        user_id=row.user_id,
        scope=row.scope or DEFAULT_SCOPE,
    )
    from fastapi.responses import JSONResponse

    return JSONResponse(
        content=token_resp.model_dump(),
        headers=dict(response.headers),
    )


# ─── Revocation (RFC 7009) ─────────────────────────────────────────────────


@OAUTH_ROUTER.post("/revoke", status_code=200)
async def revoke(
    request: Request,
    sql_session: AsyncSession = Depends(get_async_session),
) -> Response:
    form = await request.form()
    raw_token = str(form.get("token") or "")
    # token_type_hint is optional; we only support refresh tokens (access
    # tokens are stateless JWTs). Access-token "revocation" would be a
    # no-op; per RFC 7009 we return 200 either way.
    if not raw_token:
        return Response(status_code=200)

    token_hash = hash_refresh_token(raw_token)
    row = (
        await sql_session.execute(
            select(OAuthRefreshTokenModel).where(
                OAuthRefreshTokenModel.token_hash == token_hash
            )
        )
    ).scalar_one_or_none()
    if row is not None and row.revoked_at is None:
        row.revoked_at = datetime.now(tz=timezone.utc)
        await sql_session.commit()
    return Response(status_code=200)


# ─── Cookie-gated management endpoints for /settings/oauth-clients ─────────


class ClientListItem(BaseModel):
    id: uuid.UUID
    client_id: str
    client_name: str
    created_at: datetime
    last_used_at: Optional[datetime]


@OAUTH_ROUTER.get("/my-clients", response_model=List[ClientListItem])
async def list_my_clients(
    request: Request,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> List[ClientListItem]:
    _assert_same_origin(request)
    if ctx.user_id is None:
        raise HTTPException(401, "unauthenticated")

    # Clients visible to this user = those with at least one active
    # consent grant OR at least one non-revoked refresh token. Cleaner
    # to join through consents.
    rows = (
        await sql_session.execute(
            select(OAuthClientModel)
            .join(
                OAuthConsentModel,
                OAuthConsentModel.client_id == OAuthClientModel.id,
            )
            .where(
                OAuthConsentModel.user_id == ctx.user_id,
                OAuthConsentModel.revoked_at.is_(None),
            )
            .order_by(OAuthClientModel.last_used_at.desc().nullslast())
        )
    ).scalars().unique().all()

    return [
        ClientListItem(
            id=c.id,
            client_id=c.client_id,
            client_name=c.client_name,
            created_at=c.created_at,
            last_used_at=c.last_used_at,
        )
        for c in rows
    ]


@OAUTH_ROUTER.delete(
    "/my-clients/{client_pk}", status_code=status.HTTP_204_NO_CONTENT
)
async def revoke_my_client(
    client_pk: uuid.UUID,
    request: Request,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
) -> Response:
    _assert_same_origin(request)
    if ctx.user_id is None:
        raise HTTPException(401, "unauthenticated")

    # Revoke all consents + refresh tokens for (user, client). 404 if the
    # user has no grant for this client (mirrors the tokens endpoint's
    # enumeration-defence pattern).
    consent_rows = (
        await sql_session.execute(
            select(OAuthConsentModel).where(
                OAuthConsentModel.user_id == ctx.user_id,
                OAuthConsentModel.client_id == client_pk,
                OAuthConsentModel.revoked_at.is_(None),
            )
        )
    ).scalars().all()
    if not consent_rows:
        raise HTTPException(404, "client grant not found")

    now = datetime.now(tz=timezone.utc)
    for c in consent_rows:
        c.revoked_at = now

    refresh_rows = (
        await sql_session.execute(
            select(OAuthRefreshTokenModel).where(
                OAuthRefreshTokenModel.user_id == ctx.user_id,
                OAuthRefreshTokenModel.client_id == client_pk,
                OAuthRefreshTokenModel.revoked_at.is_(None),
            )
        )
    ).scalars().all()
    for r in refresh_rows:
        r.revoked_at = now

    await sql_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
