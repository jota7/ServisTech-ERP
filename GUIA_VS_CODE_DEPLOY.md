# 🖥️ GUÍA: Desplegar SERVISTECH ERP desde Visual Studio Code

## Paso a paso para principiantes

---

## 📥 PASO 1: Instalar Visual Studio Code

1. Ve a **https://code.visualstudio.com/**
2. Descarga la versión para tu sistema operativo (Windows/Mac/Linux)
3. Instálalo con las opciones por defecto

---

## 🔧 PASO 2: Instalar Extensiones Necesarias

Abre VS Code y presiona `Ctrl+Shift+X` (o `Cmd+Shift+X` en Mac) para abrir Extensiones.

Busca e instala estas extensiones:

| Extensión | Para qué sirve |
|-----------|----------------|
| **GitHub Pull Requests** | Conectar con GitHub |
| **Docker** | Ver contenedores (opcional) |
| **PostgreSQL** | Ver base de datos (opcional) |
| **ESLint** | Detectar errores de código |
| **Prettier** | Formatear código |

---

## 📂 PASO 3: Abrir el Proyecto en VS Code

### Opción A: Desde la carpeta

1. Abre VS Code
2. Ve a **File → Open Folder** (Archivo → Abrir Carpeta)
3. Selecciona la carpeta `servistech-erp`
4. Haz clic en **Select Folder**

### Opción B: Desde terminal

```bash
# Windows
cd C:\Users\TuUsuario\servistech-erp
code .

# Mac/Linux
cd ~/servistech-erp
code .
```

---

## 🔐 PASO 4: Configurar Git en VS Code

### 4.1 Verificar que Git está instalado

Presiona `` Ctrl+` `` (la tecla debajo de Esc) para abrir la terminal integrada.

Escribe:
```bash
git --version
```

Si muestra un número de versión, ¡perfecto! Si no, descarga Git desde https://git-scm.com/

### 4.2 Configurar tu nombre y email en Git

En la terminal de VS Code, escribe:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tuemail@ejemplo.com"
```

---

## 📤 PASO 5: Subir el Proyecto a GitHub desde VS Code

### 5.1 Inicializar repositorio Git

En la terminal de VS Code:

```bash
git init
```

### 5.2 Crear archivo .gitignore

En VS Code, crea un archivo llamado `.gitignore` en la raíz del proyecto:

```
# Dependencias
node_modules/
*/node_modules/

# Build
dist/
build/

# Variables de entorno
.env
.env.local

# Logs
*.log
logs/

# Base de datos
*.db
*.sqlite

# IDE
.vscode/settings.json
.idea/

# OS
.DS_Store
Thumbs.db
```

### 5.3 Agregar archivos al commit

En VS Code, presiona `Ctrl+Shift+G` para abrir la pestaña de Source Control.

Verás todos los archivos en verde (nuevos) o amarillo (modificados).

Haz clic en el **+** (stage changes) junto a cada archivo o en **Changes** para agregar todos.

### 5.4 Escribir mensaje de commit

En el cuadro de texto que dice "Message", escribe:

```
Primer commit - SERVISTECH ERP V4.0
```

Haz clic en el **✓** (commit icon) arriba.

### 5.5 Conectar con GitHub

En la terminal de VS Code:

```bash
# Crear repositorio en GitHub (si no lo has hecho)
# Luego conectar:
git remote add origin https://github.com/TU_USUARIO/servistech-erp.git
```

### 5.6 Subir cambios

En VS Code, haz clic en **...** (more actions) → **Push**

O en terminal:

```bash
git push -u origin main
```

---

## 🚂 PASO 6: Instalar Railway CLI

En la terminal de VS Code:

```bash
# Instalar Railway CLI globalmente
npm install -g @railway/cli
```

Verifica la instalación:

```bash
railway --version
```

---

## 🔑 PASO 7: Login en Railway

En la terminal de VS Code:

```bash
railway login
```

Esto abrirá tu navegador. Haz clic en **Authorize**.

---

## 🆕 PASO 8: Crear Proyecto en Railway

En la terminal de VS Code (dentro de la carpeta del proyecto):

```bash
railway init
```

Te preguntará:
- **Project Name**: escribe `servistech-erp`
- **Environment**: selecciona `production` con las flechas

---

## 🗄️ PASO 9: Crear Bases de Datos

### 9.1 Crear PostgreSQL

En la terminal de VS Code:

```bash
railway add --database postgres
```

Espera a que termine (aparece mensaje verde).

### 9.2 Crear Redis

```bash
railway add --database redis
```

---

## ⚙️ PASO 10: Configurar Variables de Entorno

### 10.1 Abrir Variables en Railway

En la terminal de VS Code:

```bash
railway open
```

Se abrirá el dashboard de Railway en tu navegador.

### 10.2 Agregar variables

Haz clic en el servicio **servistech-api** → pestaña **Variables** → **New Variable**

Agrega estas variables una por una:

| Nombre | Valor |
|--------|-------|
| `JWT_SECRET` | `servistech2024clavemuysegura123` (cambia por algo único) |
| `CORS_ORIGIN` | `*` (temporalmente) |
| `BCV_SCRAPE_ENABLED` | `true` |
| `BINANCE_API_ENABLED` | `true` |
| `AUDIT_LOG_ENABLED` | `true` |
| `RATE_CACHE_TTL` | `300` |
| `JWT_EXPIRES_IN` | `24h` |

---

## 🚀 PASO 11: Desplegar el Proyecto

### 11.1 Desde VS Code Terminal

En la terminal de VS Code:

```bash
railway up
```

Esto subirá TODO el proyecto a Railway.

Verás mucho texto corriendo. Espera 5-10 minutos.

Cuando veas:
```
✔ Successfully deployed
```

¡Listo!

### 11.2 Ver el estado

```bash
railway status
```

Verás las URLs de tus servicios.

---

## 🌐 PASO 12: Configurar Dominio (Cloudflare)

### 12.1 Obtener URLs de Railway

En la terminal:

```bash
railway status
```

Anota estas URLs:
- Frontend: `https://servistech-erp...`
- API: `https://servistech-api...`

### 12.2 Configurar DNS en Cloudflare

1. Ve a **cloudflare.com** → tu dominio → **DNS**
2. Agrega estos registros CNAME:

| Tipo | Nombre | Target |
|------|--------|--------|
| CNAME | erp | (URL del frontend de Railway) |
| CNAME | api | (URL del API de Railway) |

### 12.3 Actualizar CORS_ORIGIN

Vuelve a Railway → Variables → cambia `CORS_ORIGIN` a tu dominio real:

```
https://erp.tudominio.com
```

---

## 🗄️ PASO 13: Crear Base de Datos (Migraciones)

### 13.1 Abrir consola de Railway

En el dashboard de Railway:
1. Haz clic en el servicio **servistech-api**
2. Ve a la pestaña **Console**

### 13.2 Ejecutar migraciones

En la consola de Railway, escribe:

```bash
npx prisma migrate deploy
```

Si te pregunta, escribe `y` y presiona Enter.

---

## 👤 PASO 14: Crear Usuario Administrador

En la consola de Railway:

```bash
npx ts-node scripts/create-admin.ts
```

Te dará:
- **Email**: `admin@servistech.com`
- **Password**: `Admin123!`

**¡Cambia esta contraseña al entrar!**

---

## ✅ PASO 15: Verificar que Todo Funciona

### 15.1 Probar el frontend

Abre en tu navegador:
```
https://erp.tudominio.com
```

Debe mostrar la página de login.

### 15.2 Probar el API

Abre:
```
https://api.tudominio.com/health
```

Debe mostrar: `{"status":"healthy"}`

---

## 🔄 PASO 16: Actualizar el Proyecto (Cuando hagas cambios)

Cada vez que modifiques código:

### 16.1 Guardar cambios en VS Code

Presiona `Ctrl+S` (o `Cmd+S` en Mac) para guardar.

### 16.2 Hacer commit

En VS Code:
1. `Ctrl+Shift+G` (Source Control)
2. Escribe mensaje de commit
3. Haz clic en **✓**
4. Haz clic en **...** → **Push**

### 16.3 Railway se actualiza automáticamente

Railway detecta el push y redeploya automáticamente.

---

## 🛠️ COMANDOS ÚTILES EN VS CODE

| Acción | Comando/Atajo |
|--------|---------------|
| Abrir Terminal | `` Ctrl+` `` |
| Guardar archivo | `Ctrl+S` |
| Buscar archivo | `Ctrl+P` |
| Source Control | `Ctrl+Shift+G` |
| Extensiones | `Ctrl+Shift+X` |
| Buscar en todo el proyecto | `Ctrl+Shift+F` |

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Error: "git is not recognized"

Instala Git desde https://git-scm.com/

### Error: "railway: command not found"

```bash
npm install -g @railway/cli
```

### Error: "Cannot find module"

En la terminal de VS Code:
```bash
cd api
npm install
cd ../app
npm install
```

### Error de build en Railway

En la consola de Railway:
```bash
rm -rf node_modules dist
npm install
npx prisma generate
npm run build
```

---

## 📞 ¿NECESITAS AYUDA?

Si tienes algún error específico, copia el mensaje de error completo y pregúntame.
