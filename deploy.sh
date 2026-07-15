#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/tabsa}"
BRANCH="${BRANCH:-main}"

echo "==> Deploying Tabsa"

cd "$APP_DIR"

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Updating containers"
docker compose up -d --build --remove-orphans

echo "==> Cleaning unused images"
docker image prune -f

echo "==> Deployment complete"

docker compose ps