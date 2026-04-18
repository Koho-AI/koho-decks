"""
FastAPI dependencies for auth.

`get_current_user` returns the AuthContext populated by AuthMiddleware.
Two flavours:
- `get_current_user` — returns AuthContext unconditionally (may be
  ANONYMOUS).
- `get_current_user_strict` — raises 401 if the caller is not
  authenticated. Use on endpoints that must be auth-gated.
"""

from fastapi import Depends, HTTPException, Request, status

from api.auth_context import ANONYMOUS, AuthContext


def get_current_user(request: Request) -> AuthContext:
    ctx = getattr(request.state, "auth", None)
    if ctx is None:
        return ANONYMOUS
    return ctx


def get_current_user_strict(
    ctx: AuthContext = Depends(get_current_user),
) -> AuthContext:
    if not ctx.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return ctx
