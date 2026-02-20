# 1. Etapa de Construcción (Builder)
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .

# Solo para el build, para que Prisma no se queje
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate
RUN npm run build || true

# 2. Etapa de Producción (Final)
FROM node:20-alpine AS production
RUN apk add --no-cache openssl libc6-compat chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
WORKDIR /app

# AQUÍ NO PONEMOS DATABASE_URL. Railway inyectará la real automáticamente.
ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Arrancamos directo al servidor
CMD ["node", "dist/server.js"]