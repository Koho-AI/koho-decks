"""
OAuth 2.1 authorization-server helpers.

Endpoint handlers live in api/v1/public/oauth.py. This module owns the
pure-function primitives (token generation, PKCE verification, URL
validation, JWT claim assembly, refresh-token hashing) so they're
unit-testable without HTTP context.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlparse

from services.jwt_signing import sign_jwt


log = logging.getLogger(__name__)


ACCESS_TOKEN_TTL_SECONDS = 3600  # 1 hour
REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 3600  # 30 days
AUTH_CODE_TTL_SECONDS = 600  # 10 minutes

CLIENT_ID_PREFIX = "kohoc_"
REFRESH_TOKEN_PREFIX = "kohor_"
AUTH_CODE_PREFIX = "kohoa_"

# Scope names; all-or-nothing for now. "koho-decks" is the catchall scope
# that grants everything the token's owner can do via the web UI.
DEFAULT_SCOPE = "koho-decks"
ALL_SCOPES = {DEFAULT_SCOPE}


def base_url() -> str:
    """Canonical public origin. Used as `iss` and `aud` of every JWT
    and as the prefix for URLs in AS metadata."""
    return os.getenv("APP_BASE_URL", "http://localhost:8094").rstrip("/")


# ─── Token generation ────────────────────────────────────────────────────────


def new_client_id() -> str:
    return f"{CLIENT_ID_PREFIX}{secrets.token_hex(16)}"


def new_auth_code() -> str:
    # URL-safe; redeemed server-side by exact match.
    return f"{AUTH_CODE_PREFIX}{secrets.token_urlsafe(32)}"


def new_refresh_token() -> str:
    return f"{REFRESH_TOKEN_PREFIX}{secrets.token_urlsafe(32)}"


def hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# ─── PKCE ────────────────────────────────────────────────────────────────────


def verify_pkce_s256(code_verifier: str, expected_challenge: str) -> bool:
    """RFC 7636 S256: challenge = BASE64URL(SHA256(code_verifier)).

    Constant-time compare to avoid timing oracles on the challenge hash.
    """
    if not code_verifier or not expected_challenge:
        return False
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    computed = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return hmac.compare_digest(computed, expected_challenge)


# ─── Redirect-URI validation ────────────────────────────────────────────────


_LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "[::1]", "::1"}


def is_valid_client_redirect_uri(candidate: str) -> bool:
    """Accept https:// URIs OR http:// loopback (for native MCP clients
    that run a local HTTP callback on a random port).

    No wildcards, no query strings, no fragments per OAuth 2.1 §5.1.1.
    """
    if not candidate or len(candidate) > 2048:
        return False
    try:
        parsed = urlparse(candidate)
    except Exception:
        return False
    if parsed.fragment:
        return False
    scheme = (parsed.scheme or "").lower()
    host = (parsed.hostname or "").lower()
    if scheme == "https" and host:
        return True
    if scheme == "http" and host in _LOOPBACK_HOSTS:
        return True
    return False


def exact_redirect_match(registered: list[str], candidate: str) -> bool:
    """Per OAuth 2.1, redirect URI matching MUST be exact string equality
    (no path prefix tricks, no port wildcards, etc.).

    Small exception: native MCP clients listen on a random loopback port,
    so for registered `http://127.0.0.1/callback` we allow any port as
    long as host+path match. Mirrors what Claude Code's OAuth client does.
    """
    if candidate in registered:
        return True
    try:
        cand = urlparse(candidate)
    except Exception:
        return False
    cand_scheme = (cand.scheme or "").lower()
    cand_host = (cand.hostname or "").lower()
    if cand_scheme != "http" or cand_host not in _LOOPBACK_HOSTS:
        return False
    cand_path = cand.path or "/"
    for reg in registered:
        try:
            r = urlparse(reg)
        except Exception:
            continue
        if (
            (r.scheme or "").lower() == "http"
            and (r.hostname or "").lower() in _LOOPBACK_HOSTS
            and (r.path or "/") == cand_path
        ):
            return True
    return False


# ─── Scope handling ──────────────────────────────────────────────────────────


def parse_scope(raw: str | None) -> str:
    """Return a canonical (sorted, deduplicated, space-separated) scope
    string containing only known scopes. Empty input defaults to
    DEFAULT_SCOPE."""
    if not raw:
        return DEFAULT_SCOPE
    requested = {s for s in raw.strip().split() if s in ALL_SCOPES}
    if not requested:
        return DEFAULT_SCOPE
    return " ".join(sorted(requested))


# ─── JWT issuance ────────────────────────────────────────────────────────────


def mint_access_token(
    *,
    user_id: str,
    email: str | None,
    name: str | None,
    avatar_url: str | None,
    organisation_id: str | None,
    client_id: str,
    scope: str,
) -> tuple[str, int]:
    """Return (jwt_string, expires_in_seconds).

    Claims cover the standard JWT set plus user-profile fields so the
    resource server doesn't need a DB lookup on every request. The
    profile fields mirror what AuthContext carries today."""
    issuer = base_url()
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(seconds=ACCESS_TOKEN_TTL_SECONDS)
    claims: dict[str, Any] = {
        "iss": issuer,
        "aud": issuer,
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "jti": secrets.token_urlsafe(16),
        "client_id": client_id,
        "scope": scope,
    }
    # Profile claims — safe to expose, already visible to the holder
    # through the /me endpoint.
    if email:
        claims["email"] = email
    if name:
        claims["name"] = name
    if avatar_url:
        claims["avatar_url"] = avatar_url
    if organisation_id:
        claims["organisation_id"] = organisation_id
    return sign_jwt(claims), ACCESS_TOKEN_TTL_SECONDS


# ─── Metadata documents ──────────────────────────────────────────────────────


def authorization_server_metadata() -> dict[str, Any]:
    """RFC 8414 document at /.well-known/oauth-authorization-server."""
    issuer = base_url()
    return {
        "issuer": issuer,
        "authorization_endpoint": f"{issuer}/oauth/authorize",
        "token_endpoint": f"{issuer}/oauth/token",
        "revocation_endpoint": f"{issuer}/oauth/revoke",
        "registration_endpoint": f"{issuer}/oauth/register",
        "jwks_uri": f"{issuer}/.well-known/jwks.json",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "code_challenge_methods_supported": ["S256"],
        "token_endpoint_auth_methods_supported": ["none"],
        "scopes_supported": sorted(ALL_SCOPES),
        "service_documentation": f"{issuer}/readme",
    }


def protected_resource_metadata() -> dict[str, Any]:
    """RFC 9728 document at /.well-known/oauth-protected-resource."""
    issuer = base_url()
    return {
        "resource": f"{issuer}/mcp",
        "authorization_servers": [issuer],
        "scopes_supported": sorted(ALL_SCOPES),
        "bearer_methods_supported": ["header"],
    }


# ─── Naive input validators (request-level, pre-DB) ──────────────────────────


_CLIENT_NAME_RE = re.compile(r"^[\w\s\-.,'()/:@]{1,100}$")


def is_valid_client_name(name: str) -> bool:
    return bool(name) and bool(_CLIENT_NAME_RE.match(name))
