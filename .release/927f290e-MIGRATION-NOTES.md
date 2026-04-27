## Migration notes — 927f290e

### Database schema changes

None. No new tables, altered columns, or indexes are introduced by this change.

### Configuration changes

Two optional environment variables are introduced. Neither is required — the application falls back to the new defaults when they are absent.

| Variable | Required | Default |
|---|---|---|
| `OAUTH_ACCESS_TOKEN_TTL_SECONDS` | No | `86400` |
| `OAUTH_REFRESH_TOKEN_TTL_SECONDS` | No | `7776000` |

**Standard Docker Compose deployments:** the variables are already wired in `docker-compose.yml`. To override them, add them to your `.env` file before restarting the container.

**Production VPS (decks.koho.ai):** the `deploy/env.template` does not yet include these variables, so the defaults take effect automatically on the next deploy. To pin a custom value, add the line manually to `/home/decks/app/.env` on the VPS and restart the service (`just service-restart`).

### API endpoint changes

No endpoints are added, removed, or renamed. The behavior change is limited to response headers:

- `401` responses from any auth-gated endpoint now include a `WWW-Authenticate: Bearer realm="koho-decks"` header. When a Bearer token was presented and rejected, the header additionally contains `error="invalid_token"` and `error_description`. Client code that checks `response.headers["WWW-Authenticate"]` should handle this new header without issues; code that fails on unexpected headers should be reviewed.

### Dependency changes

None. No package versions changed.

### Required environment variable changes

None required. The deployment functions identically without any `.env` changes.

### Migration steps

No migration steps required for this change.
