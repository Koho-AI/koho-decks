import sys
import argparse
import asyncio
import json
import logging
import traceback
from contextvars import ContextVar
from typing import Optional

import httpx
from fastmcp import FastMCP
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware import Middleware as ASGIMiddleware
from starlette.requests import Request


log = logging.getLogger(__name__)

with open("openai_spec.json", "r") as f:
    openapi_spec = json.load(f)


# Per-request PAT, set by BearerTokenMiddleware on every inbound MCP HTTP
# request and read by the httpx event hook when the MCP server forwards the
# translated tool call to FastAPI. Starlette spawns a fresh asyncio task per
# HTTP request, so contextvars isolate naturally — a concurrent request on
# a different task cannot see another request's token.
_current_mcp_token: ContextVar[Optional[str]] = ContextVar(
    "mcp_token", default=None
)


class BearerTokenMiddleware(BaseHTTPMiddleware):
    """Extract Authorization: Bearer <pat> from the MCP HTTP request and
    stash it in the contextvar for the duration of the request. Uses
    token.reset() on the way out to guarantee cleanup even if the handler
    raises."""

    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("authorization") or ""
        prefix = "Bearer "
        token = (
            auth_header[len(prefix):].strip()
            if auth_header.startswith(prefix)
            else None
        )
        cv_token = _current_mcp_token.set(token or None)
        try:
            return await call_next(request)
        finally:
            _current_mcp_token.reset(cv_token)


async def _inject_pat_header(request: httpx.Request) -> None:
    """httpx request event hook — translate the in-flight contextvar PAT
    to the X-Koho-Api-Token header on every outbound call to FastAPI.
    Defensive None-check: if the contextvar is unset (e.g. no bearer on
    the original MCP request) we leave the header off entirely and
    FastAPI falls through to ANONYMOUS."""
    pat = _current_mcp_token.get()
    if pat:
        request.headers["X-Koho-Api-Token"] = pat


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

        # One shared httpx client is fine: the request hook reads the
        # per-task contextvar, so concurrent MCP tool calls get their
        # own tokens without cross-contamination.
        api_client = httpx.AsyncClient(
            base_url="http://127.0.0.1:8000",
            timeout=60.0,
            event_hooks={"request": [_inject_pat_header]},
        )

        # Build MCP server from OpenAPI
        print("DEBUG: Creating FastMCP server from OpenAPI spec...")
        mcp = FastMCP.from_openapi(
            openapi_spec=openapi_spec,
            client=api_client,
            name=args.name,
        )
        print("DEBUG: MCP server created from OpenAPI successfully")

        # Start the MCP server
        uvicorn_config = {"reload": True}
        print(f"DEBUG: Starting MCP server on host=127.0.0.1, port={args.port}")
        await mcp.run_http_async(
            transport="http",
            host="127.0.0.1",
            port=args.port,
            uvicorn_config=uvicorn_config,
            middleware=[ASGIMiddleware(BearerTokenMiddleware)],
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
