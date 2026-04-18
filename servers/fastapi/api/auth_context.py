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

    @property
    def is_authenticated(self) -> bool:
        return self.user_id is not None


ANONYMOUS = AuthContext(
    user_id=None,
    organisation_id=None,
    email=None,
    name=None,
    avatar_url=None,
)
