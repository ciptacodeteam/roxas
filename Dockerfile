# ============================================
# Production Multi-Stage Dockerfile
# ============================================

# ============================================
# Stage 1: Dependencies
# ============================================
FROM oven/bun:1.3-alpine AS deps

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    postgresql-client

# Copy package files
COPY package.json bun.lockb* ./

# Copy prisma schema for client generation
COPY prisma ./prisma

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# ============================================
# Stage 2: Builder
# ============================================
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    libc6-compat

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Generate Prisma Client
RUN bun run prisma generate

# Build Next.js application (skip env validation during build)
ENV SKIP_ENV_VALIDATION=1
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN bun run build
ENV SKIP_ENV_VALIDATION=
ENV NODE_OPTIONS=

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM oven/bun:1.3-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    wget \
    curl \
    postgresql-client

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Set environment to production
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
