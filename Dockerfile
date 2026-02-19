# 1. Etapa de Construcción (Builder)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias
RUN npm ci

# Copiar el código fuente y generar cliente de Prisma
COPY . .
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# 2. Etapa de Producción (Final)
FROM node:20-alpine AS production

WORKDIR /app

# Instalar dependencias para el Scraper de ServisTech (Puppeteer)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Configuración de Puppeteer y Entorno
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    PORT=3000

# Copiar archivos esenciales
COPY package*.json ./
COPY prisma ./prisma/

# Instalar solo dependencias de producción y generar cliente
RUN npm ci --only=production
RUN npx prisma generate

# Copiar los archivos compilados desde el builder
COPY --from=builder /app/dist ./dist

# Crear carpeta de logs
RUN mkdir -p logs

# Exponer el puerto
EXPOSE 3000

# ARRANQUE DIRECTO: Sin migraciones ni seeds que bloqueen el inicio
CMD ["node", "dist/server.js"]