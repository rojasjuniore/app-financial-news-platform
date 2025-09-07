#!/bin/bash

# Script para ejecutar la aplicación Docker
# Uso: ./scripts/docker-run.sh [tag] [puerto]

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

# Obtener parámetros
TAG=${1:-latest}
PORT=${2:-3000}
IMAGE_NAME="financial-news-app"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"
CONTAINER_NAME="financial-news-app-${TAG}"

print_message "Iniciando contenedor ${CONTAINER_NAME}..."

# Verificar si la imagen existe
if ! docker images "${FULL_IMAGE_NAME}" | grep -q "${IMAGE_NAME}"; then
    print_warning "La imagen ${FULL_IMAGE_NAME} no existe. Construyendo..."
    ./scripts/docker-build.sh "${TAG}"
fi

# Detener y eliminar contenedor existente si existe
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_message "Deteniendo contenedor existente..."
    docker stop "${CONTAINER_NAME}" || true
    docker rm "${CONTAINER_NAME}" || true
fi

# Ejecutar el contenedor
print_message "Ejecutando contenedor en puerto ${PORT}..."
if docker run -d \
    --name "${CONTAINER_NAME}" \
    -p "${PORT}:3000" \
    --restart unless-stopped \
    "${FULL_IMAGE_NAME}"; then
    
    print_success "Contenedor iniciado exitosamente!"
    print_message "Aplicación disponible en: http://localhost:${PORT}"
    print_message "Health check: http://localhost:${PORT}/health"
    
    # Mostrar logs del contenedor
    print_message "Mostrando logs del contenedor (Ctrl+C para salir):"
    docker logs -f "${CONTAINER_NAME}"
    
else
    print_error "Error al ejecutar el contenedor"
    exit 1
fi