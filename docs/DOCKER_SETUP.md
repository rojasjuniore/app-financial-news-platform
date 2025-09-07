# Docker Setup for Financial News App

## Overview

This application is fully containerized using Docker, providing both development and production environments. The setup includes the React frontend, API backend, Redis cache, and optional MongoDB database.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ available RAM
- 10GB+ available disk space

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd financial-news-app
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your Firebase and API configurations
```

### 3. Build and run

#### Production Environment
```bash
# Build production images
./scripts/docker-build.sh prod

# Start services
./scripts/docker-run.sh prod up

# Access the application at http://localhost
```

#### Development Environment
```bash
# Build development images
./scripts/docker-build.sh dev

# Start services with hot reload
./scripts/docker-run.sh dev up

# Access the application at http://localhost:3001
```

## Docker Architecture

### Services

1. **Frontend (React App)**
   - Production: Nginx serving optimized build
   - Development: Node.js with hot reload
   - Ports: 80 (prod), 3001 (dev)

2. **API Backend**
   - Node.js/Express API
   - Port: 3000

3. **Redis Cache**
   - In-memory data store for caching
   - Port: 6379

4. **MongoDB (Optional)**
   - Document database
   - Port: 27017

### Network Architecture
```
┌─────────────────────────────────────────────────┐
│                 Docker Network                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │  Frontend  │  │    API     │  │   Redis    ││
│  │   (React)  │◄─┤  Backend   │◄─┤   Cache    ││
│  └────────────┘  └────────────┘  └────────────┘│
│        ▲               ▲                        │
│        │               │                        │
│        │         ┌────────────┐                │
│        │         │  MongoDB   │                │
│        └─────────┤ (Optional) │                │
│                  └────────────┘                │
└─────────────────────────────────────────────────┘
```

## File Structure

```
financial-news-app/
├── Dockerfile                 # Production multi-stage build
├── Dockerfile.dev            # Development build with hot reload
├── docker-compose.yml        # Production orchestration
├── docker-compose.dev.yml    # Development orchestration
├── nginx.conf               # Nginx configuration for production
├── .dockerignore           # Files to exclude from Docker context
├── .env.example           # Environment variables template
└── scripts/
    ├── docker-build.sh    # Build script
    ├── docker-run.sh     # Run management script
    └── docker-clean.sh   # Cleanup script
```

## Docker Commands

### Build Commands
```bash
# Build production
docker-compose -f docker-compose.yml build

# Build development
docker-compose -f docker-compose.dev.yml build

# Build with no cache
docker-compose build --no-cache
```

### Run Commands
```bash
# Start all services (detached)
./scripts/docker-run.sh [dev|prod] up

# Stop all services
./scripts/docker-run.sh [dev|prod] down

# Restart services
./scripts/docker-run.sh [dev|prod] restart

# View logs
./scripts/docker-run.sh [dev|prod] logs

# Check status
./scripts/docker-run.sh [dev|prod] status
```

### Individual Service Management
```bash
# Start specific service
docker-compose up -d frontend

# Stop specific service
docker-compose stop frontend

# Restart specific service
docker-compose restart frontend

# View logs for specific service
docker-compose logs -f frontend
```

### Cleanup Commands
```bash
# Remove all project containers, images, volumes
./scripts/docker-clean.sh all

# Remove only containers
./scripts/docker-clean.sh containers

# Remove only images
./scripts/docker-clean.sh images

# Remove only volumes (caution: data loss)
./scripts/docker-clean.sh volumes
```

## Environment Variables

### Required Variables
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# API Configuration
REACT_APP_API_URL=http://api:3000
```

### Optional Variables
```env
# MongoDB (if using)
MONGO_USERNAME=admin
MONGO_PASSWORD=secure_password

# Redis (if password protected)
REDIS_PASSWORD=redis_password

# Node Environment
NODE_ENV=production
```

## Development Workflow

### Hot Reload Setup
The development environment supports hot reload for both frontend and backend:

1. Frontend changes in `/src` are automatically reflected
2. Backend changes trigger automatic server restart
3. CSS/Tailwind changes are compiled on the fly

### Volume Mounts (Development)
```yaml
volumes:
  - ./src:/app/src              # Source code
  - ./public:/app/public        # Public assets
  - /app/node_modules          # Preserve node_modules
```

## Production Deployment

### Build Optimization
The production Dockerfile uses multi-stage builds:

1. **Stage 1**: Node.js builds the React app
2. **Stage 2**: Nginx serves the static files

### Security Features
- Non-root user execution
- Security headers in Nginx
- Environment variable isolation
- Health checks for all services

### Performance Optimizations
- Gzip compression enabled
- Static asset caching (1 year)
- Optimized Nginx configuration
- Redis caching layer

## Health Checks

All services include health checks:

```bash
# Check all service health
docker-compose ps

# Manual health check
curl http://localhost/health        # Frontend
curl http://localhost:3000/health   # API
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

2. **Permission denied on scripts**
   ```bash
   chmod +x scripts/*.sh
   ```

3. **Container won't start**
   ```bash
   # Check logs
   docker-compose logs frontend
   # Rebuild
   docker-compose build --no-cache
   ```

4. **Hot reload not working**
   - Ensure `CHOKIDAR_USEPOLLING=true` is set
   - Check volume mounts in docker-compose.dev.yml
   - Restart the container

5. **Out of disk space**
   ```bash
   # Clean up Docker system
   docker system prune -a
   # Use cleanup script
   ./scripts/docker-clean.sh all
   ```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: docker build -t financial-news-app .
      
      - name: Push to registry
        run: |
          docker tag financial-news-app:latest $REGISTRY/financial-news-app:latest
          docker push $REGISTRY/financial-news-app:latest
```

## Monitoring

### Container Metrics
```bash
# Resource usage
docker stats

# Detailed inspection
docker inspect financial-news-frontend
```

### Log Management
```bash
# Export logs
docker-compose logs > logs.txt

# Follow specific service logs
docker-compose logs -f --tail=100 frontend
```

## Backup and Restore

### Backup Volumes
```bash
# Backup Redis data
docker run --rm -v financial-news_redis-data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz /data

# Backup MongoDB (if used)
docker exec financial-news-mongodb mongodump --out /backup
```

### Restore Volumes
```bash
# Restore Redis data
docker run --rm -v financial-news_redis-data:/data -v $(pwd):/backup alpine tar xzf /backup/redis-backup.tar.gz -C /
```

## Security Best Practices

1. **Never commit .env files** - Use .env.example as template
2. **Use secrets management** in production (Docker Secrets, Vault, etc.)
3. **Regularly update base images** for security patches
4. **Scan images for vulnerabilities**:
   ```bash
   docker scan financial-news-app_frontend
   ```
5. **Use read-only filesystems** where possible
6. **Implement network policies** to restrict inter-service communication

## Performance Tips

1. **Use BuildKit** for faster builds:
   ```bash
   DOCKER_BUILDKIT=1 docker build .
   ```

2. **Leverage layer caching** - Order Dockerfile commands by change frequency

3. **Optimize image size**:
   - Use Alpine base images
   - Multi-stage builds
   - Remove unnecessary files

4. **Resource limits** in production:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Review this documentation
3. Check Docker daemon status: `docker info`
4. Open an issue in the repository

---

Last Updated: 2025