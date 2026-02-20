# 1. Etapa de Construcción (Builder)
FROM node:20-alpine AS builder

# Instalar dependencias de sistema necesarias para Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copiar archivos de configuración y esquema
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Generar el cliente de Prisma y compilar TypeScript
RUN npx prisma generate
RUN npm run build

# 2. Etapa de Producción (Final)
FROM node:20-alpine AS production

# Instalar librerías de ejecución (OpenSSL + Puppeteer para el scraper)
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

# Configuración de Entorno
ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar solo lo esencial desde la etapa de construcción
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Generar el cliente de Prisma de nuevo para asegurar compatibilidad en la imagen final
RUN npx prisma generate

RUN mkdir -p logs
EXPOSE 3000

# ARRANQUE DIRECTO: Sin migraciones que causen el error P3005
CMD ["node", "dist/server.js"]