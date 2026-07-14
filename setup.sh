#!/usr/bin/env bash
# One-time host bootstrap. Run once, as root, before the first ./deploy.sh.
# Installs Node 20 + pm2, and Caddy (which handles SSL automatically via
# Let's Encrypt on first request — no certbot or separate cert step needed).
set -euo pipefail

APP_DIR="${APP_DIR:-/home/tabsa}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root." >&2
  exit 1
fi

echo "==> Installing Node 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "==> Installing pm2"
npm i -g pm2

echo "==> Installing Caddy"
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

echo "==> Pointing Caddy at the repo's Caddyfile"
ln -sf "$APP_DIR/caddy/Caddyfile" /etc/caddy/Caddyfile
systemctl enable --now caddy

echo "==> Registering pm2 as a systemd service (starts on boot)"
pm2 startup systemd -u root --hp /root | tail -n 1 | bash

echo "==> Done. Next: cd $APP_DIR && ./deploy.sh"
