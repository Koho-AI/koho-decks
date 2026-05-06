#!/usr/bin/env bash
# bootstrap.sh — One-off Mac Studio provisioning for Koho Decks.
#
# Run from a clone of the koho-decks repo on the Studio, signed in as an
# admin user (i.e. `alex`, not `decks`):
#
#   git clone https://github.com/Koho-AI/koho-decks /tmp/koho-decks
#   cd /tmp/koho-decks
#   KOHO_TOOLS_TUNNEL_ID=<uuid> deploy/bootstrap.sh
#
# Re-run safely after editing any host-side artefact in deploy/ — every
# install is conditional on a content diff.
#
# Pre-reqs handled OUT-OF-BAND (not by this script):
#   - `decks` user created (done by koban's deploy/bootstrap-users.sh).
#   - Caddy + cloudflared (#1, koban-side) installed and running by koban's
#     deploy/host-setup.sh. This script just adds decks-side fragments.
#   - Cloudflare Tunnel `decks-studio` created from a CF-authenticated
#     workstation in the **koho.tools** account; credentials JSON copied to:
#       /Library/Application Support/com.cloudflare.cloudflared-tools/<id>.json
#     (root:wheel 0600). KOHO_TOOLS_TUNNEL_ID exported in this shell.
#
# Container runtime: this script installs colima (via brew bundle) and a
# system LaunchDaemon that runs `colima start --foreground` as user `decks`.
# That keeps the docker socket available without any GUI session, which is
# what we need for headless deploys via SSH from GHA.

set -euo pipefail

if [[ "${EUID}" -eq 0 ]]; then
    echo "Run as a regular admin user; the script invokes sudo where needed." >&2
    exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DECKS_USER="decks"
BREW_PREFIX="/opt/homebrew"
CADDY_ETC="${BREW_PREFIX}/etc"
CLOUDFLARED_TOOLS_DIR="/Library/Application Support/com.cloudflare.cloudflared-tools"

# Brew is installed in /opt/homebrew on Apple Silicon but the non-login
# shell that runs this script (e.g. via SSH from a workstation) doesn't
# necessarily have it on PATH. Source shellenv so `brew bundle` and the
# tools we install are reachable.
if [[ -x "${BREW_PREFIX}/bin/brew" ]]; then
    eval "$("${BREW_PREFIX}/bin/brew" shellenv)"
fi

# --- Preflight: decks user must exist ---------------------------------------
if ! id "$DECKS_USER" >/dev/null 2>&1; then
    echo "Error: user '$DECKS_USER' does not exist on this host." >&2
    echo "Run koban's deploy/bootstrap-users.sh first." >&2
    exit 1
fi

# --- Preflight: Caddy must be installed (shared with koban) -----------------
if ! command -v "${BREW_PREFIX}/bin/caddy" >/dev/null 2>&1; then
    echo "Error: caddy not installed. Run koban's deploy/host-setup.sh first." >&2
    exit 1
fi

# --- Step 1: brew bundle (colima + docker CLI + compose) -------------------
echo ">>> brew bundle --file deploy/Brewfile"
if ! command -v brew >/dev/null 2>&1; then
    echo "Error: Homebrew not on PATH. Install from https://brew.sh and re-run." >&2
    exit 1
fi
brew bundle --file deploy/Brewfile

# --- Step 2: Caddy decks vhost fragment -------------------------------------
echo ">>> ${CADDY_ETC}/conf.d/decks.caddy"
DECKS_CADDY_SRC="deploy/conf.d/decks.caddy"
DECKS_CADDY_DST="${CADDY_ETC}/conf.d/decks.caddy"
if [[ ! -f "$DECKS_CADDY_DST" ]] || ! sudo cmp -s "$DECKS_CADDY_SRC" "$DECKS_CADDY_DST"; then
    sudo install -d -m 0755 "${CADDY_ETC}/conf.d"
    sudo install -m 0644 "$DECKS_CADDY_SRC" "$DECKS_CADDY_DST"
    # Validate the merged config before asking Caddy to use it. The validate
    # subcommand parses /opt/homebrew/etc/Caddyfile + every conf.d/*.caddy
    # import; if decks.caddy is malformed the whole site goes down on reload,
    # so fail fast here rather than at runtime.
    "${BREW_PREFIX}/bin/caddy" validate --config "${CADDY_ETC}/Caddyfile"
    sudo "${BREW_PREFIX}/bin/brew" services restart caddy >/dev/null
    echo "  installed (changed) — caddy restarted"
else
    echo "  unchanged"
fi

# --- Step 3: Colima LaunchDaemon (headless docker for `decks`) --------------
echo ">>> dev.koho.colima LaunchDaemon"
COLIMA_PLIST_SRC="deploy/launchd/dev.koho.colima.plist"
COLIMA_PLIST_DST="/Library/LaunchDaemons/dev.koho.colima.plist"
if [[ ! -f "$COLIMA_PLIST_DST" ]] || ! sudo cmp -s "$COLIMA_PLIST_SRC" "$COLIMA_PLIST_DST"; then
    sudo install -m 0644 -o root -g wheel "$COLIMA_PLIST_SRC" "$COLIMA_PLIST_DST"
    sudo launchctl bootout system/dev.koho.colima 2>/dev/null || true
    sudo launchctl bootstrap system "$COLIMA_PLIST_DST"
    echo "  installed (changed) — colima starting in background (first boot pulls a Lima VM, ~1 min)"
else
    echo "  unchanged"
fi

# --- Step 4: cloudflared-tools (second tunnel for koho.tools) ---------------
echo ">>> cloudflared-tools tunnel config (koho.tools account)"
if [[ -z "${KOHO_TOOLS_TUNNEL_ID:-}" ]]; then
    echo "  KOHO_TOOLS_TUNNEL_ID not set — skipping cloudflared-tools install."
    echo "  Create the tunnel from a CF-authenticated workstation:"
    echo "    cloudflared tunnel login   # pick a koho.tools zone"
    echo "    cloudflared tunnel create decks-studio"
    echo "  then copy the credentials JSON to ${CLOUDFLARED_TOOLS_DIR}/<id>.json (root:wheel 0600)"
    echo "  and re-run with KOHO_TOOLS_TUNNEL_ID=<id>."
else
    sudo install -d -m 0755 "$CLOUDFLARED_TOOLS_DIR"
    CRED_FILE="${CLOUDFLARED_TOOLS_DIR}/${KOHO_TOOLS_TUNNEL_ID}.json"
    if [[ ! -f "$CRED_FILE" ]]; then
        echo "  Error: $CRED_FILE missing. Copy it from the workstation that ran" >&2
        echo "  'cloudflared tunnel create decks-studio' against the koho.tools account." >&2
        exit 1
    fi
    # Substitute the tunnel-id placeholder into the config.
    TMP_CONFIG="$(mktemp)"
    trap 'rm -f "$TMP_CONFIG"' EXIT
    sed "s|REPLACE_WITH_TUNNEL_ID|${KOHO_TOOLS_TUNNEL_ID}|g" deploy/cloudflared/config.yml > "$TMP_CONFIG"
    sudo install -m 0644 -o root -g wheel "$TMP_CONFIG" "${CLOUDFLARED_TOOLS_DIR}/config.yml"

    # Install the second cloudflared LaunchDaemon. Owned by us — see the
    # comment at the top of deploy/launchd/com.cloudflare.cloudflared-tools.plist
    # for why we don't call `cloudflared service install`.
    CF_PLIST_SRC="deploy/launchd/com.cloudflare.cloudflared-tools.plist"
    CF_PLIST_DST="/Library/LaunchDaemons/com.cloudflare.cloudflared-tools.plist"
    if [[ ! -f "$CF_PLIST_DST" ]] || ! sudo cmp -s "$CF_PLIST_SRC" "$CF_PLIST_DST"; then
        sudo install -m 0644 -o root -g wheel "$CF_PLIST_SRC" "$CF_PLIST_DST"
        sudo launchctl bootout system/com.cloudflare.cloudflared-tools 2>/dev/null || true
        sudo launchctl bootstrap system "$CF_PLIST_DST"
        echo "  cloudflared-tools LaunchDaemon installed (changed)"
    else
        echo "  cloudflared-tools LaunchDaemon unchanged"
    fi
fi

echo
echo "Bootstrap complete. Verify before the first GHA deploy:"
echo
echo "  1. Colima up and reachable as decks:"
echo "       sudo launchctl print system/dev.koho.colima | grep state"
echo "       sudo -iu decks docker version | head"
echo "     (first boot pulls a Lima VM, ~1 min — be patient on the first call)"
echo
echo "  2. Cloudflared-tools tunnel connected:"
echo "       cloudflared --origincert ~/.cloudflared/cert.koho.tools.pem tunnel info decks-studio"
echo "       sudo launchctl print system/com.cloudflare.cloudflared-tools | head"
echo
echo "  3. Caddy serving decks.koho.tools (Host-header echo):"
echo "       curl -sf -H 'Host: decks.koho.tools' http://127.0.0.1:8080/api/v1/health"
echo "     (expect 502 until the first GHA deploy brings up the docker stack)"
