# SERVISTECH ERP V4.0 - Resumen de Correcciones

## Problemas Resueltos

### 1. Schema de Prisma Corrupto
**Problema:** El archivo `prisma/schema.prisma` tenía contenido duplicado y estaba incompleto.

**Solución:** Se creó un schema completo y limpio con todos los modelos y enums necesarios:

#### Enums Agregados:
- `RegisterStatus` (OPEN, CLOSED, DISCREPANCY)
- `TransferStatus` (PENDING, APPROVED, REJECTED, IN_TRANSIT, RECEIVED)
- `CommissionStatus` (PENDIENTE, PAGADA, CANCELADA)
- `DebitReason` (RETRASO, ERROR_REPARACION, DAÑO_EQUIPO, PERDIDA_REPUESTO, QUEJA_CLIENTE, OTRO)
- `ExpenseCategory` (ALQUILER, SERVICIOS, NOMINA, SUMINISTROS, MANTENIMIENTO, OTROS)
- `WarrantyStatus` (ACTIVE, RESOLVED, EXPIRED)
- `WarrantyCause` (MISDIAGNOSIS, DEFECTIVE_PART, HUMAN_ERROR, NEW_ISSUE, OTHER)

#### Modelos Agregados:
- `WarrantyClaim` - Gestión de garantías
- `StockTransfer` - Transferencias entre sedes
- `TimeEntry` - Registro de tiempo de técnicos
- `QAResult` / `QATest` - Control de calidad
- `Commission` - Comisiones de técnicos
- `TechnicianDebit` - Débitos/contra-cargos
- `FixedExpense` - Gastos fijos
- `DailyTarget` - Metas diarias
- `SafeKit` - Kits de seguridad
- `CourtesyDevice` / `DeviceLoan` - Dispositivos de cortesía
- `DeliveryRequest` - Solicitudes de delivery
- `CashRegister` - Control de caja
- `PettyCashExpense` - Gastos de caja chica
- `AuditLog` - Auditoría
- `WhatsAppTemplate` - Plantillas WhatsApp
- `PrintFormat` - Formatos de impresión

### 2. Controladores Incompletos

#### warrantyController.ts
**Funciones agregadas:**
- `updateWarrantyStatus` - Actualizar estado de garantía
- `getWarrantyStats` - Estadísticas de garantías
- `getWarrantiesByTechnician` - Garantías por técnico

#### commissionController.ts
**Funciones agregadas:**
- `getCommissionSummary` - Resumen de comisiones
- `generatePayrollReport` - Reporte de nómina

#### targetController.ts
**Funciones agregadas:**
- `calculateDailyTarget` - Calcular meta diaria
- `getTargetsDashboard` - Dashboard de metas

#### deliveryController.ts
**Funciones agregadas:**
- `updateDeliveryStatus` - Actualizar estado de delivery
- `convertToOrder` - Convertir solicitud a orden
- `getMessengerRequests` - Solicitudes por mensajero
- `trackDelivery` - Tracking público

#### pettyCashController.ts
**Funciones agregadas:**
- `getExpensesReport` - Reporte de gastos
- `getUploadUrl` - URL para subir fotos

#### orderController.ts
**Funciones agregadas:**
- `updateOrderStatus` - Actualizar estado de orden
- `addTimeEntry` - Agregar entrada de tiempo
- `endTimeEntry` - Finalizar entrada de tiempo
- `getKanbanBoard` - Tablero Kanban

#### invoiceController.ts
**Funciones agregadas:**
- `getDailyReport` - Reporte diario de facturas

### 3. Correcciones en el Schema

#### Campos agregados a modelos existentes:
- `ServiceOrder`: `totalCost`, `grossProfit`, `completedAt`
- `Invoice`: `discount`, `igtfAmount`
- `User`: Relaciones faltantes (`timeEntries`, `openedRegisters`, `auditLogs`, `debits`)
- `Store`: Relaciones faltantes (`cashRegisters`, `fixedExpenses`, `dailyTargets`, `safeKits`, `courtesyDevices`, `transfersFrom`, `transfersTo`)
- `Customer`: Relación `deviceLoans`
- `Part`: Relación `transfers`

### 4. Correcciones en el Dockerfile

**Problema:** Typo en `freebtype` (debería ser `freetype`)

**Solución:** Se corrigió el typo y se optimizó el multi-stage build.

### 5. Configuración de Railway

**Archivo creado:** `railway.toml`
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "sh -c 'npx prisma migrate deploy && npx prisma generate && node dist/server.js'"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

## Pasos para Desplegar en Railway

### 1. Preparar el Repositorio
```bash
cd /mnt/okcomputer/output/api
git init
git add .
git commit -m "SERVISTECH V4.0 - Schema completo y controladores sincronizados"
```

### 2. Crear Proyecto en Railway
1. Ir a https://railway.app
2. Crear nuevo proyecto
3. Seleccionar "Deploy from GitHub repo"
4. Conectar tu repositorio

### 3. Configurar Variables de Entorno
En Railway Dashboard → Variables, agregar:

**Obligatorias:**
- `DATABASE_URL` - URL de PostgreSQL (Railway puede provisionar uno)
- `JWT_SECRET` - Clave secreta para JWT (generar una larga y segura)
- `NODE_ENV` = `production`
- `PORT` = `3000`

**Opcionales:**
- `FRONTEND_URL` - URL del frontend para CORS
- `BCV_SCRAPER_ENABLED` = `true`
- `BCV_SCRAPER_CRON` = `0 8 * * *`

### 4. Configurar Base de Datos
En Railway:
1. Click en "New" → "Database" → "Add PostgreSQL"
2. Railway creará automáticamente la variable `DATABASE_URL`

### 5. Desplegar
Railway detectará automáticamente el `Dockerfile` y el `railway.toml`.

El proceso de build:
1. Instala dependencias
2. Genera el cliente Prisma
3. Compila TypeScript
4. Ejecuta migraciones
5. Inicia el servidor

### 6. Verificar Deploy
```bash
curl https://tu-app.railway.app/health
```

Debería retornar:
```json
{
  "status": "ok",
  "version": "4.0.0",
  "features": [
    "multi-tenancy",
    "warranty-management",
    "commission-system",
    "target-tracking",
    "delivery-portal",
    "petty-cash",
    "binance-rates"
  ]
}
```

## Estructura del Proyecto

```
api/
├── prisma/
│   └── schema.prisma      # Schema completo con todos los modelos
├── src/
│   ├── config/
│   │   └── database.ts    # Configuración de Prisma
│   ├── controllers/       # Todos los controladores sincronizados
│   ├── middleware/        # Auth, validación, errores
│   ├── routes/            # Rutas de la API
│   ├── services/          # Servicios (BCV scraper, etc.)
│   ├── utils/             # Utilidades y schemas
│   └── server.ts          # Punto de entrada
├── Dockerfile             # Multi-stage build corregido
├── railway.toml           # Configuración de Railway
├── package.json           # Dependencias
├── tsconfig.json          # Configuración TypeScript
└── .env.example           # Variables de entorno de ejemplo
```

## Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Login de usuarios

### Órdenes
- `GET /api/orders` - Listar órdenes
- `POST /api/orders` - Crear orden
- `GET /api/orders/:id` - Ver orden
- `PATCH /api/orders/:id/status` - Cambiar estado
- `GET /api/orders/kanban/board` - Tablero Kanban

### Facturas
- `GET /api/invoices` - Listar facturas
- `POST /api/invoices` - Crear factura
- `POST /api/invoices/:id/payments` - Agregar pago

### Inventario
- `GET /api/inventory/parts` - Listar repuestos
- `POST /api/inventory/parts` - Crear repuesto
- `GET /api/inventory/stock` - Ver stock

### V4.0 - Nuevos Módulos
- `GET /api/warranties` - Garantías
- `GET /api/commissions` - Comisiones
- `GET /api/targets/dashboard` - Metas
- `GET /api/delivery/requests` - Delivery
- `GET /api/petty-cash/register/:id/expenses` - Caja chica

## Notas Importantes

1. **Prisma Client:** Se regenera automáticamente en cada deploy
2. **Migraciones:** Se ejecutan automáticamente al iniciar (`prisma migrate deploy`)
3. **Health Check:** Endpoint `/health` para monitoreo
4. **Puppeteer:** Configurado para usar Chromium del sistema en producción

## Solución de Problemas

### Error: "Prisma Client no generado"
```bash
npm run db:generate
```

### Error: "Tablas no existen"
```bash
npm run db:migrate
# o
npm run db:push
```

### Error: "Puerto en uso"
Verificar que `PORT` esté configurado en las variables de entorno.

## Soporte

Para reportar problemas o solicitar ayuda:
1. Revisar logs en Railway Dashboard
2. Verificar variables de entorno
3. Comprobar conexión a base de datos
