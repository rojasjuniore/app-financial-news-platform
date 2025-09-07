# Financial News App - React Frontend

Aplicación React para consumir la API de noticias financieras con análisis inteligente y chat con agente IA.

## 🚀 Configuración Inicial

### 1. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y completa con tus credenciales de Firebase:

```bash
cp .env.example .env
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Firebase

Asegúrate de tener un proyecto de Firebase configurado con:
- Authentication habilitada (Email/Password y Google)
- Las mismas credenciales que usa tu API backend

## 📱 Características

- **🔐 Autenticación con Firebase** - Login con email/password o Google
- **📰 Feed Personalizado** - Noticias adaptadas a tus intereses
- **💬 Chat con Agente IA** - Análisis inteligente por artículo
- **📊 Análisis Técnico** - Visualización de datos del mercado
- **❤️ Interacciones** - Like, guardar y compartir artículos
- **📱 Responsive** - Diseño adaptativo para móviles

## 🏗️ Estructura del Proyecto

```
src/
├── services/          # Servicios API y Firebase
├── hooks/            # Hooks personalizados
├── components/       # Componentes reutilizables
│   ├── Feed/        # Componentes del feed
│   ├── Chat/        # Widget de chat
│   └── ...          
├── pages/           # Páginas principales
├── contexts/        # Contextos de React
└── types/          # Tipos TypeScript
```

## Available Scripts

### `npm start`

Inicia la aplicación en modo desarrollo.
Abre [http://localhost:3001](http://localhost:3001) en el navegador.

**Nota:** La app está configurada para correr en el puerto 3001 para evitar conflictos con la API que corre en el puerto 3000.

### `npm test`

Ejecuta las pruebas en modo interactivo.

### `npm run build`

Construye la aplicación para producción en la carpeta `build`.
Optimiza el bundle para mejor rendimiento.

## 🔧 Configuración de la API

Asegúrate de que tu API backend esté corriendo en `http://localhost:3000` o actualiza la variable `REACT_APP_API_URL` en tu archivo `.env`.

## 🎨 Personalización

### Colores y Estilos

La aplicación usa Tailwind CSS. Puedes personalizar los colores en `tailwind.config.js`.

### Componentes

Todos los componentes están en TypeScript y son fácilmente personalizables.

## 📝 Uso

1. **Login**: Inicia sesión con tu cuenta de email o Google
2. **Feed**: Navega por las noticias personalizadas
3. **Detalle**: Click en cualquier artículo para ver el análisis completo
4. **Chat**: Usa el widget de chat para hacer preguntas sobre el artículo
5. **Interacciones**: Dale like, guarda o comparte artículos

## 🐛 Troubleshooting

### Error de CORS

Si tienes errores de CORS, asegúrate de que tu API backend tenga configurado CORS correctamente:

```javascript
app.use(cors({
  origin: 'http://localhost:3001'
}));
```

### Token de Firebase

Si recibes errores de autenticación, verifica:
1. Las credenciales de Firebase son las mismas en frontend y backend
2. El token no ha expirado
3. El usuario está autenticado correctamente

## 🚀 Deploy

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Arrastra la carpeta build a Netlify
```

## 📚 Tecnologías Utilizadas

- React 18
- TypeScript
- Tailwind CSS
- Firebase Auth
- React Query
- React Router v6
- Axios
- React Hot Toast
- Lucide Icons

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.