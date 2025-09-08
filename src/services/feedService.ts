import apiClient from './api';
import { FeedResponse, Article, UserProfile, Interaction } from '../types';

export const feedService = {
  // Obtener feed personalizado
  getFeed: async (params: {
    limit?: number;
    offset?: number;
    includeViewed?: boolean;
    timeRange?: number;
    forceRefresh?: boolean;
    sortBy?: 'time' | 'quality' | 'personalized';
  } = {}): Promise<FeedResponse> => {
    const { data } = await apiClient.get('/api/feed', { params });
    return data;
  },

  // Actualizar intereses
  updateInterests: async (interests: {
    tickers?: string[];
    sectors?: string[];
    topics?: string[];
    marketTypes?: string[];
  }) => {
    const { data } = await apiClient.put('/api/feed/interests', interests);
    return data;
  },

  // Trackear interacción
  trackInteraction: async (
    articleId: string,
    interactionType: Interaction,
    metadata: Record<string, any> = {}
  ) => {
    const { data } = await apiClient.post('/api/feed/track', {
      articleId,
      interactionType,
      metadata
    });
    return data;
  },

  // Obtener perfil
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get('/api/feed/profile');
    return data.profile;
  },

  // Obtener trending
  getTrending: async () => {
    const { data } = await apiClient.get('/api/feed/trending');
    return data.trends;
  },

  // Guardar artículo
  saveArticle: async (articleId: string) => {
    return feedService.trackInteraction(articleId, 'save');
  },

  // Like artículo
  likeArticle: async (articleId: string) => {
    return feedService.trackInteraction(articleId, 'like');
  },

  // Obtener artículos guardados
  getSavedArticles: async (): Promise<FeedResponse> => {
    const { data } = await apiClient.get('/api/feed/saved');
    return data;
  },

  // Quitar artículo guardado
  unsaveArticle: async (articleId: string) => {
    const { data } = await apiClient.delete(`/api/feed/articles/${articleId}/save`);
    return data;
  },

  // Actualizar preferencias
  updatePreferences: async (preferences: {
    sentimentBias?: string;
    riskTolerance?: string;
    timeHorizon?: string;
    newsFrequency?: string;
    defaultLLMModel?: string;
    complexityLevel?: string;
    languagePreference?: string;
    notificationSettings?: {
      breakingNews: boolean;
      priceAlerts: boolean;
      earningsAlerts: boolean;
      portfolioUpdates: boolean;
    };
  }) => {
    const { data } = await apiClient.put('/api/feed/preferences', preferences);
    return data;
  },

  // Generar preview de personalización
  getPersonalizationPreview: async (interests: any, preferences: any) => {
    const { data } = await apiClient.post('/api/feed/preview', { interests, preferences });
    return data;
  },

  // Actualizar pesos de intereses
  updateInterestWeights: async (weights: {
    tickers?: { [key: string]: number };
    sectors?: { [key: string]: number };
    topics?: { [key: string]: number };
    marketTypes?: { [key: string]: number };
  }) => {
    const { data } = await apiClient.put('/api/feed/weights', { weights });
    return data;
  },

  // Buscar artículos
  searchArticles: async (params: {
    q: string;
    limit?: number;
    offset?: number;
  }): Promise<FeedResponse> => {
    const { data } = await apiClient.get('/api/feed/search', { params });
    return data;
  },

  // Generar análisis con IA
  generateAnalysis: async (articleId: string, aiModel: 'openai' | 'claude' | 'gemini' | 'grok' = 'openai', forceRegenerate: boolean = false) => {
    const { data } = await apiClient.post(`/api/articles/${articleId}/analysis`, { 
      aiModel,
      forceRegenerate 
    });
    return data;
  },

  // Obtener sugerencias de intereses
  getInterestSuggestions: async (category: 'tickers' | 'sectors' | 'topics') => {
    const { data } = await apiClient.get(`/api/feed/suggestions/${category}`);
    return data.suggestions;
  },

  // Exportar configuraciones
  exportSettings: async () => {
    const { data } = await apiClient.get('/api/feed/export');
    return data;
  },

  // Importar configuraciones
  importSettings: async (settings: any) => {
    const { data } = await apiClient.post('/api/feed/import', settings);
    return data;
  }
};