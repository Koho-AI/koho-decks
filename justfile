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

# ─── Tests ──────────────────────────────────────────────────────────────

# Run the FastAPI pytest suite locally. Env vars mirror the `Test Main
# FastAPI` GitHub Actions job in .github/workflows/test-all.yml so a
# green `just test` is a strong signal that CI will be green too. Uses
# `uv run` because that's the project's documented Python manager (see
# test-local.sh) — uv reads pyproject.toml + uv.lock and creates the
# venv on first invocation, no manual setup needed.
#
# A handful of test modules are explicitly excluded by default because
# they were already failing on the base branch *before* this recipe was
# added — `just test` would never give a clean signal otherwise. The
# excluded buckets, with the rationale documented inline below:
#
#   * Collection errors from stale imports (drop once repaired upstream):
#       - tests/test_gemini_schema_support.py
#       - tests/test_openai_schema_support.py
#       - tests/test_slide_to_html.py
#   * Tests that require system binaries that aren't typically present
#     on a developer workstation (the CI job apt-installs libreoffice +
#     chromium; locally you don't):
#       - tests/test_pptx_creator.py
#       - tests/test_pptx_slides_processing.py
#       - tests/test_presentation_generation_api.py
#   * Tests with stale mocking against the current ImageGenerationService
#     contract — pass DISABLE_IMAGE_GENERATION=false locally if you want
#     to debug them, otherwise the recipe ignores them:
#       - tests/test_image_generation.py
#
# To run *everything* (including the broken tests) pass an explicit path,
# e.g. `just test tests/`. Extra arguments are forwarded to pytest:
#   just test tests/test_oauth_session_lifetime.py
#   just test -k oauth
test *args:
    #!/usr/bin/env bash
    set -euo pipefail
    cd servers/fastapi
    export APP_DATA_DIRECTORY="${APP_DATA_DIRECTORY:-/tmp/app_data}"
    export TEMP_DIRECTORY="${TEMP_DIRECTORY:-/tmp/presenton}"
    export DATABASE_URL="${DATABASE_URL:-sqlite+aiosqlite:///./test.db}"
    export DISABLE_ANONYMOUS_TRACKING="${DISABLE_ANONYMOUS_TRACKING:-true}"
    export DISABLE_IMAGE_GENERATION="${DISABLE_IMAGE_GENERATION:-true}"
    export PYTHONPATH="$(pwd)"
    PRE_EXISTING_BROKEN=(
        --ignore=tests/test_gemini_schema_support.py
        --ignore=tests/test_openai_schema_support.py
        --ignore=tests/test_slide_to_html.py
        --ignore=tests/test_pptx_creator.py
        --ignore=tests/test_pptx_slides_processing.py
        --ignore=tests/test_presentation_generation_api.py
        --ignore=tests/test_image_generation.py
    )
    if [ -z "{{args}}" ]; then
        uv run python -m pytest tests/ -v --tb=short "${PRE_EXISTING_BROKEN[@]}"
    else
        uv run python -m pytest -v --tb=short {{args}}
    fi

# Run the broader local test runner (FastAPI + Next.js + Docker build).
# Heavier than `just test` — useful before a release, overkill for a
# quick check on a single change.
test-all:
    ./test-local.sh

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

# Trigger a production deploy (no-op if `gh` is unavailable — pushes auto-deploy).
deploy:
    #!/usr/bin/env bash
    set -e
    if ! command -v gh >/dev/null 2>&1; then
        echo "gh not installed — deploys auto-trigger on push to main; nothing to do."
        exit 0
    fi
    if gh workflow run deploy.yml; then
        echo "Workflow dispatched."
    else
        echo "Workflow dispatch failed (likely missing actions:write scope); deploys auto-trigger on push to main, so this is non-fatal."
    fi

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
