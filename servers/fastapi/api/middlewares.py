import asyncio
import hashlib
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import Request
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware

from api.auth_context import ANONYMOUS, INTERNAL_RENDER, AuthContext
from models.sql.api_token import ApiTokenModel
from models.sql.deck_collaborator import DeckCollaboratorModel
from models.sql.invitation import InvitationModel
from models.sql.membership import MembershipModel, ROLE_MEMBER, ROLE_OWNER
from models.sql.organisation import OrganisationModel
from models.sql.user import UserModel
from services.database import async_session_maker
from utils.get_env import get_can_change_keys_env
from utils.user_config import update_env_with_user_config


log = logging.getLogger(__name__)


class UserConfigEnvUpdateMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if get_can_change_keys_env() != "false":
            update_env_with_user_config()
        return await call_next(request)


# ─── Auth ────────────────────────────────────────────────────────────────────
# NextAuth v5 session cookie names. Secure prefix is used on https origins.
_SESSION_COOKIE_NAMES = (
    "authjs.session-token",
    "__Secure-authjs.session-token",
)

# Inside the container Next.js serves on this URL. We never hit it over the
# public nginx — this is an internal introspection call.
_NEXTJS_INTERNAL = os.getenv("NEXTJS_INTERNAL_URL", "http://127.0.0.1:3000")

# Org that every @koho.ai user gets auto-added to on first sign-in. Seeded
# by the Alembic migration a1b2c3d4e5f6.
_DEFAULT_ORG_SLUG = "koho"

# Seed-owner email: the first @koho.ai user to sign in with this email is
# promoted to owner of the Koho org (and any subsequent owner-restricted
# operations). Configurable via env, defaults to Oliver.
_SEED_OWNER_EMAIL = os.getenv("KOHO_SEED_OWNER_EMAIL", "oliver@koho.ai").lower()

# Shared secret between Next.js export routes and FastAPI. When the
# export handler launches Puppeteer, it sets `X-Koho-Internal-Token:
# <this value>` on every navigation so the sessionless browser can still
# fetch presentation data via FastAPI. Requests carrying this header
# bypass cookie auth and get a read-only "internal render" AuthContext.
# Empty/unset disables the feature — the header is then ignored.
_INTERNAL_RENDER_TOKEN = os.getenv("INTERNAL_RENDER_TOKEN", "")
_INTERNAL_RENDER_HEADER = "x-koho-internal-token"

# Header carrying a personal access token. Distinct from Authorization so
# FastAPI only sees PATs that flowed through an intentional path (the MCP
# server's httpx hop translates Bearer → this header, or a well-informed
# caller/test hits FastAPI directly). Caddy never sees the raw PAT on the
# public Authorization header.
_PAT_HEADER = "x-koho-api-token"


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Populates `request.state.auth` with an AuthContext on every request.

    Identity source of truth is NextAuth's session JWT (stored in an
    HTTP-only cookie by the Next.js frontend). Rather than decrypt the
    JWE ourselves, we forward the cookie to the internal Next.js
    `/api/auth/session` endpoint which returns the validated session
    as JSON.

    First-time sign-in side effects:
    - Upsert UserModel (key: google_sub, fallback: email).
    - Ensure the user has a Membership in the default Koho org.
    - Promote to owner if the email matches `KOHO_SEED_OWNER_EMAIL`.

    The middleware never blocks requests — endpoints that require auth
    use the `get_current_user_strict` dependency to raise 401.
    """

    async def dispatch(self, request: Request, call_next):
        request.state.auth = ANONYMOUS

        if _is_internal_render_request(request):
            request.state.auth = INTERNAL_RENDER
            return await call_next(request)

        # Personal access token takes precedence over cookie session: MCP
        # clients never have cookies, and a PAT-bearing request is opting
        # explicitly into that identity. Cookie falls through naturally
        # when the header is absent or unrecognised.
        pat_ctx = await _resolve_pat_auth(request)
        if pat_ctx is not None:
            request.state.auth = pat_ctx
            return await call_next(request)

        session_cookie = _find_session_cookie(request)
        if session_cookie:
            try:
                session_data = await _fetch_session(session_cookie)
                if session_data and session_data.get("user"):
                    request.state.auth = await _resolve_auth_context(
                        session_data["user"]
                    )
            except Exception as exc:  # pragma: no cover - defensive
                log.warning("AuthMiddleware: failed to resolve session: %s", exc)

        return await call_next(request)


def _is_internal_render_request(request: Request) -> bool:
    if not _INTERNAL_RENDER_TOKEN:
        return False
    presented = request.headers.get(_INTERNAL_RENDER_HEADER)
    if not presented:
        return False
    # Constant-time compare so an attacker timing a byte-by-byte brute force
    # can't learn the prefix. Unlikely to be exploitable through localhost
    # loopback but cheap insurance.
    import hmac
    return hmac.compare_digest(presented, _INTERNAL_RENDER_TOKEN)


async def _resolve_pat_auth(request: Request) -> Optional[AuthContext]:
    """Return an AuthContext if the request carries a valid PAT, else None.

    Never raises: an unknown / revoked / malformed token falls through
    silently so cookie auth can still take over. Raw token value never
    appears in logs.
    """
    presented = request.headers.get(_PAT_HEADER)
    if not presented:
        return None

    token_hash = hashlib.sha256(presented.encode("utf-8")).hexdigest()

    async with async_session_maker() as session:
        row = (
            await session.execute(
                select(ApiTokenModel, UserModel, MembershipModel)
                .join(UserModel, UserModel.id == ApiTokenModel.user_id)
                .join(
                    MembershipModel,
                    MembershipModel.user_id == UserModel.id,
                    isouter=True,
                )
                .where(
                    ApiTokenModel.token_hash == token_hash,
                    ApiTokenModel.revoked_at.is_(None),
                )
                .limit(1)
            )
        ).first()

    if row is None:
        return None

    token, user, membership = row

    # Fire-and-forget last_used_at update — don't block the request on
    # what is ultimately a telemetry write. Failure logs the token id
    # (never the raw value) and is otherwise swallowed.
    asyncio.create_task(_touch_last_used_at(token.id))

    return AuthContext(
        user_id=user.id,
        organisation_id=membership.organisation_id if membership else None,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        is_pat_authenticated=True,
    )


async def _touch_last_used_at(token_id: uuid.UUID) -> None:
    try:
        async with async_session_maker() as session:
            token = await session.get(ApiTokenModel, token_id)
            if token is None:
                return
            token.last_used_at = datetime.now(timezone.utc)
            await session.commit()
    except Exception as exc:  # pragma: no cover - defensive
        log.warning(
            "AuthMiddleware: last_used_at update failed for token %s: %s",
            token_id,
            exc,
        )


def _find_session_cookie(request: Request) -> Optional[tuple[str, str]]:
    for name in _SESSION_COOKIE_NAMES:
        value = request.cookies.get(name)
        if value:
            return name, value
    return None


async def _fetch_session(cookie: tuple[str, str]) -> Optional[dict]:
    """Call Next.js /api/auth/session with the session cookie and return
    the parsed JSON (or None on failure / no session)."""
    cookie_header = f"{cookie[0]}={cookie[1]}"
    async with httpx.AsyncClient(timeout=3.0) as client:
        r = await client.get(
            f"{_NEXTJS_INTERNAL}/api/auth/session",
            headers={"cookie": cookie_header},
        )
    if r.status_code != 200:
        return None
    data = r.json()
    # An unauthenticated NextAuth session is `{}` with status 200, not an
    # error — treat missing `user` as no-session.
    if not data or "user" not in data:
        return None
    return data


async def _resolve_auth_context(user_payload: dict) -> AuthContext:
    """Upsert the User + Membership rows and return an AuthContext
    describing the caller."""
    email = (user_payload.get("email") or "").strip().lower()
    if not email:
        return ANONYMOUS

    name = user_payload.get("name")
    avatar_url = user_payload.get("image")
    # NextAuth v5 puts the Google `sub` on `token.googleSub` which bubbles
    # into the session via our jwt/session callbacks. Not exposed by
    # default on `session.user`, so may be None here; we fall back to email.
    google_sub = user_payload.get("googleSub") or user_payload.get("sub")

    async with async_session_maker() as session:
        # Upsert user — match on google_sub first, then email.
        user: Optional[UserModel] = None
        if google_sub:
            user = (
                await session.execute(
                    select(UserModel).where(UserModel.google_sub == google_sub)
                )
            ).scalar_one_or_none()
        if user is None:
            user = (
                await session.execute(
                    select(UserModel).where(UserModel.email == email)
                )
            ).scalar_one_or_none()

        now = datetime.now(timezone.utc)
        if user is None:
            user = UserModel(
                email=email,
                google_sub=google_sub,
                name=name,
                avatar_url=avatar_url,
                last_login_at=now,
            )
            session.add(user)
            await session.flush()  # populate user.id
        else:
            # Keep profile fresh on every sign-in.
            user.email = email
            if google_sub and not user.google_sub:
                user.google_sub = google_sub
            if name:
                user.name = name
            if avatar_url:
                user.avatar_url = avatar_url
            user.last_login_at = now

        # Ensure membership in the default Koho org.
        org: Optional[OrganisationModel] = (
            await session.execute(
                select(OrganisationModel).where(
                    OrganisationModel.slug == _DEFAULT_ORG_SLUG
                )
            )
        ).scalar_one_or_none()
        if org is None:
            # Seeded by the migration, but defensive in case the migration
            # hasn't run yet.
            org = OrganisationModel(slug=_DEFAULT_ORG_SLUG, name="Koho")
            session.add(org)
            await session.flush()

        membership: Optional[MembershipModel] = (
            await session.execute(
                select(MembershipModel).where(
                    MembershipModel.user_id == user.id,
                    MembershipModel.organisation_id == org.id,
                )
            )
        ).scalar_one_or_none()
        if membership is None:
            role = ROLE_OWNER if email == _SEED_OWNER_EMAIL else ROLE_MEMBER
            membership = MembershipModel(
                user_id=user.id, organisation_id=org.id, role=role
            )
            session.add(membership)

        # Resolve any pending invitations addressed to this email
        # (Phase 4) — convert each unaccepted Invitation into a
        # DeckCollaborator. Skips expired ones.
        pending = (
            await session.execute(
                select(InvitationModel).where(
                    InvitationModel.email == email,
                    InvitationModel.accepted_at.is_(None),
                    InvitationModel.expires_at > datetime.now(timezone.utc),
                )
            )
        ).scalars().all()
        for invite in pending:
            existing = (
                await session.execute(
                    select(DeckCollaboratorModel).where(
                        DeckCollaboratorModel.presentation_id
                        == invite.presentation_id,
                        DeckCollaboratorModel.user_id == user.id,
                    )
                )
            ).scalar_one_or_none()
            if existing is None:
                session.add(
                    DeckCollaboratorModel(
                        presentation_id=invite.presentation_id,
                        user_id=user.id,
                        role=invite.role,
                        invited_by_user_id=invite.invited_by_user_id,
                    )
                )
            invite.accepted_at = now

        await session.commit()

        return AuthContext(
            user_id=user.id,
            organisation_id=org.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
        )
