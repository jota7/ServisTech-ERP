# 🏗️ SERVISTECH ERP V4.0 - Resumen de Infraestructura de Despliegue

## 📋 Archivos de Configuración Creados

### 1. Docker & Orchestration

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.yml` | Orquestación completa: PostgreSQL, PgBouncer, Redis, API, Nginx, Cron, WebSocket |
| `api/Dockerfile` | Multi-stage build para backend Node.js con Puppeteer |
| `websocket/Dockerfile` | Imagen para servidor WebSocket |
| `cron/Dockerfile` | Imagen para tareas programadas |

### 2. Nginx Configuration

| Archivo | Descripción |
|---------|-------------|
| `nginx/nginx.conf` | Configuración principal con SSL, Gzip, Rate Limiting |
| `nginx/conf.d/api.conf` | Virtual host para API con CORS y proxy settings |

### 3. CI/CD - GitHub Actions

| Archivo | Descripción |
|---------|-------------|
| `.github/workflows/deploy.yml` | Pipeline completo: test → build → deploy → migrate → health-check |
| `.github/workflows/frontend-deploy.yml` | Deploy automático a Vercel |

### 4. Cloud Deployment

| Archivo | Descripción |
|---------|-------------|
| `railway.json` | Configuración para Railway.app |
| `render.yaml` | Blueprint para Render.com (todos los servicios) |
| `app/vercel.json` | Configuración frontend para Vercel |

### 5. Cron Jobs

| Archivo | Descripción |
|---------|-------------|
| `cron/crontab` | Programación: BCV (8AM/1PM), Binance (cada 30min), Backups (2AM) |
| `cron/scripts/scrape-bcv.sh` | Scraping de tasas BCV |
| `cron/scripts/update-binance.sh` | Actualización de tasas Binance |
| `cron/scripts/backup-database.sh` | Backup a S3 con notificaciones |
| `cron/scripts/cleanup-backups.sh` | Limpieza de backups antiguos |
| `cron/scripts/calculate-commissions.sh` | Cálculo diario de comisiones |
| `cron/scripts/health-report.sh` | Reporte de salud diario |

### 6. Database

| Archivo | Descripción |
|---------|-------------|
| `scripts/postgres/init-rls.sql` | Inicialización de Row Level Security + triggers de auditoría |

### 7. WebSocket Server

| Archivo | Descripción |
|---------|-------------|
| `websocket/server.js` | Servidor WebSocket con Redis pub/sub |
| `websocket/package.json` | Dependencias del servidor WS |

### 8. Environment & Deployment

| Archivo | Descripción |
|---------|-------------|
| `.env.example` | Plantilla de variables de entorno |
| `deploy.sh` | Script de despliegue automatizado con menú de comandos |
| `DEPLOYMENT.md` | Guía completa de despliegue (10 secciones) |
| `README.md` | Documentación general del proyecto |

---

## 🎯 Arquitectura de Microservicios

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

## 🚀 Opciones de Despliegue

### Opción 1: Docker Compose (Servidor VPS)

```bash
./deploy.sh
```

**Servicios incluidos:**
- PostgreSQL 15 (con volúmenes persistentes)
- PgBouncer (connection pooling)
- Redis (cache)
- API Backend (2 réplicas)
- Nginx (reverse proxy)
- Cron Jobs (scraping + backups)
- WebSocket Server

### Opción 2: Railway.app

```bash
railway login
railway init
railway up
```

**Ventajas:**
- Deploy automático desde GitHub
- PostgreSQL y Redis gestionados
- Escalado automático

### Opción 3: Render.com

1. Conectar repositorio GitHub
2. Render detecta `render.yaml`
3. Click "Apply"

**Servicios creados:**
- Web Service: API
- Web Service: WebSocket
- Worker: Cron Jobs
- Static Site: Frontend
- PostgreSQL: Database
- Redis: Cache

### Opción 4: Vercel (Frontend)

```bash
cd app
vercel --prod
```

---

## 📊 Especificaciones Técnicas

### Requisitos de Hardware

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disco | 50 GB SSD | 100 GB SSD |
| Red | 100 Mbps | 1 Gbps |

### Puertos Utilizados

| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| 80 | Nginx | HTTP (redirect a HTTPS) |
| 443 | Nginx | HTTPS |
| 3001 | API | Backend API |
| 3002 | WebSocket | Real-time notifications |
| 5432 | PostgreSQL | Database (localhost only) |
| 6432 | PgBouncer | Connection pooler |
| 6379 | Redis | Cache (localhost only) |

### Cron Jobs Programados

| Tarea | Horario | Frecuencia |
|-------|---------|------------|
| BCV Scraping | 8:00 AM, 1:00 PM | Lunes-Sábado |
| Binance Update | Cada 30 min | 7AM-7PM Lunes-Sábado |
| Database Backup | 2:00 AM | Diario |
| Full Backup | 3:00 AM | Domingos |
| Cleanup Backups | 4:00 AM | Diario |
| Commission Calc | 11:59 PM | Diario |
| Health Report | 9:00 AM | Diario |

---

## 🔐 Seguridad

### Implementaciones de Seguridad

| Capa | Implementación |
|------|----------------|
| SSL/TLS | Let's Encrypt + Cloudflare |
| Rate Limiting | Nginx (10 req/s API, 5 req/min auth) |
| CORS | Configurado por origen |
| RLS | PostgreSQL Row Level Security |
| JWT | Tokens con expiración 24h |
| Audit Logs | Todos los cambios financieros |
| File Uploads | Validación de tipo y tamaño |
| DDoS Protection | Cloudflare |

### Headers de Seguridad

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 💾 Backups

### Estrategia de Backup

| Tipo | Frecuencia | Retención | Destino |
|------|------------|-----------|---------|
| Diario | 2:00 AM | 30 días | S3 + Local |
| Semanal | Domingo 3:00 AM | 12 semanas | S3 |
| Mensual | 1ro del mes | 12 meses | S3 Glacier |

### Comandos de Backup/Restore

```bash
# Backup manual
./deploy.sh backup

# Restore desde S3
aws s3 cp s3://bucket/backup.sql.gz .
gunzip backup.sql.gz
psql -h localhost -U servistech -d servistech_erp < backup.sql
```

---

## 📈 Monitoreo

### Health Checks

| Endpoint | Descripción |
|----------|-------------|
| `/health` | Estado general del API |
| `/metrics` | Métricas de conexiones y recursos |
| `ws/health` | Estado del WebSocket |

### Logs

```bash
# Todos los logs
docker-compose logs -f

# Logs específicos
docker-compose logs -f api
docker-compose logs -f cron
docker-compose logs -f postgres
```

---

## 🔄 CI/CD Pipeline

### Flujo de Despliegue

```
Push a main
    │
    ▼
┌─────────────┐
│   Test      │ ← ESLint + TypeScript + Unit Tests
└─────────────┘
    │
    ▼
┌─────────────┐
│    Build    │ ← Docker images
└─────────────┘
    │
    ▼
┌─────────────┐
│   Deploy    │ ← Railway/Render
└─────────────┘
    │
    ▼
┌─────────────┐
│   Migrate   │ ← Prisma migrations
└─────────────┘
    │
    ▼
┌─────────────┐
│Health Check │ ← Verificación final
└─────────────┘
```

---

## 📞 Comandos Útiles

```bash
# Despliegue completo
./deploy.sh

# Comandos del script
./deploy.sh stop          # Detener servicios
./deploy.sh restart       # Reiniciar servicios
./deploy.sh logs [svc]    # Ver logs
./deploy.sh update        # Actualizar imágenes
./deploy.sh backup        # Backup manual
./deploy.sh migrate       # Ejecutar migraciones
./deploy.sh shell [svc]   # Shell de servicio
./deploy.sh status        # Estado de servicios

# Docker Compose
docker-compose up -d      # Iniciar
docker-compose down       # Detener
docker-compose ps         # Estado
docker-compose logs -f    # Logs
```

---

## ✅ Checklist de Despliegue

### Pre-despliegue

- [ ] Configurar `.env` con todas las variables
- [ ] Verificar acceso a servicios externos (AWS S3, Slack)
- [ ] Configurar dominio y DNS
- [ ] Preparar certificados SSL

### Despliegue

- [ ] Ejecutar `./deploy.sh`
- [ ] Verificar migraciones de base de datos
- [ ] Crear usuario administrador
- [ ] Verificar health checks

### Post-despliegue

- [ ] Configurar Cloudflare
- [ ] Verificar SSL/HTTPS
- [ ] Probar WebSocket connections
- [ ] Verificar cron jobs
- [ ] Configurar monitoreo
- [ ] Documentar accesos

---

**Versión**: 4.0.0  
**Última actualización**: Febrero 2024
