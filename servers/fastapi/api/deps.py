"""
FastAPI dependencies for auth.

`get_current_user` returns the AuthContext populated by AuthMiddleware.
Two flavours:
- `get_current_user` — returns AuthContext unconditionally (may be
  ANONYMOUS).
- `get_current_user_strict` — raises 401 if the caller is not
  authenticated. Use on endpoints that must be auth-gated.

When a Bearer JWT was presented but rejected, AuthMiddleware records an
RFC 6750 error code + description on `request.state.auth_error`. The
strict dependency reads that to emit an actionable WWW-Authenticate
header so OAuth clients know whether to refresh, re-authorize, or treat
the 401 as a hard failure. This is the difference the MCP debrief was
asking for: a bare 401 on token expiry left clients silent; an
`error="invalid_token", error_description="The access token expired..."`
response gives them something to act on.
"""

from fastapi import Depends, HTTPException, Request, status

from api.auth_context import ANONYMOUS, AuthContext


def get_current_user(request: Request) -> AuthContext:
    ctx = getattr(request.state, "auth", None)
    if ctx is None:
        return ANONYMOUS
    return ctx


def _www_authenticate_header(error: str | None, description: str | None) -> str:
    """Build an RFC 6750 §3 challenge string. The `realm` is fixed; we
    don't expose internal scope names here so the header stays useful
    to general OAuth clients without leaking provisioning detail."""
    parts = ['Bearer realm="koho-decks"']
    if error:
        # Quote-stuff conservatively: descriptions go through user-facing
        # log lines so we already constrain them to ASCII; still strip
        # double-quotes defensively.
        parts.append(f'error="{error}"')
        if description:
            safe = description.replace('"', "'")
            parts.append(f'error_description="{safe}"')
    return ", ".join(parts)


def get_current_user_strict(
    request: Request,
    ctx: AuthContext = Depends(get_current_user),
) -> AuthContext:
    if not ctx.is_authenticated:
        err = getattr(request.state, "auth_error", None)
        if err:
            error_code, description = err
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=description,
                headers={
                    "WWW-Authenticate": _www_authenticate_header(
                        error_code, description
                    )
                },
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": _www_authenticate_header(None, None)},
        )
    return ctx
