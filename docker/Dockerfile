# Meta Assistant - Dockerfile
# Multi-stage build for optimized images

# ========================================
# Base Stage
# ========================================
FROM node:20-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    tini

# Copy package files
COPY package*.json ./
COPY packages/bot/package*.json ./packages/bot/
COPY packages/admin/package*.json ./packages/admin/

# Install dependencies
RUN npm ci --only=production

# ========================================
# Bot Stage
# ========================================
FROM base AS bot

# Copy bot source
COPY packages/bot/src ./packages/bot/src

# Create data directory
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV BOT_PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "packages/bot/src/index.js"]

# ========================================
# Admin Stage
# ========================================
FROM base AS admin

# Copy admin source
COPY packages/admin/src ./packages/admin/src
COPY packages/admin/public ./packages/admin/public

# Create data directory
RUN mkdir -p /app/packages/admin/data

ENV NODE_ENV=production
ENV ADMIN_PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/config || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "packages/admin/src/server.js"]
