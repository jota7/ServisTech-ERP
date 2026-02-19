# 🚀 SERVISTECH ERP - Backend API

API REST completa para el sistema ERP de gestión técnica y comercial.

## 📋 Requisitos

- Node.js 20+
- PostgreSQL 15+
- Redis 7+ (opcional, para caché)

## 🚀 Instalación Rápida

### Opción 1: Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/servistech-api.git
cd servistech-api

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 3. Iniciar con Docker Compose
docker-compose up -d

# 4. Ver logs
docker-compose logs -f api
```

### Opción 2: Instalación Manual

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 3. Configurar base de datos
npx prisma migrate dev
npx prisma db seed

# 4. Iniciar en modo desarrollo
npm run dev

# 5. O iniciar en modo producción
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
api/
├── src/
│   ├── config/         # Configuración (DB, etc.)
│   ├── controllers/    # Controladores de rutas
│   ├── middleware/     # Middleware (auth, validación, errores)
│   ├── routes/         # Definición de rutas
│   ├── services/       # Servicios (BCV scraper, etc.)
│   ├── utils/          # Utilidades (logger, schemas, response)
│   └── server.ts       # Punto de entrada
├── prisma/
│   ├── schema.prisma   # Esquema de base de datos
│   └── seed.ts         # Datos iniciales
├── docker-compose.yml  # Configuración Docker
├── Dockerfile          # Imagen Docker
└── package.json
```

## 🔐 Variables de Entorno

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/servistech?schema=public"

# JWT
JWT_SECRET="tu_secreto_super_seguro_aqui_minimo_32_caracteres"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL="http://localhost:5173"

# BCV Scraper
BCV_SCRAPER_ENABLED=true
BCV_SCRAPER_CRON="0 8 * * *"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"
```

## 📚 API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario (Admin) |
| GET | `/api/auth/profile` | Perfil del usuario |
| POST | `/api/auth/refresh` | Refrescar token |
| POST | `/api/auth/change-password` | Cambiar contraseña |

### Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar usuarios |
| GET | `/api/users/:id` | Obtener usuario |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |
| POST | `/api/users/:id/reset-password` | Resetear contraseña |

### Clientes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/customers` | Listar clientes |
| GET | `/api/customers/:id` | Obtener cliente |
| POST | `/api/customers` | Crear cliente |
| PUT | `/api/customers/:id` | Actualizar cliente |
| DELETE | `/api/customers/:id` | Eliminar cliente |
| GET | `/api/customers/stats/:id` | Estadísticas del cliente |

### Órdenes de Servicio
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/orders` | Listar órdenes |
| GET | `/api/orders/kanban/board` | Tablero Kanban |
| GET | `/api/orders/:id` | Obtener orden |
| POST | `/api/orders` | Crear orden |
| PUT | `/api/orders/:id` | Actualizar orden |
| PATCH | `/api/orders/:id/status` | Cambiar estado |
| POST | `/api/orders/:id/parts` | Agregar repuesto |
| POST | `/api/orders/:id/time` | Iniciar timer |
| PATCH | `/api/orders/:id/time/:entryId/end` | Finalizar timer |

### Inventario
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/inventory/parts` | Listar repuestos |
| GET | `/api/inventory/parts/:id` | Obtener repuesto |
| POST | `/api/inventory/parts` | Crear repuesto |
| PUT | `/api/inventory/parts/:id` | Actualizar repuesto |
| POST | `/api/inventory/parts/:id/stock` | Actualizar stock |
| GET | `/api/inventory/transfers` | Listar transferencias |
| POST | `/api/inventory/transfers` | Crear transferencia |
| PATCH | `/api/inventory/transfers/:id/status` | Actualizar transferencia |

### Facturación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/invoices` | Listar facturas |
| GET | `/api/invoices/:id` | Obtener factura |
| POST | `/api/invoices` | Crear factura |
| POST | `/api/invoices/:id/payments` | Agregar pago |
| PATCH | `/api/invoices/:id/cancel` | Cancelar factura |
| GET | `/api/invoices/reports/daily` | Reporte diario |

### Caja
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/cash-register/current/:storeId` | Caja actual |
| GET | `/api/cash-register/history/:storeId` | Historial de cajas |
| GET | `/api/cash-register/summary/:storeId` | Resumen de caja |
| POST | `/api/cash-register/open/:storeId` | Abrir caja |
| POST | `/api/cash-register/close/:id` | Cerrar caja |
| POST | `/api/cash-register/expenses/:id` | Agregar gasto |

### Sedes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stores` | Listar sedes |
| GET | `/api/stores/:id` | Obtener sede |
| POST | `/api/stores` | Crear sede |
| PUT | `/api/stores/:id` | Actualizar sede |
| DELETE | `/api/stores/:id` | Eliminar sede |
| GET | `/api/stores/stats/:id` | Estadísticas de sede |

### Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/kpis` | KPIs del dashboard |
| GET | `/api/dashboard/charts/revenue` | Gráfico de ingresos |
| GET | `/api/dashboard/charts/orders-by-status` | Órdenes por estado |
| GET | `/api/dashboard/charts/top-services` | Servicios más solicitados |
| GET | `/api/dashboard/activity/recent` | Actividad reciente |

### BCV (Tasa de Cambio)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/bcv/current` | Tasa actual |
| GET | `/api/bcv/history` | Historial de tasas |
| POST | `/api/bcv/update` | Actualizar tasa manual |
| POST | `/api/bcv/scrape` | Ejecutar scraper |
| POST | `/api/bcv/convert` | Convertir USD a VES |

## 🔒 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación.

### Headers requeridos:
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Obtener token:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@servistech.com","password":"admin123"}'
```

## 👥 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| `SUPER_ADMIN` | Acceso total al sistema |
| `GERENTE` | Gestión de sede, usuarios, reportes |
| `ANFITRION` | Recepción, facturación, caja |
| `TECNICO` | Diagnósticos, reparaciones |
| `QA` | Control de calidad |
| `ALMACEN` | Gestión de inventario |

## 🗄️ Base de Datos

### Comandos Prisma útiles:

```bash
# Generar cliente Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Resetear base de datos
npx prisma migrate reset

# Sembrar datos
npx prisma db seed

# Abrir Studio (UI de base de datos)
npx prisma studio
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests con coverage
npm run test:coverage
```

## 📝 Logging

Los logs se guardan en la carpeta `logs/`:
- `combined.log` - Todos los logs
- `error.log` - Solo errores
- `exceptions.log` - Excepciones no capturadas

## 🐳 Docker

### Comandos útiles:

```bash
# Construir imagen
docker build -t servistech-api .

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir
docker-compose up -d --build
```

## 🚀 Deploy en Producción

### Railway (Recomendado)

1. Crear cuenta en [railway.app](https://railway.app)
2. Conectar repositorio de GitHub
3. Agregar variables de entorno
4. Deploy automático

### Render

1. Crear cuenta en [render.com](https://render.com)
2. Crear nuevo Web Service
3. Conectar repositorio
4. Configurar variables de entorno
5. Deploy

### VPS (DigitalOcean, AWS, etc.)

```bash
# 1. Instalar Docker en el servidor
curl -fsSL https://get.docker.com | sh

# 2. Clonar repositorio
git clone https://github.com/tu-usuario/servistech-api.git
cd servistech-api

# 3. Configurar variables de entorno
nano .env

# 4. Iniciar servicios
docker-compose up -d

# 5. Configurar SSL con Let's Encrypt
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@servistech.com
- Teléfono: +58 212-123-4567

## 📄 Licencia

MIT License - Ver LICENSE para más detalles.

---

<p align="center">
  <strong>SERVISTECH ERP</strong> - Gestión técnica y comercial
</p>
