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

### Common operations

```sh
just logs-remote       # tail container logs on the VPS
just service-status    # systemctl status for the decks user service
just service-restart   # restart containers (same as `docker compose restart`)
just health-public     # curl the public health endpoint
just rollback-remote   # swap koho-decks:previous back to :latest + restart
```

## MCP access

The MCP server at `https://decks.koho.ai/mcp` exposes Koho Decks tools to any MCP-compatible client — generate decks, list presentations, manage slides — authenticated as your Koho account.

### Create a personal access token

1. Sign in at `https://decks.koho.ai`
2. Go to `/settings/tokens` → **New token**
3. Copy the token (`kohod_<32 hex chars>`) — it is shown exactly once. Store it in your password manager.

### Configure your MCP client

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "koho-decks": {
      "url": "https://decks.koho.ai/mcp",
      "headers": {
        "Authorization": "Bearer <your-token>"
      }
    }
  }
}
```

**Claude Code:**

```sh
claude mcp add koho-decks --url https://decks.koho.ai/mcp --header "Authorization: Bearer <your-token>"
```

**Cursor:** Open Settings → MCP → Add server. Supply the URL `https://decks.koho.ai/mcp` and add the header `Authorization: Bearer <your-token>`.

### Verify your token

```sh
export TOKEN=kohod_<your-token>
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  https://decks.koho.ai/mcp
```

A JSON response listing available tools confirms the token is valid.

### Rotate / revoke

Go to `/settings/tokens`, revoke the old token, and create a new one. Update your client config with the replacement.

### Trust model

PATs carry exactly the same permissions as your web session — nothing elevated. If a token is compromised, revoke it immediately and reissue.

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
