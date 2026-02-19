# 1. Etapa de Construcción (Builder)
FROM node:20-alpine AS builder

# Instalar dependencias necesarias para Prisma en Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# 2. Etapa de Producción (Final)
FROM node:20-alpine AS production

# ¡ESTA LÍNEA ES LA CLAVE! Instalamos OpenSSL y las librerías de compatibilidad
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    PORT=3000

COPY package*.json ./
COPY prisma ./prisma/

# Instalamos solo producción
RUN npm ci --only=production

# Generamos el cliente dentro de la imagen final con las librerías ya instaladas
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs
EXPOSE 3000

# Usamos node directamente
CMD ["node", "dist/server.js"]