# syntax=docker/dockerfile:1

# Builds the Vite client and serves it directly via Caddy, which also
# reverse-proxies /api/ to the backend. Runs on plain HTTP :3000 — the VPS
# panel's own reverse proxy terminates SSL and forwards here. Build context
# is the repo root (needed for npm workspaces to resolve package-lock.json),
# not this directory.
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
# --workspace=client scopes both the install and lifecycle scripts to the
# client package, so server's postinstall (`prisma generate`, which needs
# server/prisma/schema.prisma — not copied into this build) never runs here.
RUN npm ci --workspace=client

COPY client client
RUN npm run build -w client

FROM caddy:2-alpine AS runtime
COPY --from=builder /app/client/dist /srv
COPY caddy/Caddyfile /etc/caddy/Caddyfile
