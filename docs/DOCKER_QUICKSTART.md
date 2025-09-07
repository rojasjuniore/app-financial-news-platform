# 🐳 Docker Quick Start Guide

## Prerequisitos

1. **Instalar Docker Desktop**
   - Mac: https://docs.docker.com/desktop/mac/install/
   - Windows: https://docs.docker.com/desktop/windows/install/
   - Linux: https://docs.docker.com/desktop/linux/install/

2. **Iniciar Docker Desktop**
   - Abre Docker Desktop desde tus aplicaciones
   - Espera a que el icono de Docker en la barra de menú muestre "Docker Desktop is running"

## 🚀 Inicio Rápido (3 comandos)

```bash
# 1. Configurar variables de entorno
cp .env.example .env

# 2. Construir la imagen
docker build -t financial-news-app .

# 3. Ejecutar el contenedor
docker run -p 80:80 financial-news-app
```

La aplicación estará disponible en: http://localhost

## 📦 Opciones de Build

### Opción 1: Build de Producción (Recomendado)

```bash
# Construir imagen optimizada
docker build -t financial-news-app:prod .

# Ejecutar
docker run -d \
  --name financial-news \
  -p 80:80 \
  --env-file .env \
  financial-news-app:prod

# Ver logs
docker logs -f financial-news
```

### Opción 2: Build de Desarrollo (Con Hot Reload)

```bash
# Construir imagen de desarrollo
docker build -f Dockerfile.dev -t financial-news-app:dev .

# Ejecutar con volúmenes para hot reload
docker run -d \
  --name financial-news-dev \
  -p 3001:3001 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/public:/app/public \
  --env-file .env \
  financial-news-app:dev
```

Acceder en: http://localhost:3001

### Opción 3: Docker Compose (Stack Completo)

```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up

# Producción
docker-compose up
```

## 🧪 Probar los Builds

Usa el script de prueba incluido:

```bash
# Ejecutar script de prueba interactivo
./scripts/test-docker-build.sh
```

Este script te permite:
- Verificar que Docker está funcionando
- Construir imágenes de producción y desarrollo
- Probar los contenedores
- Ver información de las imágenes

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Ver contenedores en ejecución
docker ps

# Ver todos los contenedores
docker ps -a

# Detener contenedor
docker stop financial-news

# Eliminar contenedor
docker rm financial-news

# Ver logs
docker logs financial-news

# Entrar al contenedor
docker exec -it financial-news sh
```

### Gestión de Imágenes

```bash
# Ver imágenes
docker images

# Eliminar imagen
docker rmi financial-news-app

# Limpiar imágenes no usadas
docker image prune
```

### Docker Compose

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir y reiniciar
docker-compose up --build

# Limpiar todo (incluyendo volúmenes)
docker-compose down -v
```

## 🔧 Solución de Problemas

### Docker no está corriendo

```bash
# Mac/Windows
# Abre Docker Desktop desde tus aplicaciones

# Linux
sudo systemctl start docker
```

### Puerto en uso

```bash
# Ver qué está usando el puerto 80
lsof -i :80

# Cambiar puerto en el comando run
docker run -p 8080:80 financial-news-app
```

### Problemas de permisos

```bash
# Linux: Agregar usuario al grupo docker
sudo usermod -aG docker $USER
# Logout y login de nuevo
```

### Limpiar todo y empezar de nuevo

```bash
# Script de limpieza completa
./scripts/docker-clean.sh all

# O manualmente
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi $(docker images -q)
docker volume prune -f
```

## 📊 Verificar el Build

### 1. Verificar que la imagen se creó

```bash
docker images | grep financial-news
```

Deberías ver algo como:
```
financial-news-app   latest   abc123def   2 minutes ago   150MB
```

### 2. Verificar que el contenedor está corriendo

```bash
docker ps | grep financial-news
```

### 3. Verificar la aplicación

Abre tu navegador en:
- Producción: http://localhost
- Desarrollo: http://localhost:3001

### 4. Verificar los logs

```bash
docker logs financial-news
```

Deberías ver:
```
Starting nginx...
nginx: ready
Server running on port 80
```

## 🚀 Deployment

### Opción 1: Docker Hub

```bash
# Login a Docker Hub
docker login

# Tag la imagen
docker tag financial-news-app:latest tuusuario/financial-news-app:latest

# Push
docker push tuusuario/financial-news-app:latest
```

### Opción 2: Railway (Automático)

Railway detectará automáticamente los archivos Docker y los usará para el deployment.

### Opción 3: Cloud Providers

```bash
# AWS ECR
aws ecr get-login-password | docker login --username AWS --password-stdin [tu-ecr-uri]
docker tag financial-news-app:latest [tu-ecr-uri]/financial-news-app:latest
docker push [tu-ecr-uri]/financial-news-app:latest

# Google Cloud
gcloud auth configure-docker
docker tag financial-news-app:latest gcr.io/[project-id]/financial-news-app
docker push gcr.io/[project-id]/financial-news-app
```

## 📝 Notas Importantes

1. **Variables de Entorno**: Asegúrate de configurar el archivo `.env` con tus credenciales de Firebase
2. **Recursos**: Docker necesita al menos 2GB de RAM disponible
3. **Hot Reload**: Solo funciona en modo desarrollo con volúmenes montados
4. **Producción**: La imagen de producción usa Nginx y está optimizada para rendimiento

## 🆘 Ayuda

Si encuentras problemas:

1. Verifica que Docker está corriendo: `docker --version`
2. Revisa los logs: `docker logs financial-news`
3. Usa el script de prueba: `./scripts/test-docker-build.sh`
4. Limpia y reconstruye: `./scripts/docker-clean.sh all`

---

¿Necesitas más ayuda? Revisa el [DOCKER_SETUP.md](./DOCKER_SETUP.md) para documentación completa.