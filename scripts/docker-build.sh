#!/bin/bash

# Script para construir la imagen Docker de producción
# Uso: ./scripts/docker-build.sh [tag]

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

# Obtener el tag de la imagen (por defecto: latest)
TAG=${1:-latest}
IMAGE_NAME="financial-news-app"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

print_message "Construyendo imagen Docker para ${FULL_IMAGE_NAME}..."

# Limpiar builds anteriores
print_message "Limpiando builds anteriores..."
docker system prune -f

# Construir la imagen
print_message "Iniciando build de la imagen..."
if docker build -t "${FULL_IMAGE_NAME}" .; then
    print_success "Imagen construida exitosamente: ${FULL_IMAGE_NAME}"
    
    # Mostrar información de la imagen
    print_message "Información de la imagen:"
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    # Mostrar tamaño de la imagen
    IMAGE_SIZE=$(docker images "${FULL_IMAGE_NAME}" --format "{{.Size}}")
    print_success "Tamaño de la imagen: ${IMAGE_SIZE}"
    
else
    print_error "Error al construir la imagen"
    exit 1
fi

print_success "Build completado exitosamente!"
print_message "Para ejecutar la aplicación: docker run -p 3000:3000 ${FULL_IMAGE_NAME}"