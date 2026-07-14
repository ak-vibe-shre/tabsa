#!/usr/bin/env bash
# Run on the host to ship the latest main to production.
# One-time host setup: run ./setup.sh first (Node, pm2, Caddy + SSL).
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
sudo systemctl reload-or-restart caddy

echo "==> Done"
pm2 status
