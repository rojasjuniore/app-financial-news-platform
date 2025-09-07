# ---------- Build stage ----------
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # Copiar dependencias
    COPY package*.json ./
    
    # Instalar todas las dependencias ignorando peer deps
    RUN npm install --legacy-peer-deps
    
    # Copiar resto del código
    COPY . .
    
    # Compilar React app
    RUN npm run build
    
    
    # ---------- Production stage ----------
    FROM node:20-alpine AS runner
    
    WORKDIR /app
    
    # Instalar solo 'serve'
    RUN npm install -g serve
    
    # Copiar el build generado
    COPY --from=builder /app/build ./build
    
    EXPOSE 3000
    
    CMD ["serve", "-s", "build", "-l", "3000"]
    