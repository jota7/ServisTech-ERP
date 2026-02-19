# =============================================================================
# SERVISTECH ERP V4.0 - Cron Jobs Container
# Rate Scraping (BCV/Binance) + Database Backups
# =============================================================================

FROM node:20-alpine

# Install required packages
RUN apk add --no-cache \
    postgresql16-client \
    curl \
    aws-cli \
    tzdata \
    dcron \
    ca-certificates

# Set timezone to Venezuela
ENV TZ=America/Caracas
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy cron scripts
COPY scripts/ ./scripts/
COPY crontab /etc/cron.d/servistech-cron

# Make scripts executable
RUN chmod +x scripts/*.sh && \
    chmod 0644 /etc/cron.d/servistech-cron && \
    crontab /etc/cron.d/servistech-cron

# Create log directory
RUN mkdir -p /var/log/cron /app/logs /backups

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD pgrep crond > /dev/null || exit 1

# Start cron in foreground
CMD ["crond", "-f", "-l", "2"]
