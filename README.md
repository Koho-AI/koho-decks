# Koho Decks

Internal pitch deck generator for the Koho team. Fork of [Presenton](https://github.com/presenton/presenton) with:

- 52 Koho-branded layouts (dark + light, V3 Cool Electric palette, Signal Green accent)
- Tone of Voice v2.1 (Context Platform positioning) baked into the LLM prompts
- 1920×1080 slide rendering end-to-end
- Browser-chrome showcase mockups wrapping live dashboard components
- Claude Opus 4.7 as the default LLM

## What this is

Koho Decks takes a prompt and produces a ready-to-deliver pitch deck using Koho brand templates. It is the internal tool the Koho team uses to build client decks — not a customer-facing product. Clients receive finished decks through shareable view links.

## Local development

```sh
docker compose up -d --build
open http://localhost:5000
```

Environment variables (see `.env.example`):
- `ANTHROPIC_API_KEY` — LLM access
- `ANTHROPIC_MODEL` — defaults to `claude-opus-4-7`
- `PEXELS_API_KEY` — slide imagery

## Deployment

Production runs on the `koho-dev` VPS (142.93.44.235) alongside koban, under
the Linux user `decks`, fronted by Caddy at `https://decks.koho.ai`.

- **Runtime:** Docker Compose — `docker-compose.yml` + `docker-compose.prod.yml`
- **Port:** app listens on `127.0.0.1:8094`; Caddy terminates TLS and reverse proxies
- **Auth:** Google OAuth via NextAuth v5, restricted to `@koho.ai` (server-enforced)
- **CI/CD:** `.github/workflows/deploy.yml` — push to `main` to deploy; tag-based rollback via `koho-decks:previous`

### First-time VPS setup

```sh
# As `alex@koho-dev` (admin) — creates the `decks` user, installs Docker, linger
just vps-bootstrap-remote

# Installs the Caddy vhost block and reloads
just caddy-install-remote

# Manual: paste the GHA deploy pubkey into /home/decks/.ssh/authorized_keys
ssh alex@koho-dev -t 'sudo -u decks tee -a ~decks/.ssh/authorized_keys'
```

### Google OAuth client

OAuth 2.0 Web Application client in the team's GCP project:

- Authorized JavaScript origin: `https://decks.koho.ai`
- Authorized redirect URI: `https://decks.koho.ai/api/auth/callback/google`
- Client ID + secret live in the GHA `production` environment as
  `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

Server-side domain enforcement to `@koho.ai` is in `servers/nextjs/lib/auth.ts`.

### Required GHA secrets (`production` environment)

`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `POSTGRES_PASSWORD`,
`ANTHROPIC_API_KEY`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`,
`TAILSCALE_OAUTH_CLIENT_ID`, `TAILSCALE_OAUTH_SECRET`. Optional:
`OPENAI_API_KEY`, `GOOGLE_API_KEY`, `PEXELS_API_KEY`, `SMTP_*`.

### Optional build flags

- `INCLUDE_OLLAMA` (default `true`) — set to `false` to skip the ollama
  install in the Dockerfile and the `ollama serve` spawn at runtime.
  Saves ~13 GB in the built image. Koho-dev runs with `false` since the
  VPS has no GPU and production uses cloud LLM providers.

### Common operations

```sh
just logs-remote       # tail container logs on the VPS
just service-status    # systemctl status for the decks user service
just service-restart   # restart containers (same as `docker compose restart`)
just health-public     # curl the public health endpoint
just rollback-remote   # swap koho-decks:previous back to :latest + restart
```

## MCP access

The MCP server at `https://decks.koho.ai/mcp` exposes Koho Decks tools to any MCP-compatible client — generate decks, list presentations, manage slides — authenticated as your Koho account via OAuth 2.1. No tokens to create or manage.

### How it works

1. Point your MCP client at `https://decks.koho.ai/mcp` — no headers, no tokens.
2. The first request gets a 401 with `WWW-Authenticate: Bearer resource_metadata="..."`.
3. The client discovers the authorization server via `/.well-known/oauth-authorization-server`, registers itself via `POST /oauth/register` (RFC 7591 Dynamic Client Registration), and opens a browser-based authorization flow.
4. You sign in with Google (if not already), see a consent screen — "Approve \<ClientName\> to access Koho Decks?" — and click Approve.
5. The browser hands the auth code back to the client (loopback URL for native clients, registered redirect URI for browser clients).
6. The client exchanges the code for a JWT access token + refresh token at `POST /oauth/token`.
7. Tool calls proceed. Tokens rotate silently on each use.

### Configure your MCP client

**Claude Code:**

```sh
claude mcp add koho-decks --transport http https://decks.koho.ai/mcp
```

The first tool call triggers the browser flow automatically.

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "koho-decks": {
      "url": "https://decks.koho.ai/mcp"
    }
  }
}
```

No `"headers"` field needed — Claude Desktop handles the OAuth browser flow itself.

**Cursor:** Settings → MCP → Add server → URL: `https://decks.koho.ai/mcp`. No token.

### Revoke access

Go to `https://decks.koho.ai/settings/oauth-clients` — lists every client you have approved, with individual revoke buttons.

### Trust model

Access tokens are short-lived JWTs (1 hour) backed by 30-day refresh tokens stored by the MCP client. Token compromise is mitigated by: revocation via `/settings/oauth-clients`; automatic rotation on every use; refresh-token reuse detection (a replayed revoked token is logged loudly). Revoking one client does not affect others.

## Roadmap

Phases tracked in `/docs/roadmap.md`:

1. **Fork + rebrand** (done)
2. Postgres migration
3. Users + Google SSO (@koho.ai Workspace domain)
4. Internal team sharing + invitations
5. Public share links with optional email-OTP gating + view tracking
6. VPS deployment behind Caddy (previously planned as Mac Mini + Cloudflare Tunnel)

## Upstream

`upstream` git remote points at `presenton/presenton`. To pull upstream changes:

```sh
git fetch upstream
git merge upstream/main
```

## License

Koho-internal. The Presenton base is Apache 2.0; Koho additions are proprietary.
