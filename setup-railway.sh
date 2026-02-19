#!/bin/bash
# =============================================================================
# SERVISTECH ERP V4.0 - Script de Ayuda para Railway
# Este script automatiza la configuración inicial
# =============================================================================

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     SERVISTECH ERP V4.0 - Configuración para Railway         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para imprimir
print_step() {
    echo -e "${BLUE}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar que railway CLI está instalado
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI no está instalado"
    echo ""
    echo "Instálalo con: npm install -g @railway/cli"
    exit 1
fi

print_success "Railway CLI encontrado"

# Verificar login
print_step "Verificando sesión en Railway..."
railway whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    print_warning "No has iniciado sesión"
    echo "Ejecuta: railway login"
    exit 1
fi
print_success "Sesión activa"

# Menu
echo ""
echo "¿Qué quieres hacer?"
echo ""
echo "1) Configurar proyecto NUEVO"
echo "2) Configurar variables de entorno"
echo "3) Desplegar todo"
echo "4) Ver estado"
echo "5) Ver logs"
echo "6) Ejecutar migraciones"
echo "7) Crear usuario admin"
echo "0) Salir"
echo ""
read -p "Selecciona una opción (0-7): " opcion

case $opcion in
    1)
        echo ""
        print_step "Creando proyecto nuevo..."
        echo ""
        railway init
        
        echo ""
        print_step "Creando base de datos PostgreSQL..."
        railway add --database postgres
        
        echo ""
        print_step "Creando Redis..."
        railway add --database redis
        
        echo ""
        print_success "Proyecto creado!"
        echo ""
        echo "Ahora ejecuta este script de nuevo y selecciona opción 2"
        ;;
        
    2)
        echo ""
        print_step "Configurando variables de entorno..."
        echo ""
        
        # Generar JWT_SECRET aleatorio
        JWT_SECRET=$(openssl rand -base64 32)
        
        echo "Configurando JWT_SECRET..."
        railway variables set JWT_SECRET="$JWT_SECRET"
        
        echo ""
        read -p "Escribe tu dominio (ej: erp.tunegocio.com): " dominio
        railway variables set CORS_ORIGIN="https://$dominio"
        
        echo ""
        railway variables set BCV_SCRAPE_ENABLED="true"
        railway variables set BINANCE_API_ENABLED="true"
        railway variables set AUDIT_LOG_ENABLED="true"
        railway variables set RATE_CACHE_TTL="300"
        railway variables set JWT_EXPIRES_IN="24h"
        
        echo ""
        print_success "Variables configuradas!"
        echo ""
        echo "JWT_SECRET generado: $JWT_SECRET"
        echo "Guarda esta clave en un lugar seguro!"
        ;;
        
    3)
        echo ""
        print_step "Desplegando todo el sistema..."
        echo ""
        echo "Esto puede tomar 5-10 minutos..."
        echo ""
        railway up
        
        echo ""
        print_success "Despliegue completado!"
        echo ""
        railway status
        ;;
        
    4)
        echo ""
        railway status
        ;;
        
    5)
        echo ""
        echo "¿De qué servicio quieres ver los logs?"
        echo "1) servistech-api (Backend)"
        echo "2) servistech-erp (Frontend)"
        echo "3) servistech-websocket"
        echo "4) Todos"
        echo ""
        read -p "Selecciona (1-4): " log_option
        
        case $log_option in
            1) railway logs servistech-api ;;
            2) railway logs servistech-erp ;;
            3) railway logs servistech-websocket ;;
            4) railway logs ;;
            *) railway logs ;;
        esac
        ;;
        
    6)
        echo ""
        print_step "Ejecutando migraciones de base de datos..."
        echo ""
        railway run --service servistech-api npx prisma migrate deploy
        echo ""
        print_success "Migraciones completadas!"
        ;;
        
    7)
        echo ""
        print_step "Creando usuario administrador..."
        echo ""
        
        # Crear script temporal
        cat > /tmp/create-admin.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const admin = await prisma.user.upsert({
            where: { email: 'admin@servistech.com' },
            update: {},
            create: {
                email: 'admin@servistech.com',
                name: 'Administrador',
                password: hashedPassword,
                role: 'ADMIN',
                active: true,
                storeId: 1
            }
        });
        
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║              USUARIO ADMIN CREADO EXITOSAMENTE               ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log('  Email:    admin@servistech.com');
        console.log('  Password: Admin123!');
        console.log('');
        console.log('  ⚠️  IMPORTANTE: Cambia esta contraseña al entrar!');
        console.log('');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
EOF
        
        railway run --service servistech-api node /tmp/create-admin.js
        rm /tmp/create-admin.js
        ;;
        
    0)
        echo ""
        echo "¡Hasta luego!"
        exit 0
        ;;
        
    *)
        print_error "Opción no válida"
        exit 1
        ;;
esac

echo ""
