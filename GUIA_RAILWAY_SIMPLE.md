# 🚂 GUÍA SIMPLE: Desplegar SERVISTECH ERP en Railway

## 📋 ANTES DE EMPEZAR

Necesitas:
- ✅ Cuenta en Railway (railway.app)
- ✅ Tu dominio ya configurado (ej: erp.tunegocio.com)
- ✅ Este proyecto en tu computadora

---

## 🚀 PASO 1: Instalar Railway en tu computadora

### En Windows:
1. Abre **PowerShell como Administrador**
2. Copia y pega este comando:
```powershell
npm install -g @railway/cli
```

### En Mac:
1. Abre **Terminal**
2. Copia y pega:
```bash
npm install -g @railway/cli
```

### En Linux:
```bash
npm install -g @railway/cli
```

---

## 🔐 PASO 2: Conectar Railway con tu cuenta

En la misma ventana (PowerShell/Terminal), escribe:

```bash
railway login
```

Esto abrirá tu navegador. **Haz click en "Authorize"** para permitir el acceso.

---

## 📁 PASO 3: Entrar a la carpeta del proyecto

Navega a donde está tu proyecto:

```bash
# Windows (ejemplo, cambia la ruta)
cd C:\Users\TuNombre\servistech-erp

# Mac/Linux
cd ~/servistech-erp
```

---

## 🆕 PASO 4: Crear el proyecto en Railway

Escribe este comando:

```bash
railway init
```

Te preguntará:
1. **"Project Name"** → Escribe: `servistech-erp`
2. **"Environment"** → Selecciona: `production` (con las flechas ↑ ↓)

---

## 🗄️ PASO 5: Crear la Base de Datos

Railway necesita 2 bases de datos. Ejecuta estos comandos **uno por uno**:

### Crear PostgreSQL:
```bash
railway add --database postgres
```

Espera que termine (aparece un mensaje verde).

### Crear Redis:
```bash
railway add --database redis
```

---

## ⚙️ PASO 6: Configurar Variables Secretas

Ahora vamos a poner las contraseñas y configuraciones. **Ejecuta uno por uno**:

### 6.1 Contraseña para JWT (tokens de seguridad)
```bash
railway variables set JWT_SECRET="servistech2024clavemuysegura123"
```

### 6.2 Origen permitido (tu dominio)
```bash
railway variables set CORS_ORIGIN="https://erp.tunegocio.com"
```

> ⚠️ **IMPORTANTE**: Cambia `erp.tunegocio.com` por TU dominio real

### 6.3 Activar scraping de BCV
```bash
railway variables set BCV_SCRAPE_ENABLED="true"
```

### 6.4 Activar Binance
```bash
railway variables set BINANCE_API_ENABLED="true"
```

### 6.5 Activar auditoría
```bash
railway variables set AUDIT_LOG_ENABLED="true"
```

---

## 🚀 PASO 7: ¡DESPLEGAR TODO!

Este comando sube TODO el sistema:

```bash
railway up
```

Verás mucho texto corriendo. **Espera a que termine** (puede tomar 5-10 minutos).

Cuando veas algo como:
```
✔ Successfully deployed
```

¡Listo! 🎉

---

## 🔗 PASO 8: Ver las URLs generadas

Escribe:

```bash
railway status
```

Verás algo así:
```
🚂 servistech-erp
├── 🚀 servistech-api: https://servistech-api.up.railway.app
├── 🚀 servistech-erp: https://servistech-erp.up.railway.app
├── 🚀 servistech-websocket: wss://servistech-websocket.up.railway.app
├── 🗄️ Postgres: postgres://... (internal)
└── 🗄️ Redis: redis://... (internal)
```

**Anota estas URLs**, las necesitarás.

---

## 🌐 PASO 9: Configurar tu Dominio Personalizado

### 9.1 Entra al dashboard de Railway:
```bash
railway open
```

Se abrirá tu navegador.

### 9.2 Configurar dominio para el FRONTEND:
1. Busca el servicio llamado **"servistech-erp"** (el frontend)
2. Click en **"Settings"**
3. Busca **"Domains"**
4. Click en **"+ Custom Domain"**
5. Escribe tu dominio: `erp.tunegocio.com`
6. Click **"Add"**

### 9.3 Configurar dominio para el API:
1. Busca el servicio **"servistech-api"**
2. Click en **"Settings"**
3. Busca **"Domains"**
4. Click en **"+ Custom Domain"**
5. Escribe: `api.tunegocio.com`
6. Click **"Add"**

### 9.4 Configurar dominio para WebSocket:
1. Busca el servicio **"servistech-websocket"**
2. Click en **"Settings"**
3. Busca **"Domains"**
4. Click en **"+ Custom Domain"**
5. Escribe: `ws.tunegocio.com`
6. Click **"Add"**

---

## 📝 PASO 10: Configurar DNS en tu proveedor de dominio

Ve a donde compraste tu dominio (GoDaddy, Namecheap, Cloudflare, etc.) y crea estos registros:

| Tipo | Nombre | Valor |
|------|--------|-------|
| CNAME | erp | [URL de Railway del frontend] |
| CNAME | api | [URL de Railway del API] |
| CNAME | ws | [URL de Railway del websocket] |

**Ejemplo:**
```
CNAME  erp  servistech-erp.up.railway.app
CNAME  api  servistech-api.up.railway.app
CNAME  ws   servistech-websocket.up.railway.app
```

---

## 🔄 PASO 11: Actualizar Variables con los Dominios Nuevos

Una vez que Railway te dio los dominios personalizados, actualiza las variables:

```bash
railway variables set CORS_ORIGIN="https://erp.tunegocio.com"
```

Luego redeploy:
```bash
railway up
```

---

## ✅ PASO 12: Verificar que todo funciona

### Prueba 1: El frontend carga
Abre en tu navegador:
```
https://erp.tunegocio.com
```
Debería mostrar la página de login.

### Prueba 2: El API responde
Abre:
```
https://api.tunegocio.com/health
```
Debería decir: `{"status":"healthy"}`

### Prueba 3: WebSocket funciona
```bash
railway logs servistech-websocket
```
Debe mostrar "WebSocket server running"

---

## 🗄️ PASO 13: Crear la Base de Datos (Migraciones)

Necesitas crear las tablas en la base de datos:

```bash
railway run --service servistech-api npx prisma migrate deploy
```

Si te pide confirmar, escribe `y` y ENTER.

---

## 👤 PASO 14: Crear Usuario Administrador

Crea tu cuenta de admin:

```bash
railway run --service servistech-api npx ts-node scripts/create-admin.ts
```

Te dará:
- Email: `admin@servistech.com`
- Contraseña: (generada automáticamente)

**¡Cambia esta contraseña al entrar!**

---

## 🎉 ¡LISTO! 

Tu sistema está funcionando en:
- 🌐 **Frontend**: https://erp.tunegocio.com
- 🔌 **API**: https://api.tunegocio.com
- ⚡ **WebSocket**: wss://ws.tunegocio.com

---

## 🔄 ACTUALIZAR DESPUÉS (Cuando hagas cambios)

Cuando modifiques código y quieras actualizar:

```bash
# 1. Subir cambios a Git (si usas GitHub)
git add .
git commit -m "Mis cambios"
git push origin main

# 2. Railway se actualiza automático
# O si quieres forzar:
railway up
```

---

## ❌ SI ALGO FALLA

### Error: "Cannot find service"
```bash
railway link
# Selecciona tu proyecto
```

### Error: "Database connection failed"
Verifica que PostgreSQL esté creado:
```bash
railway status
```
Debe aparecer 🗄️ Postgres

### Error: "JWT_SECRET not set"
```bash
railway variables set JWT_SECRET="tuclavesegura123"
```

### Ver logs de errores:
```bash
# Logs de todo
railway logs

# Logs de un servicio específico
railway logs servistech-api
railway logs servistech-erp
```

---

## 📞 COMANDOS ÚTILES PARA RECORDAR

| Comando | Qué hace |
|---------|----------|
| `railway status` | Ver estado de todo |
| `railway logs` | Ver errores en tiempo real |
| `railway up` | Subir cambios |
| `railway open` | Abrir dashboard en navegador |
| `railway variables` | Ver variables configuradas |
| `railway run --service servistech-api [comando]` | Ejecutar comando en el API |

---

## 💰 COSTOS EN RAILWAY

Railway tiene plan gratuito con:
- ✅ $5 de crédito mensual
- ✅ PostgreSQL incluido
- ✅ Redis incluido
- ✅ SSL gratuito

Para producción real, considera el plan Starter ($5/mes).

---

**¿Tienes algún error específico?** Escríbemelo y te ayudo a solucionarlo paso a paso.
