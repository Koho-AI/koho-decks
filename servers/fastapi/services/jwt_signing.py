"""
JWT signing + verification for the OAuth authorization server.

A single RS256 RSA-2048 key lives at $APP_DATA_DIRECTORY/oauth/signing-key.pem
and is generated on first use. The key survives container rebuilds because
$APP_DATA_DIRECTORY is bind-mounted from the host (see docker-compose.yml).

Rotating the key invalidates every outstanding access token. To rotate:
delete the PEM + restart — all users will need to re-enroll their MCP
clients via the OAuth flow. No revocation work is needed because the
JWTs themselves become unverifiable.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

from authlib.jose import JsonWebToken, RSAKey


log = logging.getLogger(__name__)

_SIGNING_ALG = "RS256"
_codec = JsonWebToken([_SIGNING_ALG])

# Process-wide lazy singletons.
_private_key: RSAKey | None = None
# Public-only key used for signature verification. Derived from the private
# key once at load time so we never pass private material through the
# decode path (defence-in-depth against library regressions).
_public_key: RSAKey | None = None
_kid: str | None = None


def _key_path() -> Path:
    base = os.getenv("APP_DATA_DIRECTORY") or "/app_data"
    return Path(base) / "oauth" / "signing-key.pem"


def _ensure_loaded() -> None:
    global _private_key, _public_key, _kid
    if _private_key is not None:
        return

    path = _key_path()
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)

    if path.exists():
        key = RSAKey.import_key(path.read_bytes())
        log.info("Loaded OAuth signing key from %s", path)
    else:
        key = RSAKey.generate_key(key_size=2048, is_private=True)
        pem_bytes = key.as_pem(is_private=True)
        path.write_bytes(pem_bytes)
        path.chmod(0o600)
        log.warning(
            "Generated new OAuth signing key at %s. "
            "All outstanding JWTs are now invalid.",
            path,
        )

    _private_key = key
    # Derive a public-only view of the same key for verification. Reusing
    # the same RSAKey object for both sign and decode is fine in authlib
    # today, but keeping a public-only handle means any accidental code
    # path that asks for `.private_numbers()` on _public_key will raise.
    _public_key = RSAKey.import_key(key.as_pem(is_private=False))
    # JWK thumbprint (RFC 7638) is stable across loads of the same key.
    # Keep it short — we only have one key and `kid` is cosmetic here.
    thumb = key.thumbprint()
    _kid = thumb if isinstance(thumb, str) else thumb.decode("ascii")
    _kid = _kid[:16]


def current_kid() -> str:
    _ensure_loaded()
    assert _kid is not None
    return _kid


def sign_jwt(claims: dict[str, Any]) -> str:
    """Sign an RS256 JWT. Caller is responsible for adding iss/aud/exp/iat claims."""
    _ensure_loaded()
    assert _private_key is not None
    header = {"alg": _SIGNING_ALG, "typ": "JWT", "kid": current_kid()}
    token_bytes = _codec.encode(header, claims, _private_key)
    if isinstance(token_bytes, bytes):
        return token_bytes.decode("ascii")
    return token_bytes


def decode_jwt(token: str) -> dict[str, Any]:
    """Verify signature + return claims. Raises on bad signature or malformed token.

    The caller is responsible for validating issuer / audience / expiry
    against its own policy by inspecting the returned claims.
    """
    _ensure_loaded()
    assert _public_key is not None
    claims = _codec.decode(token, _public_key)
    claims.validate()  # validates exp/nbf/iat timestamps
    return dict(claims)


def get_jwks() -> dict[str, Any]:
    """Public JWKS document to be served at /.well-known/jwks.json."""
    _ensure_loaded()
    assert _private_key is not None
    public_jwk = _private_key.as_dict(is_private=False)
    public_jwk["kid"] = current_kid()
    public_jwk["alg"] = _SIGNING_ALG
    public_jwk["use"] = "sig"
    return {"keys": [public_jwk]}
