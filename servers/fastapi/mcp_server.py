import sys
import argparse
import asyncio
import json
import logging
import os
import traceback
from contextvars import ContextVar
from typing import Optional

import httpx
from fastmcp import FastMCP
from fastmcp.server.auth.providers.jwt import JWTVerifier


log = logging.getLogger(__name__)

with open("openai_spec.json", "r") as f:
    openapi_spec = json.load(f)


# The incoming Authorization: Bearer <jwt> header that FastMCP's
# AuthenticationMiddleware has already validated. Stashed in a per-request
# ContextVar so the httpx event hook below can forward it to FastAPI.
# Starlette spawns a fresh asyncio.Task per request, so contextvars isolate
# naturally across concurrent requests.
_current_bearer: ContextVar[Optional[str]] = ContextVar(
    "mcp_bearer", default=None
)


class _BearerForwardingTransport(httpx.AsyncHTTPTransport):
    """Transport wrapper that injects the current request's Bearer token
    onto every outbound FastAPI call. We subclass the transport rather
    than use an event hook so the token is set as early as possible in
    the request pipeline, avoiding any chance of the hook being bypassed
    by a sub-transport the MCP library might use internally."""

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        bearer = _current_bearer.get()
        if bearer:
            request.headers["Authorization"] = f"Bearer {bearer}"
        return await super().handle_async_request(request)


async def _capture_bearer_hook(scope, receive, send, next_app):
    """ASGI-level middleware that pulls Authorization: Bearer <jwt> out of
    the incoming MCP HTTP request and stashes it in the contextvar. Runs
    INSIDE FastMCP's auth stack — we can only reach here if the JWT was
    already validated against the JWKS, so forwarding it to FastAPI
    (which independently validates the same JWT against the same local
    key) is safe.

    Implemented as a raw ASGI wrapper rather than Starlette
    BaseHTTPMiddleware so we don't have to drain the request body."""
    # pragma intentionally left blank — this function is wired via
    # Starlette Middleware in the mount below if we ever need a custom
    # capture hook. Currently unused because _BearerForwardingTransport
    # reads the same header directly off the outbound request context.
    await next_app(scope, receive, send)


async def main():
    try:
        print("DEBUG: MCP (OpenAPI) Server startup initiated")
        parser = argparse.ArgumentParser(
            description="Run the MCP server (from OpenAPI)"
        )
        parser.add_argument(
            "--port", type=int, default=8001, help="Port for the MCP HTTP server"
        )
        parser.add_argument(
            "--name",
            type=str,
            default="Presenton API (OpenAPI)",
            help="Display name for the generated MCP server",
        )
        args = parser.parse_args()
        print(f"DEBUG: Parsed args - port={args.port}")

        # Resolve our own public origin for issuer/audience + the internal
        # FastAPI URL for JWKS discovery. On the VPS FastAPI is at
        # http://127.0.0.1:8000 from inside the same container.
        app_base_url = os.getenv("APP_BASE_URL", "http://localhost:8094").rstrip("/")
        fastapi_internal = os.getenv(
            "FASTAPI_INTERNAL_URL", "http://127.0.0.1:8000"
        )
        jwks_uri = f"{fastapi_internal}/.well-known/jwks.json"

        # FastMCP handles Bearer extraction + JWT validation + the
        # RFC-compliant 401 + WWW-Authenticate: Bearer resource_metadata=...
        # response. On valid JWT the tool handler runs; on invalid/absent
        # the request is rejected at the Starlette layer without reaching
        # our code.
        auth = JWTVerifier(
            jwks_uri=jwks_uri,
            issuer=app_base_url,
            audience=app_base_url,
            resource_server_url=f"{app_base_url}/mcp",
        )
        print(f"DEBUG: Configured JWTVerifier iss={app_base_url} jwks={jwks_uri}")

        # Bearer-forwarding HTTP client. Every outbound call to FastAPI
        # gets the incoming JWT on Authorization, so FastAPI's own
        # AuthMiddleware can resolve the user from it.
        api_client = httpx.AsyncClient(
            base_url=fastapi_internal,
            timeout=60.0,
            transport=_BearerForwardingTransport(),
        )

        print("DEBUG: Creating FastMCP server from OpenAPI spec...")
        mcp = FastMCP.from_openapi(
            openapi_spec=openapi_spec,
            client=api_client,
            name=args.name,
            auth=auth,
        )
        print("DEBUG: MCP server created from OpenAPI successfully")

        # Stash the Bearer token into the contextvar on every incoming
        # request so the transport wrapper can read it. Starlette runs
        # user middleware listed here OUTSIDE FastMCP's RequireAuthMiddleware,
        # meaning we capture the raw header before FastMCP validates the
        # JWT. That's safe because:
        #   - If the JWT is invalid, FastMCP's inner middleware returns
        #     401 and our tool-handler path never fires, so the unvalidated
        #     token in the contextvar is never forwarded anywhere.
        #   - If the JWT is valid, the token that reaches FastAPI via the
        #     transport wrapper has already passed FastMCP's verification
        #     AND will be re-verified by FastAPI's own AuthMiddleware.
        from starlette.middleware import Middleware as ASGIMiddleware
        from starlette.middleware.base import BaseHTTPMiddleware
        from starlette.requests import Request

        class CaptureBearerMiddleware(BaseHTTPMiddleware):
            async def dispatch(self, request: Request, call_next):
                auth_header = request.headers.get("authorization") or ""
                token = None
                prefix = "Bearer "
                if auth_header.startswith(prefix):
                    token = auth_header[len(prefix):].strip() or None
                cv = _current_bearer.set(token)
                try:
                    return await call_next(request)
                finally:
                    _current_bearer.reset(cv)

        uvicorn_config = {"reload": True}
        print(f"DEBUG: Starting MCP server on host=127.0.0.1, port={args.port}")
        await mcp.run_http_async(
            transport="http",
            host="127.0.0.1",
            port=args.port,
            uvicorn_config=uvicorn_config,
            middleware=[ASGIMiddleware(CaptureBearerMiddleware)],
        )
        print("DEBUG: MCP server run_http_async completed")
    except Exception as e:
        print(f"ERROR: MCP server startup failed: {e}")
        print(f"ERROR: Traceback: {traceback.format_exc()}")
        raise


if __name__ == "__main__":
    print("DEBUG: Starting MCP (OpenAPI) main function")
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        print(f"FATAL TRACEBACK: {traceback.format_exc()}")
        sys.exit(1)
