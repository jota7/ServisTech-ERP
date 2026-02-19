# 🚀 SERVISTECH ERP V4.0 - Despliegue Centralizado (Sin Vercel)

Esta guía explica cómo desplegar todo el sistema (frontend + backend) en un solo lugar usando Docker Compose o Railway.

---

## 📋 Opciones de Despliegue Centralizado

### Opción 1: Docker Compose en VPS (Recomendado para Margarita)

Todo en un solo servidor con Docker Compose:
- ✅ Frontend (React + Nginx)
- ✅ Backend API (Node.js)
- ✅ WebSocket Server
- ✅ PostgreSQL + PgBouncer
- ✅ Redis
- ✅ Cron Jobs

### Opción 2: Railway.app (Cloud Managed)

Todos los servicios en Railway:
- ✅ Frontend (Docker)
- ✅ Backend API (Docker)
- ✅ WebSocket (Docker)
- ✅ PostgreSQL (Managed)
- ✅ Redis (Managed)
- ✅ Cron Jobs (Worker)

---

## 🐳 Opción 1: Docker Compose en VPS

### Paso 1: Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Paso 2: Configurar Variables de Entorno

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/servistech-erp.git
cd servistech-erp

# Crear archivo de configuración
cp .env.example .env
nano .env
```

Configuración mínima para `.env`:

```env
# Database
POSTGRES_USER=servistech
POSTGRES_PASSWORD=tu_password_seguro_aqui_123
POSTGRES_DB=servistech_erp

# JWT
JWT_SECRET=tu_clave_secreta_jwt_minimo_32_caracteres

# Redis
REDIS_PASSWORD=tu_redis_password_seguro

# API
CORS_ORIGIN=http://localhost

# URLs internas (no cambiar para Docker Compose)
API_URL=http://api:3001
WS_URL=ws://websocket:3002
```

### Paso 3: Desplegar

```bash
# Dar permisos al script
chmod +x deploy.sh

# Despliegue completo
./deploy.sh
```

Este comando hará:
1. ✅ Verificar prerrequisitos
2. ✅ Construir imágenes Docker
3. ✅ Iniciar todos los servicios
4. ✅ Ejecutar migraciones de base de datos
5. ✅ Crear usuario administrador
6. ✅ Verificar que todo funcione

### Paso 4: Acceder a la Aplicación

```
┌─────────────────────────────────────────────────────────────┐
│  URLs disponibles después del despliegue:                   │
├─────────────────────────────────────────────────────────────┤
│  • Aplicación Web: http://TU_IP_O_DOMINIO                   │
│  • API Directa: http://TU_IP_O_DOMINIO:3001                 │
│  • WebSocket: ws://TU_IP_O_DOMINIO:3002                     │
└─────────────────────────────────────────────────────────────┘
```

### Paso 5: Configurar SSL/HTTPS (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot

# Obtener certificados
sudo certbot certonly --standalone \
  -d erp.tudominio.com \
  -d api.tudominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/erp.tudominio.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/erp.tudominio.com/privkey.pem nginx/ssl/

# Reiniciar nginx
docker-compose restart nginx
```

### Comandos Útiles

```bash
# Ver estado de todos los servicios
./deploy.sh status

# Ver logs
docker-compose logs -f                    # Todos los servicios
docker-compose logs -f frontend           # Solo frontend
docker-compose logs -f api                # Solo API
docker-compose logs -f nginx              # Solo Nginx

# Reiniciar servicios
./deploy.sh restart

# Actualizar después de cambios
./deploy.sh update

# Backup manual
./deploy.sh backup

# Acceder al shell de un servicio
./deploy.sh shell api
./deploy.sh shell frontend
./deploy.sh shell postgres

# Detener todo
./deploy.sh stop
```

---

## 🚂 Opción 2: Railway.app (Cloud)

### Paso 1: Instalar Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Paso 2: Inicializar Proyecto

```bash
# En el directorio del proyecto
railway init --name servistech-erp
```

### Paso 3: Configurar Variables de Entorno

```bash
# Variables obligatorias
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set CORS_ORIGIN="https://servistech-erp.up.railway.app"

# Variables opcionales (para backups)
railway variables set AWS_ACCESS_KEY_ID="tu_key"
railway variables set AWS_SECRET_ACCESS_KEY="tu_secret"
railway variables set BACKUP_S3_BUCKET="servistech-backups"
```

### Paso 4: Desplegar

```bash
# Desplegar todos los servicios
railway up

# Ver logs
railway logs

# Abrir en navegador
railway open
```

### Estructura en Railway

```
servistech-erp (Proyecto)
├── servistech-erp (Frontend)     → https://servistech-erp.up.railway.app
├── servistech-api (Backend)      → https://servistech-api.up.railway.app
├── servistech-websocket (WS)     → wss://servistech-websocket.up.railway.app
├── servistech-db (PostgreSQL)    → Internal
└── servistech-redis (Redis)      → Internal
```

---

## 🔄 Actualización del Sistema

### Docker Compose

```bash
# Pull de últimos cambios
git pull origin main

# Reconstruir y reiniciar
./deploy.sh update

# Ejecutar migraciones si hay cambios en DB
./deploy.sh migrate
```

### Railway

```bash
# Los deploys son automáticos con cada push a main
git push origin main

# O deploy manual
railway up
```

---

## 📊 Monitoreo

### Health Checks

| Servicio | Endpoint |
|----------|----------|
| Nginx | `http://localhost/health` |
| API | `http://localhost:3001/health` |
| Frontend | `http://localhost:3000/health` |
| WebSocket | `http://localhost:3002/health` |

### Comandos de Monitoreo

```bash
# Uso de recursos
docker stats

# Espacio en disco
docker system df

# Logs en tiempo real
docker-compose logs -f --tail=100

# Procesos en contenedores
docker-compose top
```

---

## 💾 Backups

### Automáticos (Configurado)

Los backups automáticos se ejecutan diariamente a las 2:00 AM:
- Base de datos completa
- Subida a S3 (si configurado)
- Retención de 30 días

### Manual

```bash
# Backup manual
./deploy.sh backup

# Ver backups en S3
aws s3 ls s3://tu-bucket/daily/
```

---

## 🔧 Solución de Problemas

### Frontend no carga

```bash
# Ver logs del frontend
docker-compose logs frontend

# Verificar que el build fue exitoso
docker-compose exec frontend ls -la /usr/share/nginx/html

# Reiniciar frontend
docker-compose restart frontend
```

### API no responde

```bash
# Ver logs
docker-compose logs api

# Verificar conexión a DB
docker-compose exec api npx prisma db pull

# Reiniciar API
docker-compose restart api
```

### Error de CORS

```bash
# Verificar CORS_ORIGIN en .env
cat .env | grep CORS_ORIGIN

# Actualizar y reiniciar
nano .env
docker-compose restart api
```

---

## 📞 Soporte

- **Documentación**: `DEPLOYMENT.md`
- **Issues**: GitHub Issues
- **Email**: soporte@servistech.com

---

**Versión**: 4.0.0  
**Última actualización**: Febrero 2024
