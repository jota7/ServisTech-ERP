# SERVISTECH ERP V4.0

Sistema de gestión técnica y comercial multi-sede con inteligencia financiera.

## 🚀 Características Principales

### 1. Multi-Tenancy con Row Level Security (RLS)
- Aislamiento completo de datos por sede
- Middleware automático de inyección de `store_id`
- Jerarquía de acceso granular (RBAC)

### 2. Gestión de Garantías Independiente
- Flujo de garantías vinculado a orden original
- Priorización automática en Kanban (carril superior)
- Auditabilidad: Error humano vs Repuesto defectuoso
- Causas documentadas con evidencia

### 3. Sistema de Comisiones y Contra-cargos
- **Técnicos**: 35% sobre utilidad bruta (configurable)
- **Encargadas**: $1 por equipo + 10% sobre accesorios
- Contra-cargos automáticos por daños/repuestos rotos
- Reportes de nómina con recibos de liquidación

### 4. Inteligencia Financiera
- Sincronización BCV (oficial) y Binance USDT (paralelo)
- Manual override con auditoría
- Cálculo COGS+: `Utilidad Bruta = Ingreso - (Repuesto + Flete + Costo Operativo + 10% Reserva)`
- Módulo de metas con gastos fijos vs punto de equilibrio

### 5. Portal de Delivery (Clientes)
- Solicitud de recolección con GPS
- Captura de credenciales (Patrón/PIN/Contraseña)
- Fotos del equipo
- Tracking público sin autenticación
- App móvil para mensajeros

### 6. Petty Cash con Evidencia
- Registro de gastos diarios
- **Carga obligatoria de fotos de comprobantes**
- Categorización de gastos
- Reportes por período

### 7. Inventario Segregado
- Separación estricta: Repuestos vs Accesorios
- Alertas de stock bajo
- Exportación de categorías a PDF
- Transferencias entre sedes

### 8. Audit Logs
- Registro de todo cambio financiero
- Cambios de estado en garantías
- Modificaciones manuales de tasas
- Historial completo con IP y timestamp

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis (opcional, para cache)
- S3/Cloudinary/Supabase Storage (para fotos)

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone https://github.com/servistech/erp-v4.git
cd erp-v4/api

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor
npm run dev
```

## 🔧 Configuración

### Variables de Entorno Importantes

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/servistech

# JWT
JWT_SECRET=your-super-secret-key

# Cloud Storage (elige uno)
# AWS S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=servistech-uploads

# O Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# BCV Scraper
BCV_SCRAPER_ENABLED=true
BCV_SCRAPER_CRON=0 8 * * *  # 8 AM diario
```

## 📚 API Documentation

La documentación completa está disponible en:
- Swagger UI: `http://localhost:3000/api-docs`
- Archivo YAML: `./swagger.yaml`

### Endpoints Principales

| Módulo | Endpoint | Descripción |
|--------|----------|-------------|
| Auth | `POST /api/auth/login` | Iniciar sesión |
| Órdenes | `GET /api/orders` | Listar órdenes |
| Garantías | `POST /api/warranties` | Crear garantía |
| Comisiones | `GET /api/commissions` | Listar comisiones |
| Delivery | `POST /api/delivery/requests` | Solicitar pickup |
| Tasas | `GET /api/bcv/current` | Tasa actual BCV |

## 🏗️ Arquitectura

```
src/
├── config/          # Configuración (DB, etc.)
├── controllers/     # Controladores de negocio
├── middleware/      # Middlewares (auth, RLS, audit)
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
├── utils/           # Utilidades
└── server.ts        # Punto de entrada
```

### Middlewares Clave

1. **Store Isolation**: Inyecta `store_id` automáticamente
2. **Audit Logger**: Registra cambios en entidades críticas
3. **Auth**: JWT con roles y permisos

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

## 🚀 Despliegue

### Railway (Recomendado)

```bash
# Instalar CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway init
railway up
```

### Docker

```bash
# Build
docker build -t servistech-api .

# Run
docker run -p 3000:3000 --env-file .env servistech-api
```

## 📊 Monitoreo

- Health check: `GET /health`
- Métricas: `GET /metrics` (Prometheus)
- Logs: Winston con rotación diaria

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📝 Licencia

Proprietary - SERVISTECH 2024

## 📞 Soporte

- Email: support@servistech.com
- WhatsApp: +58 424-123-4567
