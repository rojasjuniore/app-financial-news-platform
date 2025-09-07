# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar todas las dependencias ignorando peer deps
RUN npm install --legacy-peer-deps

# Copiar archivos de entorno ANTES del código
# Docker ignorará estos si no existen localmente
COPY .env* ./

# Copiar resto del código
COPY . .

# Establecer variables de entorno para el build
# Estas se incrustarán en el bundle de React
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_STORAGE_BUCKET
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_FIREBASE_APP_ID
ARG REACT_APP_API_URL

ENV REACT_APP_FIREBASE_API_KEY=$REACT_APP_FIREBASE_API_KEY
ENV REACT_APP_FIREBASE_AUTH_DOMAIN=$REACT_APP_FIREBASE_AUTH_DOMAIN
ENV REACT_APP_FIREBASE_PROJECT_ID=$REACT_APP_FIREBASE_PROJECT_ID
ENV REACT_APP_FIREBASE_STORAGE_BUCKET=$REACT_APP_FIREBASE_STORAGE_BUCKET
ENV REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ENV REACT_APP_FIREBASE_APP_ID=$REACT_APP_FIREBASE_APP_ID
ENV REACT_APP_API_URL=$REACT_APP_API_URL

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
    