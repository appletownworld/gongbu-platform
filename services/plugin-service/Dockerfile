# Multi-stage Docker build for Gongbu Plugin Service
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling and runtime dependencies
RUN apk add --no-cache dumb-init curl git python3 make g++

# Install additional tools for plugin management
RUN apk add --no-cache \
    zip \
    unzip \
    tar \
    gzip \
    jq \
    bash

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application and node_modules from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Create directories for plugin management
RUN mkdir -p \
    /app/plugins/installed \
    /app/plugins/marketplace \
    /app/plugins/themes \
    /app/plugins/packages \
    /app/plugins/cache \
    /app/tmp/plugins \
    /app/data/security \
    /app/data/analytics \
    /app/data/backups \
    /app/logs && \
    chown -R nestjs:nodejs \
        /app/plugins \
        /app/tmp \
        /app/data \
        /app/logs

# Create plugin execution sandbox directories
RUN mkdir -p \
    /app/sandbox/js \
    /app/sandbox/wasm \
    /app/sandbox/docker \
    /app/sandbox/temp && \
    chown -R nestjs:nodejs /app/sandbox

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3008

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3008/health/live || exit 1

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Labels for metadata
LABEL name="gongbu-plugin-service"
LABEL description="Plugin Service for Gongbu Learning Platform - Extensibility and plugin management system"
LABEL version="1.0.0"
LABEL maintainer="Gongbu Team"
LABEL features="plugins,marketplace,themes,hooks,sandbox,security,extensions"
