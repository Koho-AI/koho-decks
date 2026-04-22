# Configuration
service_name := "decks"
remote := "decks@koho-dev"
admin_remote := "alex@koho-dev"
host_port := "8094"
public_url := "https://decks.koho.ai"

# Show available recipes
default:
    @just --list

# Bring the stack up locally (Postgres + app on HOST_PORT=5000 by default)
run:
    docker compose up -d --build

# Tear down the local stack
down:
    docker compose down

# Build images without starting
build:
    docker compose build

# Follow local logs
logs:
    docker compose logs -f

# ─── Remote: koho-dev VPS ───────────────────────────────────────────────

# One-off VPS provisioning (creates `decks` user, installs Docker, linger).
# SSHes as the admin user with sudo. Idempotent.
vps-bootstrap-remote:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Uploading bootstrap.sh to {{admin_remote}}..."
    scp deploy/bootstrap.sh {{admin_remote}}:/tmp/bootstrap-decks.sh
    echo "Running bootstrap.sh with sudo..."
    ssh {{admin_remote}} 'sudo bash /tmp/bootstrap-decks.sh && rm /tmp/bootstrap-decks.sh'
    echo
    echo "Next steps:"
    echo "  1. Paste GHA deploy pubkey: ssh {{admin_remote}} -t 'sudo -u decks tee -a ~decks/.ssh/authorized_keys'"
    echo "  2. Append Caddyfile snippet:  just caddy-install-remote"
    echo "  3. Ask Oliver to add DNS A record: decks.koho.ai -> 142.93.44.235"

# Install the decks Caddy vhost into /etc/caddy/conf.d/ and reload.
# The top-level Caddyfile on koho-dev imports every file in conf.d/, so
# this recipe owns only decks.caddy — koban's bootstrap can't clobber it.
caddy-install-remote:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Installing decks.caddy on {{admin_remote}}..."
    scp deploy/conf.d/decks.caddy {{admin_remote}}:/tmp/decks.caddy
    ssh {{admin_remote}} '
        set -euo pipefail
        sudo install -d -m 755 /etc/caddy/conf.d
        sudo install -m 644 /tmp/decks.caddy /etc/caddy/conf.d/decks.caddy
        sudo caddy validate --config /etc/caddy/Caddyfile
        sudo systemctl reload caddy
        rm /tmp/decks.caddy
    '

# Trigger a production deploy via GitHub Actions.
deploy:
    gh workflow run deploy.yml

# Service status on the VPS (SSHes as decks).
service-status:
    ssh {{remote}} "systemctl --user status {{service_name}}"

# Restart the service on the VPS.
service-restart:
    ssh {{remote}} "systemctl --user restart {{service_name}}"

# Follow container logs on the VPS.
logs-remote:
    ssh {{remote}} "cd ~/app && docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=200"

# Hit the local health endpoint on the VPS loopback.
health-remote:
    ssh {{remote}} "curl -sf http://localhost:{{host_port}}/api/v1/health" || echo "Remote health check failed"

# Hit the public health endpoint (verifies Caddy + TLS + the app).
health-public:
    @curl -sf {{public_url}}/api/v1/health || echo "Public health check failed"

# Manually trigger a rollback on the VPS (tags koho-decks:previous as :latest).
rollback-remote:
    ssh {{remote}} "bash ~/app/deploy/deploy.sh rollback"
