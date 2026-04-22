"""
AuthContext — per-request identity for the FastAPI backend.

Populated by `AuthMiddleware` in middlewares.py, consumed by the
`get_current_user` dependency in api/deps.py. Kept in its own module
to avoid circular imports between middlewares, deps, and DB code.
"""

from dataclasses import dataclass
from typing import Optional
import uuid


@dataclass
class AuthContext:
    user_id: Optional[uuid.UUID]
    organisation_id: Optional[uuid.UUID]
    email: Optional[str]
    name: Optional[str]
    avatar_url: Optional[str]
    # True when the caller is the in-container Puppeteer render path
    # (export-as-pdf / presentation_to_pptx_model) that authenticated via
    # the X-Koho-Internal-Token header. Such callers have no user/org,
    # but get VIEWER access to any deck so they can render it.
    is_internal_render: bool = False
    # True when the caller authenticated via a personal access token
    # (X-Koho-Api-Token) rather than a browser session cookie. PAT-auth
    # is deliberately excluded from PAT-management endpoints so a leaked
    # token cannot mint more tokens or revoke existing ones.
    is_pat_authenticated: bool = False

    @property
    def is_authenticated(self) -> bool:
        return self.user_id is not None or self.is_internal_render


ANONYMOUS = AuthContext(
    user_id=None,
    organisation_id=None,
    email=None,
    name=None,
    avatar_url=None,
)

INTERNAL_RENDER = AuthContext(
    user_id=None,
    organisation_id=None,
    email=None,
    name=None,
    avatar_url=None,
    is_internal_render=True,
)
