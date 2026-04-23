"""
/.well-known/ discovery endpoints.

Mounted at the origin root (not under /api/v1/) per RFC 8414 / RFC 9728 /
RFC 7517. Added here even though the `public` package name suggests
/api/v1/public/* because these endpoints form a cohesive group with the
other public (unauthenticated) endpoints.

Registered in api/main.py directly on `app` (no prefix) alongside other
origin-root mounts. nginx.conf forwards /.well-known/* to the FastAPI
upstream so these are reachable publicly.
"""

from fastapi import APIRouter, Response

from services.jwt_signing import get_jwks
from services.oauth_server import (
    authorization_server_metadata,
    protected_resource_metadata,
)


WELL_KNOWN_ROUTER = APIRouter(tags=["WellKnown"])


@WELL_KNOWN_ROUTER.get("/.well-known/jwks.json")
async def jwks(response: Response) -> dict:
    # Public key material — safe to cache aggressively. Clients (including
    # our own MCP server's JWTVerifier) cache JWKS for ~1 hour by default.
    response.headers["Cache-Control"] = "public, max-age=3600"
    return get_jwks()


@WELL_KNOWN_ROUTER.get("/.well-known/oauth-authorization-server")
async def oauth_as_metadata(response: Response) -> dict:
    # RFC 8414. MCP clients hit this first to discover AS endpoints.
    response.headers["Cache-Control"] = "public, max-age=3600"
    return authorization_server_metadata()


@WELL_KNOWN_ROUTER.get("/.well-known/oauth-protected-resource")
@WELL_KNOWN_ROUTER.get("/.well-known/oauth-protected-resource/{rest:path}")
async def oauth_protected_resource_metadata(response: Response) -> dict:
    # RFC 9728. FastMCP scopes the resource metadata URL by the MCP
    # mount path (e.g. /.well-known/oauth-protected-resource/mcp), which
    # it advertises in the WWW-Authenticate header on 401. Serving the
    # same document at both the bare path and any sub-path ensures
    # whichever URL FastMCP picks resolves. The document itself points
    # to the same protected resource (APP_BASE_URL/mcp) regardless of
    # which discovery path landed the client here.
    response.headers["Cache-Control"] = "public, max-age=3600"
    return protected_resource_metadata()
