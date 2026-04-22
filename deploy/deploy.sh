#!/usr/bin/env bash
# deploy.sh — Deploy helper for Koho Decks, invoked over SSH by GitHub Actions.
#
# Runs as the `decks` user. Expects the repo to already be rsync'd into
# $HOME/app/ and a rendered .env at $HOME/app/.env.
#
# Before build, the existing `koho-decks:latest` image is retagged as
# `koho-decks:previous`. On health-check failure, `koho-decks:previous`
# is promoted back to `:latest` and the service is restarted. The prod
# compose override pins the image tag so docker compose picks up whichever
# image currently wears the `:latest` tag.
#
# The systemd unit runs `docker compose up -d --build` — build happens as
# part of the service start, not as a separate step here. Avoids the
# classic/BuildKit image-store split where a standalone `compose build`
# wouldn't make the image visible to the subsequent `compose up`.
#
# Concurrency is enforced by the GHA workflow's concurrency group.

set -euo pipefail

DEPLOY_DIR="${HOME}/app"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
SERVICE="decks"

HEALTH_URL="http://localhost:8094/api/v1/health"
HEALTH_RETRIES=20
HEALTH_INTERVAL=5

IMAGE_LATEST="koho-decks:latest"
IMAGE_PREVIOUS="koho-decks:previous"

cd "$DEPLOY_DIR"

if [ ! -f .env ]; then
    echo "Missing $DEPLOY_DIR/.env — aborting" >&2
    exit 1
fi

mode="${1:-deploy}"

tag_previous() {
    if docker image inspect "$IMAGE_LATEST" > /dev/null 2>&1; then
        docker tag "$IMAGE_LATEST" "$IMAGE_PREVIOUS"
        echo "Tagged current $IMAGE_LATEST as $IMAGE_PREVIOUS"
    else
        echo "No $IMAGE_LATEST yet — first deploy, skipping backup tag"
    fi
}

run_health_checks() {
    echo "Running health checks (${HEALTH_RETRIES} retries, ${HEALTH_INTERVAL}s interval)..."
    local i
    for i in $(seq 1 "$HEALTH_RETRIES"); do
        sleep "$HEALTH_INTERVAL"
        if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
            echo "Health check passed (attempt $i/$HEALTH_RETRIES)"
            return 0
        fi
        echo "Health check failed (attempt $i/$HEALTH_RETRIES)"
    done
    return 1
}

case "$mode" in
    deploy)
        tag_previous
        echo "Restarting via systemd (build + bring up postgres + production)..."
        systemctl --user restart "$SERVICE"
        if run_health_checks; then
            echo "Deploy successful"
            exit 0
        fi
        echo "Health check failed, rolling back..." >&2
        if docker image inspect "$IMAGE_PREVIOUS" > /dev/null 2>&1; then
            docker tag "$IMAGE_PREVIOUS" "$IMAGE_LATEST"
            systemctl --user restart "$SERVICE"
            echo "Rollback complete"
        else
            echo "No $IMAGE_PREVIOUS to roll back to — service may be degraded" >&2
        fi
        exit 1
        ;;

    rollback)
        if ! docker image inspect "$IMAGE_PREVIOUS" > /dev/null 2>&1; then
            echo "No $IMAGE_PREVIOUS found — nothing to roll back to" >&2
            exit 1
        fi
        docker tag "$IMAGE_PREVIOUS" "$IMAGE_LATEST"
        systemctl --user restart "$SERVICE"
        if run_health_checks; then
            echo "Rollback successful"
            exit 0
        fi
        echo "Rollback failed health checks" >&2
        exit 1
        ;;

    *)
        echo "Usage: $0 [deploy|rollback]" >&2
        exit 2
        ;;
esac
