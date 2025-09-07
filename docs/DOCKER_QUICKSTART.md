# 🐳 Docker Quickstart - Financial News App

Este documento te guía rápidamente para ejecutar la aplicación Financial News App usando Docker.

## 🚀 Inicio Rápido

### Opción 1: Usando Make (Recomendado)

```bash
# Configurar el proyecto
make setup

# Desarrollo con Docker
make docker-dev

# Producción con Docker
make docker-build
make docker-run
```

### Opción 2: Usando Scripts Directos

```bash
# Desarrollo
./scripts/docker-dev.sh

# Producción
./scripts/docker-build.sh
./scripts/docker-run.sh
```

### Opción 3: Usando Docker Compose

```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up

# Producción
docker-compose up -d
```

## 📋 Comandos Disponibles

### Desarrollo
- `make dev` - Desarrollo local (sin Docker)
- `make docker-dev` - Desarrollo con Docker (hot reload)
- `make compose-dev` - Desarrollo con docker-compose

### Producción
- `make build` - Build local
- `make docker-build` - Build con Docker
- `make docker-run` - Ejecutar contenedor
- `make deploy` - Build + Run completo

### Utilidades
- `make logs` - Ver logs del contenedor
- `make shell` - Acceder al shell del contenedor
- `make status` - Estado de contenedores
- `make clean` - Limpiar archivos locales
- `make docker-clean` - Limpiar recursos Docker

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
NODE_ENV=production
REACT_APP_API_URL=https://api.tu-dominio.com
REACT_APP_FIREBASE_API_KEY=tu-api-key
```

### Puertos

- **Desarrollo**: http://localhost:3001
- **Producción**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🏗️ Arquitectura Docker

### Multi-Stage Build

El Dockerfile utiliza un build multi-stage para optimizar el tamaño:

1. **Builder Stage**: Construye la aplicación React
2. **Production Stage**: Sirve la aplicación con Nginx

### Optimizaciones Incluidas

- ✅ Multi-stage build para reducir tamaño
- ✅ Nginx optimizado con compresión gzip
- ✅ Headers de seguridad
- ✅ Cache de assets estáticos
- ✅ Health checks
- ✅ Usuario no-root para seguridad
- ✅ Alpine Linux para menor tamaño

## 📊 Monitoreo

### Health Check

La aplicación incluye un endpoint de health check:

```bash
curl http://localhost:3000/health
```

### Logs

```bash
# Ver logs en tiempo real
make logs

# Ver logs específicos
docker logs financial-news-app-latest
```

## 🧹 Limpieza

### Limpieza Básica
```bash
make docker-clean
```

### Limpieza Completa
```bash
make docker-clean-all
```

## 🚀 Despliegue

### Railway

El proyecto está configurado para Railway con `nixpacks.toml`:

```bash
# Conectar a Railway
railway login
railway link
railway up
```

### Docker Hub

```bash
# Tag para Docker Hub
docker tag financial-news-app:latest tu-usuario/financial-news-app:latest

# Push a Docker Hub
docker push tu-usuario/financial-news-app:latest
```

## 🔍 Troubleshooting

### Problemas Comunes

1. **Puerto en uso**:
   ```bash
   # Cambiar puerto
   make docker-run TAG=latest PORT=3001
   ```

2. **Permisos de scripts**:
   ```bash
   chmod +x scripts/*.sh
   ```

3. **Limpiar cache de Docker**:
   ```bash
   make docker-clean-all
   ```

### Logs de Debug

```bash
# Ver logs detallados
docker-compose logs -f

# Ver logs de build
docker build --no-cache -t financial-news-app .
```

## 📈 Performance

### Métricas de la Imagen

- **Tamaño**: ~50MB (Alpine + Nginx)
- **Tiempo de inicio**: ~2-3 segundos
- **Memoria**: ~20-30MB en runtime

### Optimizaciones Aplicadas

- Compresión gzip habilitada
- Cache de assets por 1 año
- Headers de seguridad
- Nginx optimizado para SPA
- Multi-stage build

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `make logs`
2. Verifica el estado: `make status`
3. Limpia recursos: `make docker-clean`
4. Abre un issue en GitHub

---

**¡Disfruta desarrollando con Docker! 🐳**
