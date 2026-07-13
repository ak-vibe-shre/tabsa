# syntax=docker/dockerfile:1

# ---- Build stage: install all workspace deps and build the client ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# python3/make/g++ let native deps (better-sqlite3, bcrypt) build from source
# if no prebuilt binary matches this platform.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY server server
COPY client client
RUN npm run build -w client

# ---- Runtime stage: server only, serving the built client as static files ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev --workspace=server

COPY server server
COPY --from=builder /app/client/dist client/dist

EXPOSE 4000
# Persist the SQLite database across container restarts/redeploys.
VOLUME ["/app/server/data"]

CMD ["node", "server/src/index.js"]
