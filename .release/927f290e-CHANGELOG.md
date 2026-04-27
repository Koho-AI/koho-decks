## [927f290e] Fix aggressively short MCP session token lifetime

### Fixed

- OAuth access tokens issued by the Presenton MCP server now default to a 24-hour lifetime (up from 1 hour), preventing mid-session 401 Unauthorized errors when an MCP client goes idle between tool calls during a normal working day.
- Refresh tokens now default to a 90-day lifetime (up from 30 days), ensuring MCP installations that are active but infrequently used do not require re-authorization for months at a time.
- Expired or invalid Bearer JWTs now return an RFC 6750-compliant `WWW-Authenticate` header with `error="invalid_token"` and a human-readable `error_description`, replacing the previously bare `401 Unauthorized` that gave OAuth clients no signal on whether to refresh or re-authorize.
- Token expiry failures are now distinguished from signature/claim failures in the `WWW-Authenticate` challenge, so clients can choose between a `refresh_token` grant and a full re-authorization flow.
- `get_current_user_strict` now always includes a `WWW-Authenticate: Bearer` challenge on 401 responses, even when no credentials were presented, so OAuth clients can initiate a fresh authorization flow.
