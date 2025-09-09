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
    const { data } = await apiClient.get('/api/articles/latest', { params });
    console.log('✅ [articlesService] Respuesta recibida:', data?.articles?.length || 0, 'artículos');
    return data;
  },

  // Obtener un artículo específico por ID
  getArticleById: async (id: string) => {
    const { data } = await apiClient.get(`/api/articles/${id}`);
    return data;
  },

  // Obtener estadísticas de artículos
  getArticleStats: async () => {
    const { data } = await apiClient.get('/api/articles/stats');
    return data;
  }
};