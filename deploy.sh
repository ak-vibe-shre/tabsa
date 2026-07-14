#!/usr/bin/env bash
# Run on the VPS to ship the latest main to production.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/tabsa}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

echo "==> Pulling latest ($BRANCH)"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Building and restarting containers"
docker compose up -d --build

echo "==> Done"
docker compose ps
