import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import Request
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware

from api.auth_context import ANONYMOUS, AuthContext
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

        await session.commit()

        return AuthContext(
            user_id=user.id,
            organisation_id=org.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
        )
