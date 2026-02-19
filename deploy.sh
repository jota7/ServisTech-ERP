#!/bin/bash
# =============================================================================
# SERVISTECH ERP V4.0 - Deployment Script
# Automatiza el despliegue completo del sistema
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "VERIFICANDO PRERREQUISITOS"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        echo "Instala Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker instalado: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado"
        echo "Instala Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose instalado: $(docker-compose --version)"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_warning "Git no está instalado (opcional)"
    else
        print_success "Git instalado: $(git --version)"
    fi
}

# Setup environment
setup_environment() {
    print_header "CONFIGURANDO ENTORNO"
    
    if [ ! -f "$ENV_FILE" ]; then
        print_info "Creando archivo .env desde plantilla..."
        cp .env.example .env
        print_warning "Por favor edita el archivo .env con tus configuraciones"
        print_info "Ejecuta: nano .env"
        exit 1
    fi
    
    print_success "Archivo .env encontrado"
    
    # Check critical variables
    if ! grep -q "POSTGRES_PASSWORD=" .env || grep -q "POSTGRES_PASSWORD=your_secure_password" .env; then
        print_error "POSTGRES_PASSWORD no configurado en .env"
        exit 1
    fi
    
    if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=your_super_secret" .env; then
        print_error "JWT_SECRET no configurado en .env"
        exit 1
    fi
    
    print_success "Variables críticas configuradas"
}

# Build and start services
build_services() {
    print_header "CONSTRUYENDO SERVICIOS"
    
    print_info "Descargando imágenes base..."
    docker-compose pull
    
    print_info "Construyendo imágenes personalizadas..."
    docker-compose build --no-cache
    
    print_success "Imágenes construidas correctamente"
}

# Start services
start_services() {
    print_header "INICIANDO SERVICIOS"
    
    print_info "Iniciando servicios en modo detached..."
    docker-compose up -d
    
    print_info "Esperando que los servicios estén listos..."
    sleep 10
    
    # Check service health
    print_info "Verificando estado de los servicios..."
    docker-compose ps
}

# Run database migrations
run_migrations() {
    print_header "EJECUTANDO MIGRACIONES"
    
    print_info "Esperando PostgreSQL..."
    until docker-compose exec -T postgres pg_isready -U servistech > /dev/null 2>&1; do
        sleep 2
    done
    print_success "PostgreSQL listo"
    
    print_info "Ejecutando migraciones de Prisma..."
    docker-compose exec api npx prisma migrate deploy
    
    print_success "Migraciones completadas"
}

# Create admin user
create_admin() {
    print_header "CREANDO USUARIO ADMINISTRADOR"
    
    print_info "Generando usuario admin por defecto..."
    
    # Generate random password
    ADMIN_PASS=$(openssl rand -base64 12)
    
    docker-compose exec -T api npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash('$ADMIN_PASS', 10);
    
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
    
    console.log('Usuario admin creado/actualizado:', admin.email);
}

createAdmin()
    .catch(console.error)
    .finally(() => prisma.\$disconnect());
"
    
    print_success "Usuario admin creado"
    print_info "Email: admin@servistech.com"
    print_info "Password: $ADMIN_PASS"
    print_warning "¡Cambia esta contraseña después del primer login!"
}

# Verify deployment
verify_deployment() {
    print_header "VERIFICANDO DESPLIEGUE"
    
    # Check API health
    print_info "Verificando API..."
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
        print_success "API respondiendo correctamente"
    else
        print_error "API no responde"
        docker-compose logs api --tail=50
        exit 1
    fi
    
    # Check database
    print_info "Verificando base de datos..."
    if docker-compose exec postgres pg_isready -U servistech > /dev/null 2>&1; then
        print_success "PostgreSQL funcionando"
    else
        print_error "PostgreSQL no responde"
        exit 1
    fi
    
    # Check Redis
    print_info "Verificando Redis..."
    if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis funcionando"
    else
        print_error "Redis no responde"
        exit 1
    fi
    
    # Check Frontend
    print_info "Verificando Frontend..."
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Frontend respondiendo correctamente"
    else
        print_error "Frontend no responde"
        docker-compose logs frontend --tail=50
        exit 1
    fi
    
    # Check Nginx
    print_info "Verificando Nginx..."
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        print_success "Nginx respondiendo correctamente"
    else
        print_error "Nginx no responde"
        docker-compose logs nginx --tail=50
        exit 1
    fi
}

# Print final information
print_final_info() {
    print_header "DESPLIEGUE COMPLETADO"
    
    echo ""
    echo -e "${GREEN}¡SERVISTECH ERP V4.0 ha sido desplegado exitosamente!${NC}"
    echo ""
    echo -e "${BLUE}URLs de acceso:${NC}"
    echo "  • Aplicación Web: http://localhost"
    echo "  • API Directa: http://localhost:3001"
    echo "  • Frontend Directo: http://localhost:3000"
    echo "  • WebSocket: ws://localhost:3002"
    echo ""
    echo -e "${BLUE}Health Checks:${NC}"
    echo "  • Nginx: http://localhost/health"
    echo "  • API: http://localhost:3001/health"
    echo "  • Frontend: http://localhost:3000/health"
    echo ""
    echo -e "${BLUE}Comandos útiles:${NC}"
    echo "  • Ver logs: docker-compose logs -f"
    echo "  • Logs Frontend: docker-compose logs -f frontend"
    echo "  • Reiniciar: docker-compose restart"
    echo "  • Detener: docker-compose down"
    echo "  • Escalar API: docker-compose up -d --scale api=3"
    echo ""
    echo -e "${BLUE}Documentación:${NC}"
    echo "  • Guía completa: DEPLOYMENT.md"
    echo "  • API Docs: http://localhost:3001/api-docs"
    echo ""
    echo -e "${YELLOW}⚠ Recuerda configurar SSL/HTTPS para producción${NC}"
    echo ""
}

# Main deployment flow
main() {
    print_header "SERVISTECH ERP V4.0 - DESPLIEGUE AUTOMÁTICO"
    
    check_prerequisites
    setup_environment
    build_services
    start_services
    run_migrations
    create_admin
    verify_deployment
    print_final_info
}

# Handle command line arguments
case "${1:-}" in
    "stop")
        print_header "DETENIENDO SERVICIOS"
        docker-compose down
        print_success "Servicios detenidos"
        ;;
    "restart")
        print_header "REINICIANDO SERVICIOS"
        docker-compose restart
        print_success "Servicios reiniciados"
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "update")
        print_header "ACTUALIZANDO SERVICIOS"
        docker-compose pull
        docker-compose up -d --build
        print_success "Servicios actualizados"
        ;;
    "backup")
        print_header "CREANDO BACKUP MANUAL"
        docker-compose exec cron /app/scripts/backup-database.sh
        ;;
    "migrate")
        print_header "EJECUTANDO MIGRACIONES"
        docker-compose exec api npx prisma migrate deploy
        ;;
    "shell")
        docker-compose exec "${2:-api}" sh
        ;;
    "status")
        docker-compose ps
        ;;
    "help"|"-h"|"--help")
        echo "Uso: ./deploy.sh [comando]"
        echo ""
        echo "Comandos disponibles:"
        echo "  (sin argumento)  - Despliegue completo"
        echo "  stop             - Detener todos los servicios"
        echo "  restart          - Reiniciar servicios"
        echo "  logs [servicio]  - Ver logs (ej: logs api)"
        echo "  update           - Actualizar imágenes y reconstruir"
        echo "  backup           - Crear backup manual"
        echo "  migrate          - Ejecutar migraciones de base de datos"
        echo "  shell [servicio] - Acceder al shell de un servicio"
        echo "  status           - Ver estado de los servicios"
        echo "  help             - Mostrar esta ayuda"
        ;;
    *)
        main
        ;;
esac
