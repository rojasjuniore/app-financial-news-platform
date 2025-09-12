import apiClient from './api';
import { FeedResponse } from '../../types';

export const articlesService = {
  // Obtener todos los artículos más recientes (sin personalización) 
  getLatestArticles: async (params: {
    limit?: number;
    offset?: number;
    timeRange?: number;
  } = {}): Promise<FeedResponse> => {
    console.log('🔄 [articlesService] Obteniendo Latest News desde /api/articles/latest con params:', params);
    const response = await apiClient.get('/api/articles/latest', { params });
    
    // Handle standardized API response format
    const data = response.data.success ? response.data.data : response.data;
    
    console.log('✅ [articlesService] Respuesta recibida:', data?.articles?.length || 0, 'artículos');
    return data;
  },

  // Obtener un artículo específico por ID
  getArticleById: async (id: string) => {
    const response = await apiClient.get(`/api/articles/${id}`);
    
    // Handle standardized API response format
    return response.data.success ? response.data.data : response.data;
  },

  // Obtener estadísticas de artículos
  getArticleStats: async () => {
    const response = await apiClient.get('/api/articles/stats');
    
    // Handle standardized API response format
    return response.data.success ? response.data.data : response.data;
  }
};