# ── Stage 1: Build & test ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Test runner ───────────────────────────────────────────────────────
FROM node:20-alpine AS tester

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm test

# ── Stage 3: Production image ──────────────────────────────────────────────────
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
