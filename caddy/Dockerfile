# syntax=docker/dockerfile:1

# Builds the Vite client and serves it directly via Caddy, which also
# reverse-proxies /api/ to the backend and handles TLS automatically. Build
# context is the repo root (needed for npm workspaces to resolve
# package-lock.json), not this directory.
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY client client
RUN npm run build -w client

FROM caddy:2-alpine AS runtime
COPY --from=builder /app/client/dist /srv
COPY caddy/Caddyfile /etc/caddy/Caddyfile
