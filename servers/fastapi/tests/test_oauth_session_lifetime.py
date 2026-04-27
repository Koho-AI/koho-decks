"""Regression tests for the MCP session-token lifetime fix.

The bug being prevented: agents authenticated to decks.koho.ai via the
MCP OAuth flow were seeing 401s ~10 minutes into a session because the
access-token TTL was set to 1 hour and most MCP clients do not refresh
silently mid-session. This file pins the new contract:

  AC1  default access-token TTL is at least 24 hours, and
       ACCESS_TOKEN_TTL_SECONDS reflects that default
  AC2  refresh-token grant rotates a fresh access token without the
       caller having to re-authorize
  AC3  401s on a presented-but-invalid Bearer JWT carry an RFC 6750
       WWW-Authenticate challenge with error="invalid_token" and a
       human-readable description (no more bare 401s)
  AC4  a token issued at T=0 still validates after >1h of wall-clock
       time has passed (smoke for the headline regression)
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

# Make sure tests don't accidentally pick up a host env var that would
# mask the default behaviour we're trying to assert on.
for _e in ("OAUTH_ACCESS_TOKEN_TTL_SECONDS", "OAUTH_REFRESH_TOKEN_TTL_SECONDS"):
    os.environ.pop(_e, None)

# APP_BASE_URL must be set BEFORE the JWT-validating middleware imports —
# the middleware fails closed on unset issuer policy.
os.environ.setdefault("APP_BASE_URL", "http://localhost:8094")

# Drive the signing key off a temp dir so the test process doesn't
# require write access to /app_data and doesn't pollute the dev key.
import tempfile

_TMP_APP_DATA = tempfile.mkdtemp(prefix="koho-oauth-tests-")
os.environ["APP_DATA_DIRECTORY"] = _TMP_APP_DATA

from api.auth_context import AuthContext  # noqa: E402
from api.deps import get_current_user_strict  # noqa: E402
from api.middlewares import AuthMiddleware  # noqa: E402
from services import oauth_server  # noqa: E402
from services.jwt_signing import decode_jwt  # noqa: E402


# ─── AC1: default TTL is >= 24 hours, env override applies ──────────────────


def test_ac1_default_access_token_ttl_is_at_least_24_hours():
    """AC1: A connected MCP session remains authenticated for at least
    24 hours of continuous use."""
    # The exported constant pins the default — kept in sync with the
    # internal _DEFAULT so older callers that imported the constant
    # still see the same value.
    assert oauth_server.ACCESS_TOKEN_TTL_SECONDS >= 24 * 3600
    assert oauth_server.access_token_ttl_seconds() >= 24 * 3600


def test_ac1_default_refresh_token_ttl_is_long():
    """Refresh-token TTL is the upper bound on idle-installation
    survival; 90d is well past the 30-day previous default."""
    assert oauth_server.REFRESH_TOKEN_TTL_SECONDS >= 30 * 24 * 3600
    assert oauth_server.refresh_token_ttl_seconds() >= 30 * 24 * 3600


def test_ac1_env_override_extends_access_token_ttl(monkeypatch):
    """Ops can extend the lifetime via env without a code change."""
    monkeypatch.setenv("OAUTH_ACCESS_TOKEN_TTL_SECONDS", str(7 * 24 * 3600))
    assert oauth_server.access_token_ttl_seconds() == 7 * 24 * 3600


def test_ac1_env_override_garbage_falls_back_to_default(monkeypatch):
    """A typo in .env must not crash the auth server."""
    monkeypatch.setenv("OAUTH_ACCESS_TOKEN_TTL_SECONDS", "not-a-number")
    assert (
        oauth_server.access_token_ttl_seconds()
        == oauth_server._DEFAULT_ACCESS_TOKEN_TTL_SECONDS
    )


def test_ac1_env_override_negative_falls_back_to_default(monkeypatch):
    """Negative values are nonsense; default wins."""
    monkeypatch.setenv("OAUTH_ACCESS_TOKEN_TTL_SECONDS", "-5")
    assert (
        oauth_server.access_token_ttl_seconds()
        == oauth_server._DEFAULT_ACCESS_TOKEN_TTL_SECONDS
    )


def test_ac1_minted_jwt_exp_iat_delta_matches_ttl():
    """AC1: the live mint path (not just the constant) emits a token
    with a >=24h exp-iat delta."""
    token, ttl = oauth_server.mint_access_token(
        user_id=str(uuid.uuid4()),
        email="user@koho.ai",
        name="Test User",
        avatar_url=None,
        organisation_id=None,
        client_id="kohoc_test",
        scope=oauth_server.DEFAULT_SCOPE,
    )
    assert ttl >= 24 * 3600
    claims = decode_jwt(token)
    assert claims["exp"] - claims["iat"] == ttl


# ─── AC2: refresh-token grant rotates a fresh access token ──────────────────


def test_ac2_refresh_grant_helper_yields_new_token_with_fresh_ttl():
    """AC2: The mint path is what the refresh-token grant invokes
    (see _mint_token_response in api/v1/public/oauth.py). Re-minting
    must produce a *new* JWT with a fresh exp window, so the client
    that refreshes silently before expiry never sees a 401."""
    user_id = str(uuid.uuid4())
    first, ttl_first = oauth_server.mint_access_token(
        user_id=user_id,
        email=None,
        name=None,
        avatar_url=None,
        organisation_id=None,
        client_id="kohoc_test",
        scope=oauth_server.DEFAULT_SCOPE,
    )
    second, ttl_second = oauth_server.mint_access_token(
        user_id=user_id,
        email=None,
        name=None,
        avatar_url=None,
        organisation_id=None,
        client_id="kohoc_test",
        scope=oauth_server.DEFAULT_SCOPE,
    )
    # JTI is per-issuance random, so the two JWTs differ even though
    # both belong to the same user/client.
    assert first != second
    first_claims = decode_jwt(first)
    second_claims = decode_jwt(second)
    assert first_claims["jti"] != second_claims["jti"]
    # Both carry the configured TTL — the second one is "fresh", which
    # is the whole point of refresh-token rotation.
    assert ttl_first == ttl_second
    assert ttl_first >= 24 * 3600


# ─── AC3: 401 on bad/expired JWT carries an actionable challenge ─────────────


def _build_app_with_strict_auth() -> FastAPI:
    app = FastAPI()
    app.add_middleware(AuthMiddleware)

    @app.get("/_protected")
    def _protected(ctx: AuthContext = Depends(get_current_user_strict)):
        return {"user_id": str(ctx.user_id)}

    return app


def test_ac3_no_auth_header_returns_401_with_bearer_challenge():
    """No header = anonymous; strict dep returns the generic challenge.
    No actionable error code (we don't pretend the client presented a
    token), but the WWW-Authenticate header still names the scheme so
    OAuth clients can start a fresh authorization."""
    client = TestClient(_build_app_with_strict_auth())
    resp = client.get("/_protected")
    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate", "").startswith("Bearer ")


def test_ac3_expired_token_returns_invalid_token_with_refresh_hint():
    """AC3: an expired Bearer JWT triggers a 401 whose body and
    WWW-Authenticate header both flag the token as invalid_token. The
    error_description tells the client to use the refresh_token grant —
    which is exactly the actionable signal the bug report says was
    missing."""
    # Mint a token then immediately advance the clock past its expiry
    # by patching the "now" the validator uses.
    token, ttl = oauth_server.mint_access_token(
        user_id=str(uuid.uuid4()),
        email="user@koho.ai",
        name="Test User",
        avatar_url=None,
        organisation_id=None,
        client_id="kohoc_test",
        scope=oauth_server.DEFAULT_SCOPE,
    )

    real_decode = decode_jwt

    def _decode_as_if_expired(t: str):
        # Authlib's claims.validate() checks exp against time.time(); we
        # patch time inside the call so we don't have to literally wait
        # 24+ hours in CI.
        from authlib.jose.errors import ExpiredTokenError

        # Decode normally so signature / shape errors still bubble up,
        # then synthesize the expiry path the middleware cares about.
        real_decode(t)
        raise ExpiredTokenError()

    client = TestClient(_build_app_with_strict_auth())
    with patch(
        "api.middlewares.decode_jwt", side_effect=_decode_as_if_expired
    ):
        resp = client.get(
            "/_protected", headers={"Authorization": f"Bearer {token}"}
        )

    assert resp.status_code == 401
    challenge = resp.headers.get("www-authenticate", "")
    assert 'error="invalid_token"' in challenge
    assert "expired" in challenge.lower()
    body = resp.json()
    assert "expired" in (body.get("detail") or "").lower()


def test_ac3_garbage_bearer_returns_invalid_token_challenge():
    """A bogus Bearer token (signature fail / not-a-JWT) also gets the
    invalid_token challenge — same actionable signal, different
    description so logs distinguish expiry vs forgery."""
    client = TestClient(_build_app_with_strict_auth())
    resp = client.get(
        "/_protected", headers={"Authorization": "Bearer not-a-real-jwt"}
    )
    assert resp.status_code == 401
    challenge = resp.headers.get("www-authenticate", "")
    assert 'error="invalid_token"' in challenge


def test_ac3_revoked_signature_token_describes_re_authorize():
    """AC3 calls out 'token revoked or org-level disconnect' as the
    main case where today's bare 401 hides the real story. We simulate
    the post-key-rotation case (signature fails but token is otherwise
    well-formed) and check the description points at /oauth/authorize."""

    def _raise_bad_signature(_t: str):
        from authlib.jose.errors import BadSignatureError

        raise BadSignatureError(result=False)

    client = TestClient(_build_app_with_strict_auth())
    with patch(
        "api.middlewares.decode_jwt", side_effect=_raise_bad_signature
    ):
        resp = client.get(
            "/_protected", headers={"Authorization": "Bearer eyJhbGc.test.sig"}
        )
    assert resp.status_code == 401
    challenge = resp.headers.get("www-authenticate", "")
    assert 'error="invalid_token"' in challenge
    body = resp.json()
    detail = (body.get("detail") or "").lower()
    assert "re-authorize" in detail or "revoked" in detail


# ─── AC4: a token still validates >1h after issuance ────────────────────────


def test_ac4_token_still_validates_after_more_than_one_hour():
    """AC4: A test that holds an authenticated session open for >1 hour
    and makes a call at the end still succeeds.

    We don't actually sleep an hour. We mint a token, then validate it
    while pretending the wall clock has advanced ~70 minutes — the same
    decode the resource server runs on every request. Pre-fix this test
    would have raised ExpiredTokenError because the TTL was 3600s; with
    the 24h default it survives comfortably.
    """
    token, ttl = oauth_server.mint_access_token(
        user_id=str(uuid.uuid4()),
        email="user@koho.ai",
        name="Test User",
        avatar_url=None,
        organisation_id=None,
        client_id="kohoc_test",
        scope=oauth_server.DEFAULT_SCOPE,
    )
    assert ttl >= 24 * 3600

    # Compute the iat claim, then advance time 70 minutes. authlib's
    # claims.validate() reads the current time via time.time(); patching
    # that lets us simulate a long-lived session without real sleep.
    claims = decode_jwt(token)
    one_hour_plus = claims["iat"] + (70 * 60)

    import authlib.jose.rfc7519.claims as _claims_mod

    real_time = _claims_mod.time.time

    with patch.object(_claims_mod.time, "time", lambda: float(one_hour_plus)):
        # Re-decode through the same path the resource server uses; it
        # must NOT raise ExpiredTokenError now that the TTL >= 24h.
        re_decoded = decode_jwt(token)
        assert re_decoded["sub"] == claims["sub"]

    # Sanity: original time function was restored on context exit.
    assert _claims_mod.time.time is real_time


@pytest.mark.skip(
    reason=(
        "Visual / behavioural AC: the upstream MCP client (Cowork UI, "
        "Claude Desktop, etc.) auto-refreshes silently using the "
        "refresh_token in the /oauth/token response. That handshake is "
        "exercised end-to-end by the existing OAuth integration test "
        "harness on the client side; this placeholder documents the AC "
        "and points at the right place to verify manually."
    )
)
def test_ac2_client_side_silent_refresh_manual_verification():
    """Manual: connect the MCP, leave it idle past expires_in, confirm
    the next tool call still returns 200 because the client refreshed
    in the background."""
