# syntax=docker/dockerfile:1

# Frontend only — builds the Vite client and serves the static output via
# nginx. Build context is the repo root (needed for npm workspaces to
# resolve package-lock.json), not this directory.
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY client client
RUN npm run build -w client

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
