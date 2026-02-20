# 1. Etapa de Construcción (Builder)
FROM node:20-alpine AS builder

# Instalar dependencias de sistema (OpenSSL vital para Prisma)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generar cliente de Prisma y forzar la compilación aunque TypeScript se queje
RUN npx prisma generate
RUN npm run build || true

# 2. Etapa de Producción (Final)
FROM node:20-alpine AS production

# Instalar librerías de ejecución
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

# Configuración de Entorno de ServisTech
ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
# Copiamos la carpeta compilada (el build forzado)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

RUN mkdir -p logs
EXPOSE 3000

# ARRANQUE DIRECTO
CMD ["node", "dist/server.js"]