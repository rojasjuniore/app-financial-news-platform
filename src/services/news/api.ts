import axios from 'axios';
import { auth } from '../firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    console.log('🔐 API Interceptor: Checking authentication...');
    const user = auth.currentUser;
    if (user) {
      console.log('✅ API Interceptor: User authenticated, adding token');
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('⚠️ API Interceptor: No user authenticated, proceeding without token');
    }
    console.log('📤 API Interceptor: Request URL:', config.url);
    console.log('📤 API Interceptor: Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ API Interceptor: Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response: Success', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Response: Error', error.response?.status, error.config?.url, error.message);
    if (error.response?.status === 401) {
      console.log('🔄 API Response: Attempting token refresh...');
      // Token expirado, refrescar
      const user = auth.currentUser;
      if (user) {
        await user.getIdToken(true);
        return apiClient.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;