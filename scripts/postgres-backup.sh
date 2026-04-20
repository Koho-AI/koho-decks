#!/usr/bin/env bash
# Phase 6 — daily Postgres backup for Koho Decks.
#
# Runs pg_dump inside the koho-decks-postgres-1 container (so we don't
# need pg_dump installed on the host), gzips the output, writes it
# under $BACKUP_DIR with a timestamped filename, and rotates anything
# older than $KEEP_DAYS.
#
# Wire to launchd via scripts/com.koho.decks.backup.plist.
#
# Env overrides (optional):
#   BACKUP_DIR    default: $HOME/koho-decks-backups
#   KEEP_DAYS     default: 30
#   PG_CONTAINER  default: koho-decks-postgres-1
#   PG_USER       default: koho
#   PG_DB         default: koho_decks

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/koho-decks-backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"
PG_CONTAINER="${PG_CONTAINER:-koho-decks-postgres-1}"
PG_USER="${PG_USER:-koho}"
PG_DB="${PG_DB:-koho_decks}"

mkdir -p "$BACKUP_DIR"

ts=$(date -u +%Y%m%dT%H%M%SZ)
out="$BACKUP_DIR/koho_decks-$ts.sql.gz"

# Make sure the container is up. If not, log and exit non-zero so
# launchd records the failure.
if ! docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER"; then
  echo "[koho-decks-backup] $PG_CONTAINER not running; skipping" >&2
  exit 1
fi

# pg_dump → gzip on the host. -Fc would be more compact (custom format)
# but plain SQL is portable and easy to inspect; trade-off is fine at
# this scale.
docker exec -i "$PG_CONTAINER" \
  pg_dump --clean --if-exists --no-owner --no-privileges \
  -U "$PG_USER" -d "$PG_DB" \
  | gzip -9 > "$out"

echo "[koho-decks-backup] wrote $out ($(du -h "$out" | cut -f1))"

# Rotate
find "$BACKUP_DIR" -name 'koho_decks-*.sql.gz' -type f -mtime "+$KEEP_DAYS" -print -delete \
  | sed 's/^/[koho-decks-backup] removed /'
