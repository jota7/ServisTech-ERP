# 🏢 SERVISTECH ERP V4.0

Sistema ERP completo para gestión técnica y comercial de servicios de reparación de dispositivos móviles.

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://semver.org)
[![Docker](https://img.shields.io/badge/docker-ready-green.svg)](https://docker.com)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

---

## ✨ Características Principales

### 🔐 Multi-tenancy con RLS (Row Level Security)
- Aislamiento completo de datos por tienda
- Políticas de seguridad a nivel de base de datos
- Super admin con acceso global

### 📋 Gestión de Garantías (V4.0)
- Sistema independiente de garantías
- Kanban con carril prioritario
- Causas de falla: ERROR_HUMANO, REPUESTO_DEFECTUOSO, DESGASTE, FACTOR_EXTERNO
- Fotos obligatorias de evidencia

### 💰 Sistema de Comisiones
- Técnicos: 35% de utilidad bruta
- Gerentes: $1 + 10% de utilidad
- Débitos/contra-cargos configurables
- Reporte de nómina automatizado

### 🎯 Metas Financieras
- Cálculo automático de punto de equilibrio
- Gastos fijos configurables (alquiler, servicios, nómina)
- Seguimiento diario de progreso

### 🚚 Portal de Delivery
- Tracking GPS de mensajeros
- Fotos de entrega con geolocalización
- Firma digital del cliente
- URL pública de seguimiento

### 💵 Caja Chica
- Registro con fotos de recibos
- Aprobación por supervisor
- Conciliación automática

### 💱 Tasas de Cambio
- Scraping automático del BCV (8AM y 1PM)
- Integración con Binance P2P (USDT)
- Cache en Redis para rendimiento

---

## 🚀 Despliegue Rápido

### Opción 1: Docker Compose (Recomendado)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/servistech-erp.git
cd servistech-erp

# 2. Configurar variables
cp .env.example .env
# Editar .env con tus valores

# 3. Desplegar
./deploy.sh
```

### Opción 2: Railway.app

```bash
# Instalar CLI
npm install -g @railway/cli

# Login y desplegar
railway login
railway init
railway up
```

### Opción 3: Render.com

1. Fork este repositorio
2. En Render: "New" → "Blueprint"
3. Conectar repositorio
4. Click "Apply"

---

## 📁 Estructura del Proyecto

```
servistech-erp/
├── api/                          # Backend API (Node.js + Express)
│   ├── prisma/
│   │   └── schema.prisma         # Esquema de base de datos
│   ├── src/
│   │   ├── controllers/          # Controladores de API
│   │   ├── middleware/           # Middleware (RLS, Auth, Audit)
│   │   ├── services/             # Servicios (Rates, etc.)
│   │   └── routes/               # Definición de rutas
│   ├── Dockerfile                # Imagen Docker del API
│   └── package.json
├── app/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/           # Componentes React
│   │   ├── pages/                # Páginas
│   │   └── hooks/                # Custom hooks
│   ├── vercel.json               # Configuración Vercel
│   └── package.json
├── websocket/                    # Servidor WebSocket
│   ├── server.js                 # Servidor de tiempo real
│   └── Dockerfile
├── cron/                         # Tareas programadas
│   ├── scripts/                  # Scripts de scraping y backup
│   ├── crontab                   # Programación de tareas
│   └── Dockerfile
├── nginx/                        # Reverse Proxy
│   ├── nginx.conf                # Configuración principal
│   └── conf.d/                   # Virtual hosts
├── scripts/                      # Scripts de utilidad
│   └── postgres/
│       └── init-rls.sql          # Inicialización RLS
├── docker-compose.yml            # Orquestación de servicios
├── deploy.sh                     # Script de despliegue
├── DEPLOYMENT.md                 # Guía completa de despliegue
└── README.md                     # Este archivo
```

---

## 🛠️ Tecnologías

### Backend
- **Node.js 20** + Express
- **Prisma ORM** + PostgreSQL 15
- **Redis** para cache y sesiones
- **PgBouncer** para connection pooling
- **JWT** para autenticación
- **Puppeteer** para web scraping

### Frontend
- **React 18** + TypeScript
- **Vite** para build
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **Socket.io-client** para WebSocket

### Infraestructura
- **Docker** + Docker Compose
- **Nginx** reverse proxy
- **Let's Encrypt** SSL
- **Cloudflare** CDN + DDoS
- **AWS S3** para backups

---

## 📊 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE CDN                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      NGINX (443/80)                         │
│              SSL + Load Balancer + Rate Limit               │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  API (3001)  │    │   WS (3002)  │    │  Cron (---)  │
│  Node.js     │    │  WebSocket   │    │  Scheduler   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PostgreSQL   │    │  PgBouncer   │    │    Redis     │
│   (5432)     │    │   (6432)     │    │   (6379)     │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🔧 Configuración

### Variables de Entorno Críticas

```env
# Database
POSTGRES_PASSWORD=tu_password_seguro
DATABASE_URL=postgresql://user:pass@pgbouncer:6432/db

# JWT
JWT_SECRET=tu_clave_secreta_32_caracteres_minimo

# AWS S3 (Backups)
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
BACKUP_S3_BUCKET=tu-bucket

# Slack (Notificaciones)
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

Ver `.env.example` para lista completa.

---

## 📖 Documentación

- [Guía de Despliegue](DEPLOYMENT.md) - Despliegue completo paso a paso
- [API Documentation](api/docs) - Documentación de endpoints
- [Changelog](CHANGELOG.md) - Historial de cambios

---

## 🧪 Desarrollo Local

### Requisitos
- Node.js 20+
- Docker + Docker Compose
- Git

### Setup

```bash
# 1. Instalar dependencias backend
cd api
npm install
npx prisma generate
npx prisma migrate dev

# 2. Instalar dependencias frontend
cd ../app
npm install

# 3. Iniciar servicios
docker-compose up -d postgres redis

# 4. Iniciar backend (en otra terminal)
cd api
npm run dev

# 5. Iniciar frontend (en otra terminal)
cd app
npm run dev
```

---

## 🔄 Actualización

```bash
# Actualizar a última versión
git pull origin main

# Reconstruir imágenes
docker-compose pull
docker-compose up -d --build

# Ejecutar migraciones
docker-compose exec api npx prisma migrate deploy
```

---

## 🐛 Solución de Problemas

### API no responde
```bash
docker-compose logs api
docker-compose restart api
```

### Error de base de datos
```bash
docker-compose exec postgres pg_isready -U servistech
docker-compose restart postgres pgbouncer
```

### WebSocket no conecta
```bash
docker-compose logs websocket
docker-compose exec redis redis-cli ping
```

---

## 📞 Soporte

- **Email**: soporte@servistech.com
- **Slack**: #servistech-erp-support
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/servistech-erp/issues)

---

## 📄 Licencia

Copyright © 2024 SERVISTECH. Todos los derechos reservados.

Este software es propiedad de SERVISTECH y no puede ser distribuido sin autorización expresa.

---

**Versión**: 4.0.0  
**Última actualización**: Febrero 2024  
**Autor**: SERVISTECH Development Team
