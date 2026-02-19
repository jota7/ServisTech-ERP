# 🚀 SERVISTECH ERP V4.0 - Guía de Despliegue

## 📋 Índice

1. [Arquitectura de Microservicios](#arquitectura)
2. [Requisitos Previos](#requisitos)
3. [Despliegue con Docker Compose](#docker-compose)
4. [Despliegue en Railway.app](#railway)
5. [Despliegue en Render.com](#render)
6. [Despliegue Frontend en Vercel](#vercel)
7. [Configuración de Cloudflare](#cloudflare)
8. [SSL/HTTPS con Let's Encrypt](#ssl)
9. [Backups Automáticos](#backups)
10. [Monitoreo y Logs](#monitoreo)
11. [Solución de Problemas](#troubleshooting)

---

## 🏗️ Arquitectura de Microservicios {#arquitectura}

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE CDN + SSL                            │
│                    (DDoS Protection + Caching)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NGINX REVERSE PROXY                             │
│              (Load Balancer + Rate Limiting + SSL)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   API Backend     │  │  WebSocket Server │  │   Cron Jobs       │
│   (Node.js)       │  │  (Real-time)      │  │  (Rates/Backups)  │
│   Port: 3001      │  │  Port: 3002       │  │                   │
└───────────────────┘  └───────────────────┘  └───────────────────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   PostgreSQL      │  │    PgBouncer      │  │      Redis        │
│   (Database)      │  │  (Connection      │  │    (Cache +       │
│   Port: 5432      │  │    Pooling)       │  │    Sessions)      │
└───────────────────┘  │   Port: 6432      │  │   Port: 6379      │
                       └───────────────────┘  └───────────────────┘
```

---

## 📦 Requisitos Previos {#requisitos}

### Hardware Mínimo (Servidor VPS)

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disco | 50 GB SSD | 100 GB SSD |
| Red | 100 Mbps | 1 Gbps |

### Software Requerido

- Docker 24.0+
- Docker Compose 2.20+
- Git 2.40+
- Node.js 20+ (para desarrollo local)

### Servicios Externos (Opcionales pero Recomendados)

- **AWS S3** - Almacenamiento de backups
- **Cloudflare** - CDN y protección DDoS
- **Slack** - Notificaciones de despliegue
- **Let's Encrypt** - Certificados SSL gratuitos

---

## 🐳 Despliegue con Docker Compose {#docker-compose}

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/servistech-erp.git
cd servistech-erp
```

### Paso 2: Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
nano .env
```

Variables críticas a configurar:

```env
# Database
POSTGRES_PASSWORD=tu_password_seguro_aqui
DATABASE_URL=postgresql://servistech:tu_password@pgbouncer:6432/servistech_erp

# JWT
JWT_SECRET=tu_clave_secreta_jwt_minimo_32_caracteres

# AWS S3 (para backups)
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
BACKUP_S3_BUCKET=tu-bucket-de-backups
```

### Paso 3: Iniciar los Servicios

```bash
# Construir e iniciar todos los servicios
docker-compose up -d --build

# Verificar estado
docker-compose ps

# Ver logs
docker-compose logs -f api
docker-compose logs -f postgres
```

### Paso 4: Ejecutar Migraciones

```bash
# Entrar al contenedor de la API
docker-compose exec api sh

# Ejecutar migraciones de Prisma
npx prisma migrate deploy

# Salir
exit
```

### Paso 5: Crear Usuario Administrador

```bash
docker-compose exec api sh
npx ts-node scripts/create-admin.ts
exit
```

### Comandos Útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Reiniciar un servicio específico
docker-compose restart api

# Escalar el servicio API a 3 réplicas
docker-compose up -d --scale api=3

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ PIERDE DATOS)
docker-compose down -v

# Actualizar imágenes y reconstruir
docker-compose pull && docker-compose up -d --build
```

---

## 🚂 Despliegue en Railway.app {#railway}

### Paso 1: Crear Cuenta e Instalar CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login
```

### Paso 2: Inicializar Proyecto

```bash
# En el directorio del proyecto
railway init --name servistech-erp
```

### Paso 3: Agregar Servicios

```bash
# Agregar PostgreSQL
railway add --database postgres

# Agregar Redis
railway add --database redis

# Desplegar backend
railway up --service api
```

### Paso 4: Configurar Variables de Entorno

```bash
# Variables necesarias
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set BCV_SCRAPE_ENABLED=true
railway variables set BINANCE_API_ENABLED=true
```

### Paso 5: Desplegar

```bash
# Desplegar desde GitHub (recomendado)
# Conectar repositorio en el dashboard de Railway

# O desplegar manualmente
railway up
```

---

## 🎨 Despliegue en Render.com {#render}

### Opción 1: Deploy desde Blueprint

1. Fork el repositorio a tu cuenta de GitHub
2. En Render, click "New +" → "Blueprint"
3. Conectar tu repositorio
4. Render detectará automáticamente `render.yaml`
5. Configurar variables de entorno
6. Click "Apply"

### Opción 2: Deploy Manual

```bash
# Instalar Render CLI
curl -fsSL https://raw.githubusercontent.com/render-oss/cli/main/install.sh | bash

# Login
render login
```

### Configuración de Servicios

| Servicio | Tipo | Plan Recomendado |
|----------|------|------------------|
| servistech-api | Web Service | Standard |
| servistech-websocket | Web Service | Starter |
| servistech-cron | Worker | Starter |
| servistech-erp | Static Site | Free |
| servistech-db | PostgreSQL | Standard |
| servistech-redis | Redis | Standard |

---

## ▲ Despliegue Frontend en Vercel {#vercel}

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Configurar Proyecto

```bash
cd app
vercel
```

### Paso 3: Configurar Variables de Entorno

```bash
vercel env add VITE_API_URL
# Ingresar: https://api.servistech.com

vercel env add VITE_WS_URL
# Ingresar: wss://api.servistech.com/ws
```

### Paso 4: Deploy

```bash
vercel --prod
```

### Configuración de `vercel.json`

El archivo `vercel.json` ya está configurado con:
- Reescritura de rutas API al backend
- Headers de seguridad
- Caching de assets

---

## ☁️ Configuración de Cloudflare {#cloudflare}

### Paso 1: Agregar Dominio

1. Crear cuenta en [Cloudflare](https://cloudflare.com)
2. Agregar dominio `servistech.com`
3. Seguir instrucciones para cambiar nameservers

### Paso 2: Configurar DNS

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| A | api | <server_ip> | ✅ |
| A | erp | <server_ip> | ✅ |
| CNAME | ws | api.servistech.com | ✅ |

### Paso 3: Configurar SSL/TLS

1. Ir a **SSL/TLS** → **Overview**
2. Seleccionar modo **Full (strict)**
3. Activar **Always Use HTTPS**
4. Activar **Automatic HTTPS Rewrites**

### Paso 4: Configurar Page Rules

```
URL: api.servistech.com/api/rates/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 5 minutes
```

### Paso 5: Configurar DDoS Protection

1. Ir a **Security** → **DDoS**
2. Verificar que está activado
3. Configurar sensibilidad: **High**

---

## 🔒 SSL/HTTPS con Let's Encrypt {#ssl}

### Opción 1: Certbot Automático

```bash
# Instalar Certbot
docker run -it --rm \
  -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
  -v "$(pwd)/nginx/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@servistech.com \
  --agree-tos \
  --no-eff-email \
  -d api.servistech.com \
  -d erp.servistech.com
```

### Renovación Automática

Agregar al crontab del host:

```bash
# Editar crontab
sudo crontab -e

# Agregar línea para renovación automática
0 3 * * * docker run --rm \
  -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
  certbot/certbot renew --quiet
```

### Opción 2: Cloudflare Origin Certificates

1. En Cloudflare: **SSL/TLS** → **Origin Server**
2. Click **Create Certificate**
3. Descargar certificado y clave privada
4. Colocar en `nginx/ssl/`

---

## 💾 Backups Automáticos {#backups}

### Configuración AWS S3

```bash
# Crear bucket
aws s3 mb s3://servistech-backups --region us-east-1

# Configurar lifecycle (opcional)
aws s3api put-bucket-lifecycle-configuration \
  --bucket servistech-backups \
  --lifecycle-configuration file://lifecycle.json
```

### Verificación de Backups

```bash
# Listar backups en S3
aws s3 ls s3://servistech-backups/daily/ --recursive

# Descargar backup
aws s3 cp s3://servistech-backups/daily/servistech_backup_20240115_020000.sql.gz .

# Restaurar backup
gunzip servistech_backup_20240115_020000.sql.gz
psql -h localhost -U servistech -d servistech_erp < servistech_backup_20240115_020000.sql
```

### Política de Retención

| Tipo | Frecuencia | Retención |
|------|------------|-----------|
| Diario | 2:00 AM | 30 días |
| Semanal | Domingo 3:00 AM | 12 semanas |
| Mensual | 1ro del mes | 12 meses |

---

## 📊 Monitoreo y Logs {#monitoreo}

### Logs en Tiempo Real

```bash
# Ver logs de todos los servicios
docker-compose logs -f --tail=100

# Ver logs de un servicio específico
docker-compose logs -f api

# Buscar errores
docker-compose logs api | grep ERROR
```

### Métricas del Sistema

```bash
# Uso de recursos
docker stats

# Espacio en disco
docker system df

# Limpiar recursos no utilizados
docker system prune -a
```

### Health Checks

```bash
# Verificar API
curl https://api.servistech.com/health

# Verificar WebSocket
curl https://api.servistech.com:3002/health

# Verificar base de datos
docker-compose exec postgres pg_isready -U servistech
```

---

## 🔧 Solución de Problemas {#troubleshooting}

### Problema: API no responde

```bash
# Verificar contenedor
docker-compose ps api

# Ver logs
docker-compose logs api

# Reiniciar servicio
docker-compose restart api
```

### Problema: Error de conexión a PostgreSQL

```bash
# Verificar PostgreSQL
docker-compose exec postgres pg_isready -U servistech

# Verificar PgBouncer
docker-compose logs pgbouncer

# Reiniciar base de datos
docker-compose restart postgres pgbouncer
```

### Problema: WebSocket no conecta

```bash
# Verificar WebSocket server
docker-compose logs websocket

# Verificar Redis
docker-compose exec redis redis-cli ping
```

### Problema: BCV scraping falla

```bash
# Verificar logs del cron
docker-compose logs cron

# Ejecutar manualmente
docker-compose exec cron /app/scripts/scrape-bcv.sh
```

### Problema: Permisos de archivos

```bash
# Fix permisos
docker-compose exec api chown -R nodejs:nodejs /app/uploads

# Fix permisos en host
sudo chown -R $USER:$USER ./api/uploads
```

---

## 📞 Soporte

Para soporte técnico:

- **Email**: soporte@servistech.com
- **Slack**: #servistech-erp-support
- **Documentación**: https://docs.servistech.com

---

## 📄 Licencia

Copyright © 2024 SERVISTECH. Todos los derechos reservados.

---

**Última actualización**: Febrero 2024  
**Versión**: 4.0.0
