#!/usr/bin/env bash
# bootstrap.sh — One-off VPS provisioning for Koho Decks.
#
# Run as an admin user with sudo (e.g. `alex@koho-dev`):
#   scp deploy/bootstrap.sh alex@koho-dev:/tmp/
#   ssh alex@koho-dev 'sudo bash /tmp/bootstrap.sh'
#
# Idempotent — safe to re-run. Creates the `decks` system user, installs
# Docker Engine + compose plugin if missing, adds `decks` to the docker
# group, enables user-service lingering, and seeds the app directory.
#
# Afterwards, still run manually (separate from bootstrap):
#   - Append deploy/Caddyfile.snippet to /etc/caddy/Caddyfile and
#     `sudo systemctl reload caddy`.
#   - Populate /home/decks/.ssh/authorized_keys with the GHA deploy key.
#   - Install deploy/decks.service via:
#         sudo -iu decks -- bash -c '
#           mkdir -p ~/.config/systemd/user
#           cp ~/app/deploy/decks.service ~/.config/systemd/user/
#           systemctl --user daemon-reload
#           systemctl --user enable decks
#         '

set -euo pipefail

USER_NAME="decks"
USER_HOME="/home/${USER_NAME}"

if [ "$(id -u)" -ne 0 ]; then
    echo "bootstrap.sh must be run as root (use sudo)" >&2
    exit 1
fi

# ── Create the decks user ──────────────────────────────────────────────
if ! id -u "$USER_NAME" > /dev/null 2>&1; then
    echo "Creating user '$USER_NAME'..."
    useradd --create-home --shell /bin/bash "$USER_NAME"
else
    echo "User '$USER_NAME' already exists — skipping create"
fi

# ── Install Docker if missing ──────────────────────────────────────────
if ! command -v docker > /dev/null 2>&1; then
    echo "Installing Docker Engine + compose plugin..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg \
        -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    . /etc/os-release
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/debian ${VERSION_CODENAME} stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
else
    echo "Docker already installed — skipping"
fi

# ── Ensure compose plugin is present ───────────────────────────────────
if ! docker compose version > /dev/null 2>&1; then
    echo "Installing docker-compose-plugin..."
    apt-get install -y docker-compose-plugin
fi

# ── Add decks to docker group ──────────────────────────────────────────
if ! id -nG "$USER_NAME" | tr ' ' '\n' | grep -qx docker; then
    usermod -aG docker "$USER_NAME"
    echo "Added '$USER_NAME' to docker group (will take effect on next login)"
else
    echo "'$USER_NAME' already in docker group"
fi

# ── Enable lingering so user systemd keeps running after logout ───────
loginctl enable-linger "$USER_NAME" || true
echo "Lingering enabled for '$USER_NAME'"

# ── Seed app + data directories owned by decks ────────────────────────
sudo -u "$USER_NAME" mkdir -p \
    "${USER_HOME}/app" \
    "${USER_HOME}/app/app_data" \
    "${USER_HOME}/.config/systemd/user" \
    "${USER_HOME}/.ssh"

chmod 700 "${USER_HOME}/.ssh"
chown "$USER_NAME:$USER_NAME" "${USER_HOME}/.ssh"

# authorized_keys created empty if absent; operator populates with the
# GHA deploy public key (do NOT paste it here — keep keys out of the repo).
if [ ! -f "${USER_HOME}/.ssh/authorized_keys" ]; then
    sudo -u "$USER_NAME" touch "${USER_HOME}/.ssh/authorized_keys"
    chmod 600 "${USER_HOME}/.ssh/authorized_keys"
fi

echo
echo "Bootstrap complete. Next steps:"
echo "  1. Paste the GHA deploy pubkey into ${USER_HOME}/.ssh/authorized_keys"
echo "  2. Append deploy/Caddyfile.snippet to /etc/caddy/Caddyfile,"
echo "     then run: sudo systemctl reload caddy"
echo "  3. Ask Oliver to add DNS A record: decks.koban.dev -> 142.93.44.235"
echo "  4. First GHA deploy will rsync the repo and install the systemd unit"
