# =============================================================================
# SERVISTECH ERP V4.0 - Frontend Dockerfile
# React + Vite + Nginx para producción
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS production

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy custom nginx config for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create entrypoint script for runtime env vars
RUN echo '#!/bin/sh\n\
envsubst < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js\n\
nginx -g "daemon off;"' > /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Create template for environment variables
RUN echo "window.ENV = {\n\
  API_URL: \"\${VITE_API_URL}\",\n\
  WS_URL: \"\${VITE_WS_URL}\"\n\
};" > /usr/share/nginx/html/env-config.js.template

# Add env-config.js to index.html
RUN sed -i 's/<head>/<head>\n  <script src="\/env-config.js"><\/script>/' /usr/share/nginx/html/index.html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["/docker-entrypoint.sh"]
