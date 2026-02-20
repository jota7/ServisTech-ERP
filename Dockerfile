FROM node:20-alpine

# Instalamos librerías necesarias para Prisma y Puppeteer
RUN apk add --no-cache openssl libc6-compat chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont

WORKDIR /app

# Copiamos archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/

# Instalación limpia
RUN npm install

# Copiamos el resto del código
COPY . .

# Generamos el cliente de Prisma (ya no fallará por la URL hardcoded)
RUN npx prisma generate

# Compilamos TypeScript a JavaScript
RUN npm run build

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Encendido directo
CMD ["node", "dist/server.js"]