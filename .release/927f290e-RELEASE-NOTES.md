## MCP session tokens now last 24 hours and fail with actionable errors

MCP clients connected to decks.koho.ai were receiving `401 Unauthorized` errors after roughly one hour of use, forcing users to manually reconnect from the Cowork UI before continuing multi-step agent workflows such as slide-by-slide deck reviews, iterative generation cycles, or any flow with human-in-the-loop pauses. The root cause was a 1-hour access-token lifetime that most MCP clients do not silently refresh. This release extends the default access-token lifetime to **24 hours** and the refresh-token lifetime to **90 days**, so a connected MCP installation stays usable throughout a full working day. When a client does use the refresh-token grant, the installation stays live effectively indefinitely until the user explicitly disconnects. In addition, when a token does expire or fail validation, the server now returns a structured `WWW-Authenticate` challenge — `error="invalid_token"` with a human-readable description pointing at the refresh or re-authorization endpoint — instead of the previous silent bare 401.

### New configuration options

Both token lifetimes are configurable via environment variables. The new defaults apply automatically on deployment — no `.env` change is required for standard installations.

| Variable | Default | Description |
|---|---|---|
| `OAUTH_ACCESS_TOKEN_TTL_SECONDS` | `86400` (24 hours) | Lifetime of JWT access tokens issued by `/oauth/token`. Accepts any positive integer; non-numeric or non-positive values fall back to the default with a logged warning. |
| `OAUTH_REFRESH_TOKEN_TTL_SECONDS` | `7776000` (90 days) | Maximum idle lifetime of refresh tokens. Refresh tokens rotate on every use, so an actively-used MCP installation automatically resets this window. |

### Changes to existing behavior

- **All newly issued access tokens carry a 24-hour `expires_in`**, up from 1 hour. Access tokens issued before this release remain valid for their original 1-hour window and are not affected.
- **All newly issued refresh tokens carry a 90-day expiry**, up from 30 days. Existing refresh tokens in the database retain their stored `expires_at`.
- **`401 Unauthorized` responses on auth-gated endpoints now include a `WWW-Authenticate` header** with an RFC 6750 Bearer challenge. Previously these responses carried no `WWW-Authenticate` header. Responses that rejected a presented Bearer token additionally carry `error="invalid_token"` and a human-readable `error_description`.

### Deprecations

None.
