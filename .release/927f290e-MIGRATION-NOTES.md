## Migration notes — 927f290e

### Database schema changes

None. No new tables, altered columns, or indexes are introduced by this change.

### Configuration changes

Two optional environment variables are introduced. Neither is required — the application falls back to the new defaults when they are absent.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `OAUTH_ACCESS_TOKEN_TTL_SECONDS` | No | `86400` (24 h) | Accepts any positive integer; non-numeric or non-positive values log a warning and use the default. |
| `OAUTH_REFRESH_TOKEN_TTL_SECONDS` | No | `7776000` (90 d) | Accepts any positive integer; same fallback behavior. |

**Standard Docker Compose deployments:** both variables are already wired in `docker-compose.yml` and will pass through from the host environment. No `.env` changes are required to get the new defaults. To pin a custom value, add the variable to your `.env` file and restart the stack (`docker compose up -d`).

**Production VPS (decks.koho.ai):** `deploy/env.template` does not yet include these variables; the defaults apply automatically on the next deploy. To override, add the line manually to `/home/decks/app/.env` on the VPS before restarting (`just service-restart`).

### API endpoint changes

No endpoints are added, removed, or renamed. The behavior change is limited to response headers on existing endpoints:

- All `401 Unauthorized` responses from auth-gated endpoints now include a `WWW-Authenticate: Bearer realm="koho-decks"` header.
- When a Bearer token was presented and rejected, the header additionally carries `error="invalid_token"` and `error_description`. The description for an expired token instructs the client to use the `refresh_token` grant at `/oauth/token`; the description for a signature or claim failure instructs the client to re-authorize via `/oauth/authorize`.

Client code that checks `response.headers["WWW-Authenticate"]` should handle this new header without issues. Client code that fails on unexpected response headers should be reviewed before upgrading.

### Dependency changes

None. No package versions changed.

### Required environment variable changes

None. The deployment is fully functional without any `.env` changes.

### Migration steps

No migration steps required for this change.
