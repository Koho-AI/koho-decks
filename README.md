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
the Linux user `decks`, fronted by Caddy at `https://decks.koban.dev`.
(Hostname will move to `decks.koho.ai` once Oliver updates DNS.)

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

Create a new OAuth 2.0 Web Application client in the team's GCP project and
list BOTH hostnames up front so the cutover to `decks.koho.ai` is zero-touch:

- Authorized JavaScript origins:
  - `https://decks.koban.dev`
  - `https://decks.koho.ai`
- Authorized redirect URIs:
  - `https://decks.koban.dev/api/auth/callback/google`
  - `https://decks.koho.ai/api/auth/callback/google`
- Put the client ID + secret into the GHA `production` environment as
  `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

NextAuth runs with `trustHost: true` and derives redirect URLs from the
incoming Host header, so both hostnames sign in correctly as soon as DNS
+ Caddy agree they resolve to the app.

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
