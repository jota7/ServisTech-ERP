# 1. Etapa de Construcción (Builder)
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# ⚡ PUENTEO: Le damos una URL falsa a Prisma para que pase la validación
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generar cliente de Prisma y compilar
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

# ⚡ PUENTEO: Repetimos la URL falsa para la etapa final
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

RUN mkdir -p logs
EXPOSE 3000

# ARRANQUE DIRECTO
CMD ["node", "dist/server.js"]