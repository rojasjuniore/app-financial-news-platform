import axios from 'axios';
import { auth } from '../firebase';

// Determinar la URL de la API basándose en el entorno
const getApiBaseUrl = () => {
  // Si estamos en producción (Railway/Vercel), usar la URL de producción
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://api-financial-news-platform-production.up.railway.app';
  }
  // En desarrollo, usar la variable de entorno o localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🌐 Current hostname:', window.location.hostname);

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor mejorado para agregar token JWT automáticamente a TODAS las peticiones
apiClient.interceptors.request.use(
  async (config) => {
    try {
      console.log('🔐 API Interceptor: Processing request to:', config.url);

      // Intentar obtener el usuario actual de Firebase
      const user = auth.currentUser;

      if (user) {
        console.log('✅ API Interceptor: User authenticated:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });

        try {
          // Obtener el token JWT más reciente
          const token = await user.getIdToken();

          // Agregar el token al header Authorization
          config.headers.Authorization = `Bearer ${token}`;

          console.log('🔑 API Interceptor: Token added successfully');
          console.log('📊 Token preview:', token.substring(0, 50) + '...');
        } catch (tokenError) {
          console.error('⚠️ API Interceptor: Error getting token:', tokenError);
        }
      } else {
        console.log('⚠️ API Interceptor: No user authenticated, checking localStorage...');

        // Fallback: Intentar obtener token de localStorage si existe
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
          console.log('📦 API Interceptor: Using stored token from localStorage');
        } else {
          console.log('🚫 API Interceptor: No token available, proceeding without authentication');
        }
      }

      // Log detallado de la petición
      console.log('📤 API Request Details:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasAuth: !!config.headers.Authorization,
        headers: {
          ...config.headers,
          Authorization: config.headers.Authorization ? '[TOKEN PRESENT]' : '[NO TOKEN]'
        }
      });

      return config;
    } catch (error) {
      console.error('❌ API Interceptor: Unexpected error:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ API Interceptor: Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor mejorado para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase()
    });
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    // Manejar errores de autenticación (401 Unauthorized)
    if (error.response?.status === 401) {
      console.log('🔄 API Response: Token may be expired, attempting refresh...');

      const user = auth.currentUser;
      if (user) {
        try {
          // Forzar renovación del token
          console.log('🔄 Refreshing token for user:', user.email);
          const newToken = await user.getIdToken(true);

          // Guardar el nuevo token en localStorage como backup
          localStorage.setItem('authToken', newToken);
          console.log('✅ Token refreshed successfully');

          // Actualizar el header con el nuevo token
          error.config.headers.Authorization = `Bearer ${newToken}`;

          // Reintentar la petición original
          console.log('🔄 Retrying original request with new token...');
          return apiClient.request(error.config);
        } catch (refreshError) {
          console.error('❌ Failed to refresh token:', refreshError);

          // Si no podemos refrescar el token, limpiar localStorage
          localStorage.removeItem('authToken');
        }
      } else {
        console.log('⚠️ No user to refresh token, clearing stored token...');
        localStorage.removeItem('authToken');
      }
    }

    // Manejar otros errores HTTP
    if (error.response?.status === 403) {
      console.error('🚫 Forbidden: You don\'t have permission to access this resource');
    } else if (error.response?.status === 404) {
      console.error('🔍 Not Found: The requested resource doesn\'t exist');
    } else if (error.response?.status === 500) {
      console.error('💥 Server Error: Something went wrong on the server');
    }

    return Promise.reject(error);
  }
);

// Función auxiliar para guardar el token cuando el usuario se autentique
export const saveAuthToken = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      localStorage.setItem('authToken', token);
      console.log('✅ Auth token saved to localStorage');
      return token;
    } catch (error) {
      console.error('❌ Error saving auth token:', error);
    }
  }
  return null;
};

// Función para limpiar el token almacenado
export const clearAuthToken = () => {
  localStorage.removeItem('authToken');
  console.log('🗑️ Auth token cleared from localStorage');
};

export default apiClient;