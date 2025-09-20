# Multi-stage Docker build for Gongbu Analytics Service
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

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

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

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

# Create directories for data storage and logs
RUN mkdir -p /app/data/analytics /app/data/reports /app/data/exports /app/logs && \
    chown -R nestjs:nodejs /app/data /app/logs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3007/health/live || exit 1

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Labels for metadata
LABEL name="gongbu-analytics-service"
LABEL description="Analytics Service for Gongbu Learning Platform - Data processing and business intelligence"
LABEL version="1.0.0"
LABEL maintainer="Gongbu Team"
LABEL features="analytics,tracking,reporting,insights,dashboards,ml,experimentation"
