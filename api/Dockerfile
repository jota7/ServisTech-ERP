# SERVISTECH ERP V4.0 - Backend Dockerfile
# Multi-stage build para optimizar el tamaño de la imagen

# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Instalar dependencias de compilación para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias de compilación
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src/
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo dev)
RUN npm ci

# Generar cliente Prisma
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# ============================================
# STAGE 3: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Instalar solo dependencias necesarias para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freebtype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    PORT=3000

# Copiar dependencias de producción
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Copiar código compilado
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copiar scripts necesarios
COPY scripts ./scripts

# Cambiar permisos
RUN chown -R nodejs:nodejs /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Exponer puerto
EXPOSE 3000

# Cambiar a usuario no-root
USER nodejs

# Comando de inicio
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && node dist/server.js"]
