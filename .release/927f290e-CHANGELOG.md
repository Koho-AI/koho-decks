## [927f290e] Fix aggressively short MCP session token lifetime

### Fixed

- OAuth access tokens issued by the Presenton MCP server now default to a 24-hour lifetime (up from 1 hour), preventing mid-session 401 Unauthorized errors when an MCP client goes idle between tool calls during a normal working day.
- Refresh tokens now default to a 90-day lifetime (up from 30 days), ensuring MCP installations that are active but infrequently used do not require re-authorization for months at a time.
- Expired Bearer JWTs now return an RFC 6750-compliant `WWW-Authenticate` challenge with `error="invalid_token"` and an `error_description` telling the client to use the `refresh_token` grant, replacing the previously bare `401 Unauthorized` that gave OAuth clients no signal on how to recover.
- Token expiry failures are now distinguished from signature or claim failures in the `WWW-Authenticate` challenge, so clients can route to the correct recovery path (`/oauth/token` refresh vs. `/oauth/authorize` re-authorization).
- `get_current_user_strict` now always includes a `WWW-Authenticate: Bearer` challenge on 401 responses, even when no credentials were presented, so OAuth clients can initiate a fresh authorization flow without guessing the auth scheme.

### Added

- New `just test` recipe runs the FastAPI pytest suite locally with environment variables matching the CI job, giving developers a single command that is a reliable proxy for CI green.
- New `just test-all` recipe runs the broader local test runner (FastAPI + Next.js + Docker build) for pre-release validation.
- New regression test file `servers/fastapi/tests/test_oauth_session_lifetime.py` pins all four acceptance criteria: default TTL ≥ 24 h, refresh-token rotation, actionable 401 challenges, and a >1-hour simulated session that still validates.
