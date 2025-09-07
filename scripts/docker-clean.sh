#!/bin/bash

# Script para limpiar recursos Docker
# Uso: ./scripts/docker-clean.sh [--all]

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

# Verificar si se debe limpiar todo
CLEAN_ALL=false
if [[ "$1" == "--all" ]]; then
    CLEAN_ALL=true
fi

print_message "Iniciando limpieza de recursos Docker..."

# Detener y eliminar contenedores de la aplicación
print_message "Deteniendo contenedores de la aplicación..."
docker ps -a --filter "name=financial-news-app" --format "{{.Names}}" | xargs -r docker stop
docker ps -a --filter "name=financial-news-app" --format "{{.Names}}" | xargs -r docker rm

# Eliminar imágenes de la aplicación
print_message "Eliminando imágenes de la aplicación..."
docker images "financial-news-app*" --format "{{.Repository}}:{{.Tag}}" | xargs -r docker rmi

# Limpiar volúmenes huérfanos
print_message "Eliminando volúmenes huérfanos..."
docker volume prune -f

# Limpiar redes no utilizadas
print_message "Eliminando redes no utilizadas..."
docker network prune -f

if [[ "$CLEAN_ALL" == true ]]; then
    print_warning "Limpieza completa activada..."
    
    # Limpiar todo el sistema Docker
    print_message "Limpiando todo el sistema Docker..."
    docker system prune -a -f --volumes
    
    # Eliminar todas las imágenes no utilizadas
    print_message "Eliminando todas las imágenes no utilizadas..."
    docker image prune -a -f
    
    print_warning "Limpieza completa completada. Se han eliminado todos los recursos Docker no utilizados."
else
    print_message "Limpieza básica completada."
    print_message "Para limpieza completa, ejecuta: ./scripts/docker-clean.sh --all"
fi

print_success "Limpieza completada exitosamente!"

# Mostrar espacio liberado
print_message "Espacio en disco actual:"
df -h / | tail -1