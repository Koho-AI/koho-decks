import sys
import argparse
import asyncio
import logging
import os
import time
import traceback
from contextvars import ContextVar
from typing import Any, Optional

import httpx
from fastmcp import FastMCP
from fastmcp.server.auth.providers.jwt import JWTVerifier


log = logging.getLogger(__name__)


# Whitelist of FastAPI operationIds to expose as MCP tools. FastAPI auto-
# generates operationIds as "{function_name}_{route_path_underscored}_{method}",
# which is unwieldy — the EXPOSED_TOOL_NAMES mapping below renames each one
# to a short, human-friendly MCP tool name.
#
# Any new FastAPI endpoint is NOT exposed as an MCP tool by default. To
# expose something new, add its operationId here and pick a tool name.
# Entries that no longer match a live operationId are silently dropped —
# no crash, just a WARNING log at startup.
EXPOSED_TOOL_NAMES: dict[str, str] = {
    # ── Deck CRUD + generation ────────────────────────────────────────
    "get_all_presentations_api_v1_ppt_presentation_all_get": "list_presentations",
    "get_presentation_api_v1_ppt_presentation__id__get": "get_presentation",
    "delete_presentation_api_v1_ppt_presentation__id__delete": "delete_presentation",
    "create_presentation_api_v1_ppt_presentation_create_post": "create_presentation",
    "generate_presentation_sync_api_v1_ppt_presentation_generate_post": "generate_presentation",
    "generate_presentation_async_api_v1_ppt_presentation_generate_async_post": "generate_presentation_async",
    "check_async_presentation_generation_status_api_v1_ppt_presentation_status__id__get": "check_generation_status",
    "update_presentation_api_v1_ppt_presentation_update_patch": "update_presentation",
    "edit_presentation_with_new_content_api_v1_ppt_presentation_edit_post": "edit_presentation",
    "derive_presentation_from_existing_one_api_v1_ppt_presentation_derive_post": "derive_presentation",
    "export_presentation_as_pptx_or_pdf_api_v1_ppt_presentation_export_post": "export_presentation",
    # ── Slide-level editing ───────────────────────────────────────────
    "edit_slide_api_v1_ppt_slide_edit_post": "edit_slide",
    "edit_slide_html_api_v1_ppt_slide_edit_html_post": "edit_slide_html",
    # ── Sharing + collaborators ──────────────────────────────────────
    "invite_collaborator_api_v1_ppt_sharing_invite_post": "invite_collaborator",
    "list_collaborators_api_v1_ppt_sharing_collaborators__presentation_id__get": "list_collaborators",
    "revoke_collaborator_api_v1_ppt_sharing_collaborator__collaborator_id__delete": "revoke_collaborator",
    "shared_with_me_api_v1_ppt_sharing_shared_with_me_get": "shared_with_me",
    "create_share_link_api_v1_ppt_share_links_post": "create_share_link",
    "list_share_links_api_v1_ppt_share_links__presentation_id__get": "list_share_links",
    "revoke_share_link_api_v1_ppt_share_links__link_id__delete": "revoke_share_link",
    # ── Templates + themes + self ────────────────────────────────────
    "get_presentations_summary_api_v1_ppt_template_management_summary_get": "list_templates",
    "get_default_themes_api_v1_ppt_themes_default_get": "list_default_themes",
    "get_themes_api_v1_ppt_themes_all_get": "list_themes",
    "get_me_api_v1_ppt_me_get": "get_me",
}


# Parameters on create/generate endpoints that take *server-side*
# filesystem paths. Useful for the Next.js upload flow (which can write
# to the shared volume first) but nonsense for remote MCP clients, who
# have no way to place a file at `/app_data/uploads/...`. We strip them
# from the MCP surface so LLM callers don't hallucinate paths.
_SERVER_ONLY_PARAM_NAMES: frozenset[str] = frozenset({"file_paths", "files"})


def _scrub_schema_props(schema: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of `schema` with server-only property names removed
    from `properties` and `required`. Handles the two shapes FastAPI
    emits: an inline object schema OR a schema that references a
    component via $ref (the caller handles $ref resolution)."""
    props = schema.get("properties")
    if not isinstance(props, dict):
        return schema
    removed = _SERVER_ONLY_PARAM_NAMES & props.keys()
    if not removed:
        return schema
    new_props = {k: v for k, v in props.items() if k not in removed}
    new_required = [r for r in (schema.get("required") or []) if r not in removed]
    new_schema = {**schema, "properties": new_props}
    if new_required:
        new_schema["required"] = new_required
    else:
        new_schema.pop("required", None)
    return new_schema


def _scrub_server_only_params(operation: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of `operation` with server-only fields removed from
    the inline request-body schema. For $ref-shaped bodies the actual
    scrubbing happens in _scrub_components — this function is a no-op
    in that case. Leaves query/path params and the underlying REST
    endpoint untouched — only the MCP tool signature is affected."""
    request_body = operation.get("requestBody")
    if not isinstance(request_body, dict):
        return operation
    content = request_body.get("content")
    if not isinstance(content, dict):
        return operation

    scrubbed_content: dict[str, Any] = {}
    changed = False
    for media_type, media in content.items():
        if not isinstance(media, dict):
            scrubbed_content[media_type] = media
            continue
        schema = media.get("schema")
        if not isinstance(schema, dict):
            scrubbed_content[media_type] = media
            continue
        new_schema = _scrub_schema_props(schema)
        if new_schema is not schema:
            changed = True
            scrubbed_content[media_type] = {**media, "schema": new_schema}
        else:
            scrubbed_content[media_type] = media

    if not changed:
        return operation
    new_body = {**request_body, "content": scrubbed_content}
    return {**operation, "requestBody": new_body}


def _scrub_components(components: dict[str, Any]) -> dict[str, Any]:
    """Strip server-only property names from every component schema.
    FastAPI emits a `Body_<op>` component for routes with multiple
    individual `Body()` params, and a named Pydantic-model component
    for routes that take a request model — both shapes route through
    `properties` here. Scrubbing is safe because the filtered spec
    only retains operations we've whitelisted, so every reachable
    component is an MCP tool's input."""
    schemas = components.get("schemas")
    if not isinstance(schemas, dict):
        return components
    scrubbed = {name: _scrub_schema_props(s) if isinstance(s, dict) else s
                for name, s in schemas.items()}
    return {**components, "schemas": scrubbed}


def _filter_openapi_spec(spec: dict[str, Any]) -> dict[str, Any]:
    """Return a minimal OpenAPI dict containing only whitelisted operations.

    Components (schemas) are copied wholesale because paths reference them
    by $ref — trimming unused schemas would require transitive resolution
    that buys little in return. A WARNING is logged for any whitelisted
    operationId that doesn't appear in the live spec (typically means an
    endpoint was renamed or removed and the whitelist is stale).

    Server-only request-body fields (see _SERVER_ONLY_PARAM_NAMES) are
    stripped so MCP clients don't see parameters they can't meaningfully
    use."""
    kept_paths: dict[str, Any] = {}
    seen_ids: set[str] = set()

    for path, methods in (spec.get("paths") or {}).items():
        if not isinstance(methods, dict):
            continue
        kept_methods: dict[str, Any] = {}
        for method, operation in methods.items():
            if not isinstance(operation, dict):
                continue
            op_id = operation.get("operationId")
            if not op_id or op_id not in EXPOSED_TOOL_NAMES:
                continue
            kept_methods[method] = _scrub_server_only_params(operation)
            seen_ids.add(op_id)
        if kept_methods:
            kept_paths[path] = kept_methods

    missing = set(EXPOSED_TOOL_NAMES) - seen_ids
    if missing:
        log.warning(
            "mcp: %d whitelisted operationId(s) not found in live OpenAPI — "
            "likely renamed or removed: %s",
            len(missing),
            sorted(missing),
        )

    return {
        "openapi": spec.get("openapi", "3.1.0"),
        "info": spec.get("info", {"title": "Koho Decks", "version": "1.0.0"}),
        "paths": kept_paths,
        "components": _scrub_components(spec.get("components") or {}),
    }


def _fetch_live_openapi(internal_url: str) -> dict[str, Any]:
    """Fetch FastAPI's live OpenAPI at startup. FastAPI and MCP are
    spawned in parallel by start.js, so MCP has to tolerate FastAPI
    being temporarily unreachable. FastAPI's startup includes Alembic
    migrations which can easily stretch past 30s on a cold container,
    so the retry budget is generous — 3 minutes total.

    start.js does NOT supervise the MCP process, so if we give up and
    raise here the MCP HTTP server never comes online and the only
    symptom is nginx serving 502 on /mcp forever. Retrying for longer
    is strictly better than crashing: the container's own healthcheck
    (on FastAPI, port 8000) will fail the deploy anyway if FastAPI
    never comes up."""
    url = f"{internal_url}/openapi.json"
    max_attempts = 90  # 90 × 2s = 3 minutes
    last_err: Optional[Exception] = None
    for attempt in range(1, max_attempts + 1):
        try:
            resp = httpx.get(url, timeout=5.0)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            last_err = exc
            log.info(
                "mcp: waiting for FastAPI OpenAPI at %s (attempt %d/%d): %s",
                url,
                attempt,
                max_attempts,
                exc,
            )
            time.sleep(2)
    raise RuntimeError(
        f"Could not fetch {url} after {max_attempts} attempts: {last_err}"
    )


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
        # `base_url` is the origin FastMCP uses when constructing the
        # resource-metadata URL it advertises in WWW-Authenticate on 401.
        # It appends the MCP mount path itself — passing the origin WITHOUT
        # /mcp avoids the double-path-segment bug (/.well-known/oauth-
        # protected-resource/mcp/mcp) that earlier attempts produced.
        auth = JWTVerifier(
            jwks_uri=jwks_uri,
            issuer=app_base_url,
            audience=app_base_url,
            base_url=app_base_url,
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

        print("DEBUG: Fetching live FastAPI OpenAPI + filtering to whitelist...")
        live_spec = _fetch_live_openapi(fastapi_internal)
        filtered_spec = _filter_openapi_spec(live_spec)
        n_tools = sum(
            1
            for methods in filtered_spec["paths"].values()
            for op in methods.values()
            if isinstance(op, dict)
        )
        print(f"DEBUG: Exposing {n_tools} whitelisted MCP tool(s)")

        print("DEBUG: Creating FastMCP server from OpenAPI spec...")
        mcp = FastMCP.from_openapi(
            openapi_spec=filtered_spec,
            client=api_client,
            name=args.name,
            auth=auth,
            mcp_names=EXPOSED_TOOL_NAMES,
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

        print(f"DEBUG: Starting MCP server on host=127.0.0.1, port={args.port}")
        await mcp.run_http_async(
            transport="http",
            host="127.0.0.1",
            port=args.port,
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
