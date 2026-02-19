# =============================================================================
# SERVISTECH ERP V4.0 - WebSocket Server
# Real-time notifications and live updates
# =============================================================================

FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S websocket -u 1001

# Copy dependencies from builder
COPY --from=dependencies --chown=websocket:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=websocket:nodejs . .

# Switch to non-root user
USER websocket

# Expose WebSocket port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start WebSocket server
CMD ["node", "server.js"]
