"""Shared helper for FastAPI → Next.js internal service calls.

Both the export flow (`utils/export_utils.py`) and the async generation
worker's layout fetch (`utils/get_layout_by_name.py`) need to call
Next.js routes that NextAuth's middleware gates behind a session
cookie. Since FastAPI has no session to present, it instead attaches a
shared secret the Next.js side recognises (see
`servers/nextjs/lib/auth.ts` — the `authorized` callback's
internal-render token escape hatch).

The same env var (`INTERNAL_RENDER_TOKEN`) feeds FastAPI's own
`AuthMiddleware._is_internal_render_request` — so one secret is trusted
in both directions.
"""

import os


INTERNAL_RENDER_HEADER = "X-Koho-Internal-Token"


def internal_render_headers() -> dict[str, str]:
    """Return an HTTP header dict carrying the internal-render token,
    or an empty dict when the env var is unset. Empty-dict fallback
    fails closed: a request without the header is indistinguishable
    from any other unauth caller on the Next.js side."""
    token = os.getenv("INTERNAL_RENDER_TOKEN", "").strip()
    return {INTERNAL_RENDER_HEADER: token} if token else {}
