#!/bin/bash

# Script para ejecutar la aplicación en modo desarrollo
# Uso: ./scripts/docker-dev.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que docker-compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose no está instalado. Por favor instala docker-compose primero."
    exit 1
fi

print_message "Iniciando aplicación en modo desarrollo..."

# Detener contenedores existentes
print_message "Deteniendo contenedores existentes..."
docker-compose -f docker-compose.dev.yml down || true

# Construir y ejecutar en modo desarrollo
print_message "Construyendo y ejecutando contenedor de desarrollo..."
if docker-compose -f docker-compose.dev.yml up --build; then
    print_success "Aplicación de desarrollo iniciada exitosamente!"
    print_message "Aplicación disponible en: http://localhost:3001"
    print_message "Hot reload está activado - los cambios se reflejarán automáticamente"
else
    print_error "Error al iniciar la aplicación de desarrollo"
    exit 1
fi
