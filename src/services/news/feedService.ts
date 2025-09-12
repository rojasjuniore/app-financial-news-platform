import apiClient from './api';
import { FeedResponse, Article, UserProfile, Interaction } from '../../types';
import { usageTracker } from '../tracking';

export const feedService = {
  // Obtener feed personalizado - USANDO RUTA CORRECTA
  getFeed: async (params: {
    limit?: number;
    offset?: number;
    includeViewed?: boolean;
    timeRange?: number;
    forceRefresh?: boolean;
    sortBy?: 'time' | 'quality' | 'personalized';
    onlyMyInterests?: boolean;
    minRelevanceScore?: number;
  } = {}): Promise<FeedResponse> => {
    // Usar la ruta correcta que existe en la API
    const response = await apiClient.get('/api/news/feed', { params });
    // Handle standardized API response format
    return response.data.success ? response.data.data : response.data;
  },

  // Obtener perfil del usuario - USANDO TRACKING
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get('/api/tracking/preferences');
    
    // Crear un perfil completo con valores por defecto
    const profile: UserProfile = {
      userId: data.preferences.userId || '',
      interests: data.preferences.interests || {
        tickers: [],
        sectors: [],
        topics: [],
        marketTypes: []
      },
      preferences: {
        sentimentBias: 'balanced',
        riskTolerance: 'medium',
        timeHorizon: 'medium_term',
        newsFrequency: 'moderate',
        languagePreference: data.preferences.language || 'en',
        notificationSettings: data.preferences.notifications
      },
      behavior: {
        viewedArticles: [],
        likedArticles: [],
        savedArticles: [],
        searchHistory: [],
        tickerClicks: {},
        categoryViews: {},
        avgReadTime: 0,
        lastActive: new Date().toISOString()
      },
      scoring: {
        engagementScore: 0,
        expertiseLevel: 'beginner',
        preferredComplexity: 'medium'
      },
      createdAt: data.preferences.createdAt || new Date().toISOString(),
      updatedAt: data.preferences.updatedAt || new Date().toISOString()
    };
    
    return profile;
  },

  // Actualizar intereses - USANDO TRACKING
  updateInterests: async (interests: {
    tickers?: string[];
    sectors?: string[];
    topics?: string[];
    marketTypes?: string[];
  }) => {
    const { data } = await apiClient.put('/api/tracking/preferences', {
      interests: interests
    });
    return data;
  },

  // Trackear interacción - USANDO TRACKING
  trackInteraction: async (
    articleId: string,
    interactionType: Interaction,
    metadata: Record<string, any> = {}
  ) => {
    const { data } = await apiClient.post('/api/tracking/activity', {
      activityType: `article_${interactionType}`,
      metadata: {
        articleId,
        interactionType,
        ...metadata
      }
    });
    
    // Track usage metrics localmente
    await usageTracker.trackFeedInteraction(interactionType, articleId, metadata);
    
    return data;
  },

  // Obtener artículos guardados - USANDO API
  getSavedArticles: async (): Promise<FeedResponse> => {
    const { data } = await apiClient.get('/api/tracking/saved');
    return data;
  },

  // Guardar artículo - USANDO API
  saveArticle: async (articleId: string) => {
    const { data } = await apiClient.post(`/api/tracking/saved/${articleId}`);
    return data;
  },

  // Quitar artículo guardado - USANDO API
  unsaveArticle: async (articleId: string) => {
    const { data } = await apiClient.delete(`/api/tracking/saved/${articleId}`);
    return data;
  },
  
  // Verificar si un artículo está guardado
  checkSavedStatus: async (articleId: string) => {
    const { data } = await apiClient.get(`/api/tracking/saved/check/${articleId}`);
    return data;
  },

  // Like artículo - USANDO TRACKING
  likeArticle: async (articleId: string) => {
    return feedService.trackInteraction(articleId, 'like');
  },

  // Actualizar preferencias - USANDO TRACKING
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
    const { data } = await apiClient.put('/api/tracking/preferences', preferences);
    return data;
  },

  // Buscar artículos - USANDO ENDPOINT EXISTENTE
  searchArticles: async (params: {
    q: string;
    limit?: number;
    offset?: number;
  }): Promise<FeedResponse> => {
    // Usar el endpoint de búsqueda de news
    const response = await apiClient.get(`/news/search/${params.q}`, { 
      params: {
        pageSize: params.limit || 20,
        offset: params.offset || 0
      }
    });
    
    // Handle standardized API response format
    const data = response.data.success ? response.data.data : response.data;
    
    // Track search usage
    await usageTracker.trackSearch(params.q, data.articles?.length, { 
      limit: params.limit,
      offset: params.offset 
    });
    
    return {
      articles: data.articles || [],
      hasMore: data.totalResults > (params.offset || 0) + (params.limit || 20),
      total: data.totalResults || 0
    };
  },

  // Generar análisis con IA - USANDO ENDPOINT DE ANALYSIS
  generateAnalysis: async (articleId: string, aiModel: 'openai' | 'claude' | 'gemini' | 'grok' = 'openai', forceRegenerate: boolean = false) => {
    // First get the article data
    let articleData = null;
    try {
      const articleResponse = await apiClient.get(`/api/articles/${articleId}`);
      // Handle standardized API response format
      articleData = articleResponse.data.success 
        ? articleResponse.data.data 
        : (articleResponse.data.article || articleResponse.data);
    } catch (error) {
      console.error('Could not fetch article for analysis:', error);
      // Use minimal article data
      articleData = {
        id: articleId,
        title: 'Article',
        content: ''
      };
    }
    
    const response = await apiClient.post(`/api/analysis/article/${articleId}`, { 
      enabledAgents: [aiModel],
      includePolygonData: true,
      forceRegenerate: forceRegenerate
    });
    
    // Handle standardized API response format
    const data = response.data.success ? response.data.data : response.data;
    
    // Track analysis generation
    await usageTracker.trackAnalysisGenerated(articleId, aiModel, { forceRegenerate });
    
    return data;
  },

  // Obtener recomendaciones - USANDO TRACKING
  getRecommendations: async () => {
    const { data } = await apiClient.get('/api/tracking/recommendations');
    return data;
  },

  // Obtener trending - USANDO API
  getTrending: async (params?: {
    limit?: number;
    timeRange?: number;
    category?: string;
    minScore?: number;
  }) => {
    const { data } = await apiClient.get('/api/tracking/trending', { params });
    return data;
  },
  
  // Obtener tickers en tendencia
  getTrendingTickers: async (params?: {
    limit?: number;
    timeRange?: number;
  }) => {
    const { data } = await apiClient.get('/api/tracking/trending/tickers', { params });
    return data;
  },
  
  // Obtener categorías en tendencia
  getTrendingCategories: async (timeRange?: number) => {
    const { data } = await apiClient.get('/api/tracking/trending/categories', { 
      params: { timeRange } 
    });
    return data;
  },

  // Obtener sugerencias de intereses - IMPLEMENTACIÓN LOCAL
  getInterestSuggestions: async (category: 'tickers' | 'sectors' | 'topics') => {
    // Sugerencias predefinidas
    const suggestions = {
      tickers: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'BTC', 'ETH'],
      sectors: ['technology', 'finance', 'healthcare', 'energy', 'crypto', 'real-estate'],
      topics: ['earnings', 'mergers', 'ipo', 'analysis', 'trends', 'regulation']
    };
    
    return suggestions[category] || [];
  },

  // Generar preview de personalización - IMPLEMENTACIÓN LOCAL
  getPersonalizationPreview: async (interests: any, preferences: any) => {
    // Obtener artículos y aplicar filtros localmente
    const response = await apiClient.get('/api/articles/latest', {
      params: { limit: 20 }
    });
    
    // Handle standardized API response format
    const data = response.data.success ? response.data.data : response.data;
    
    // Filtrar basándose en intereses
    const filtered = data.articles?.filter((article: Article) => {
      if (interests.tickers?.length > 0) {
        const hasMatchingTicker = article.tickers?.some(t => 
          interests.tickers.includes(t)
        );
        if (hasMatchingTicker) return true;
      }
      
      if (interests.categories?.length > 0) {
        if (interests.categories.includes(article.category)) return true;
      }
      
      return false;
    }) || [];
    
    return {
      preview: filtered.slice(0, 5),
      matchCount: filtered.length,
      totalAnalyzed: data.articles?.length || 0
    };
  },

  // Exportar configuraciones - IMPLEMENTACIÓN LOCAL
  exportSettings: async () => {
    const { data } = await apiClient.get('/api/tracking/preferences');
    
    const exportData = {
      preferences: data.preferences,
      savedArticles: JSON.parse(localStorage.getItem('savedArticles') || '[]'),
      exportDate: new Date().toISOString()
    };
    
    // Crear blob y descargar
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `news-settings-${Date.now()}.json`;
    a.click();
    
    return exportData;
  },

  // Importar configuraciones - IMPLEMENTACIÓN LOCAL
  importSettings: async (settings: any) => {
    // Actualizar preferencias
    if (settings.preferences) {
      await apiClient.put('/api/tracking/preferences', settings.preferences);
    }
    
    // Restaurar artículos guardados
    if (settings.savedArticles) {
      localStorage.setItem('savedArticles', JSON.stringify(settings.savedArticles));
    }
    
    return { success: true, message: 'Configuraciones importadas exitosamente' };
  }
};