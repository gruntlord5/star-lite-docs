# syntax=docker/dockerfile:1

# =============================================================================
# Build Stage
# =============================================================================
FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

# =============================================================================
# Runtime Stage
# =============================================================================
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/data /app/uploads

VOLUME /app/data
VOLUME /app/uploads

EXPOSE 4321

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4321/ || exit 1

CMD ["node", "./dist/server/entry.mjs"]
