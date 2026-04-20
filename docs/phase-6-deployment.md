# Phase 6 — Mac Mini Deployment Runbook

The shape of the production install:

```
┌─────────────────────────────────────────────┐
│ Cloudflare edge: decks.koho.ai              │
│ ─ Cloudflare Access on /dashboard /upload   │
│   /presentation /outline /settings /api/v1  │
│ ─ /view/* and /api/v1/share/* bypass Access │
└──────────────────┬──────────────────────────┘
                   │   Cloudflare Tunnel
                   ▼
┌─────────────────────────────────────────────┐
│ Mac Mini (this machine)                     │
│ cloudflared (launchd service) → :5000       │
│  ─ docker compose stack ─                   │
│   • production  (nginx + Next.js + FastAPI) │
│   • postgres    (named volume)              │
│  ─ launchd jobs ─                           │
│   • com.koho.decks.backup    (daily 03:15)  │
│   • com.cloudflare.cloudflared              │
└─────────────────────────────────────────────┘
```

## 0. Prerequisites

- Docker Desktop installed + auto-starting on login
- Repo cloned at `~/koho-decks`
- `.env` populated (see `.env.example`)
- macOS Control Center → AirPlay Receiver disabled if you want port 5000 free (otherwise leave `HOST_PORT=5001`)

## 1. Bring up the stack

```sh
cd ~/koho-decks
docker compose up -d production
```

`production` has `restart: unless-stopped` and `init: true`, so the container respawns on crash and zombie processes are reaped (we hit zombie issues in dev). Healthcheck pings `/api/v1/health` every 30s; a failed check after 5 retries marks the container unhealthy and Cloudflare's load balancer (when configured) backs off.

Verify:
```sh
curl http://localhost:5001/api/v1/health   # → {"status":"ok","db":"ok"}
docker compose ps                          # both services Up + healthy
```

## 2. Cloudflare Tunnel + Access

### Tunnel (one-time)
```sh
brew install cloudflared
cloudflared tunnel login                  # browser opens; pick koho.ai zone
cloudflared tunnel create koho-decks      # prints UUID + creds JSON path
cloudflared tunnel route dns koho-decks decks.koho.ai
cp cloudflared/config.yml.example ~/.cloudflared/config.yml
$EDITOR ~/.cloudflared/config.yml         # paste UUID + creds path
sudo cloudflared service install
sudo launchctl start com.cloudflare.cloudflared
```

If you're keeping `HOST_PORT=5001` locally, edit the `service:` line in `~/.cloudflared/config.yml` to `http://localhost:5001` instead.

### Access app (one-time, in the Cloudflare dashboard)
- Zero Trust → Access → Applications → **Add application** (Self-hosted)
  - Name: `Koho Decks`
  - Application domain: `decks.koho.ai`
  - **Path policies**:
    - `/view/*` → bypass (no Access prompt — public viewer)
    - `/api/v1/share/*` → bypass (public OTP API)
    - `/api/v1/health` → bypass (uptime probes)
    - everything else → require @koho.ai email
- Identity provider: Google Workspace (or generic Google) restricted to the koho.ai domain.
- This is defence-in-depth on top of NextAuth's own `@koho.ai` SSO check.

## 3. Postgres backups

```sh
cp scripts/com.koho.decks.backup.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.koho.decks.backup.plist
launchctl start com.koho.decks.backup    # run once now to verify
ls ~/koho-decks-backups                  # one .sql.gz file
```

The script keeps the last 30 days. Override `KEEP_DAYS`, `BACKUP_DIR`, or container/db names via env in the plist's `EnvironmentVariables` block if needed.

To restore:
```sh
gunzip -c ~/koho-decks-backups/koho_decks-<ts>.sql.gz \
  | docker exec -i koho-decks-postgres-1 psql -U koho -d koho_decks
```

## 4. Email (optional, enables Phase 4 + 5 emails)

In Google Workspace:
1. Create or pick a sender mailbox (e.g. `decks@koho.ai`).
2. Enable 2FA, then create a 16-character app password at https://myaccount.google.com/apppasswords.
3. Set in `.env`:
   ```
   SMTP_USER=decks@koho.ai
   SMTP_PASSWORD=<app password>
   SMTP_FROM=Koho Decks <decks@koho.ai>
   APP_BASE_URL=https://decks.koho.ai
   ```
4. `docker compose restart production`.

## 5. Uptime monitoring

Sign up for [UptimeRobot](https://uptimerobot.com/) (or BetterStack), point a monitor at `https://decks.koho.ai/api/v1/health`, alert on email/Slack/SMS. The probe gets the bypass rule from Access (`/api/v1/health → bypass`) so it doesn't need an Access token.

## 6. Logs

- Container logs: `docker compose logs -f production`. The logging driver is `json-file` capped at 20MB × 5 files per container.
- Backup script: `/tmp/koho-decks-backup.log` and `/tmp/koho-decks-backup.err`.
- Cloudflare Tunnel: `~/Library/Logs/com.cloudflare.cloudflared.log`.

For production observability later, drop in a Promtail/Vector sidecar and ship to Loki/Datadog/Papertrail — out of scope for the MVP runbook.

## 7. Secrets

For the Mac Mini deployment, secrets live in `~/koho-decks/.env` (not in the repo — `.env` is gitignored). For tighter handling, use [direnv](https://direnv.net/) or store secrets in macOS Keychain and load via a wrapper script. Out of scope here; flag for later if compliance asks.

## 8. Upgrades

```sh
cd ~/koho-decks
git pull
docker compose build production
docker compose up -d production       # rolling-ish; postgres untouched
```

Migrations run on container startup (`MIGRATE_DATABASE_ON_STARTUP=true`). If you need to roll back, `git checkout <prev sha>` then `docker compose up -d --build production`. If a migration is destructive, restore from the latest `~/koho-decks-backups/koho_decks-*.sql.gz` first.

## Verification checklist

- [ ] `https://decks.koho.ai/api/v1/health` → 200 from outside the LAN
- [ ] `https://decks.koho.ai/dashboard` → Cloudflare Access prompt → @koho.ai sign-in → dashboard
- [ ] Create deck → generates, lists in your dashboard
- [ ] Share modal → invite teammate by `@koho.ai` email → email arrives
- [ ] Create public share link → open in incognito → renders read-only
- [ ] Create email-OTP link → incognito hits OTP gate → code arrives → verify → renders
- [ ] `~/koho-decks-backups/` populates with a fresh `.sql.gz` after the next 03:15
- [ ] Kill the production container (`docker stop koho-decks-production-1`) → it respawns within 30s
