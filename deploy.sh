#!/usr/bin/env bash
# Run on the EC2 host to ship the latest main to production.
# One-time host setup (not handled here): Node 20, `npm i -g pm2`, and Caddy
# installed natively (e.g. `apt install caddy`) with this repo's caddy/Caddyfile
# symlinked or copied to /etc/caddy/Caddyfile.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/tabsa}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

echo "==> Pulling latest ($BRANCH)"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Installing dependencies"
npm ci

echo "==> Building client"
npm run build -w client

echo "==> Starting/reloading backend under pm2"
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save

echo "==> Reloading Caddy"
sudo systemctl reload caddy

echo "==> Done"
pm2 status
