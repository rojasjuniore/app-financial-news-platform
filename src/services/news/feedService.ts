import apiClient from './api';
import { FeedResponse, Article, UserProfile, Interaction } from '../../types';
import { usageTracker } from '../tracking';

export const feedService = {
  // Obtener feed simple con 3 modos: trending, my-interests, all
  getSimpleFeed: async (params: {
    mode?: 'trending' | 'my-interests' | 'all';
    sortBy?: 'time' | 'importance' | 'quality';
    limit?: number;
    offset?: number;
    timeRange?: number;
    userId?: string;
  } = {}): Promise<FeedResponse> => {
    try {
      console.log('📡 FeedService: Fetching simple feed with params:', params);
      console.log('📡 FeedService: API Base URL:', apiClient.defaults.baseURL);

      // OPTIMIZACIÓN: Usar el endpoint simple-feed que tiene el algoritmo de importancia
      const response = await apiClient.get('/api/news/simple-feed', { params });
      console.log('📦 FeedService: Simple feed response status:', response.status);
      console.log('📦 FeedService: Simple feed response data:', response.data);

      // Handle standardized API response format
      const data = response.data.success ? response.data.data : response.data;

      console.log('✅ Processed simple feed data:', {
        articlesCount: data?.articles?.length || 0,
        total: data?.total || 0,
        hasMore: data?.hasMore || false,
        mode: data?.mode,
        sortBy: data?.sortBy
      });

      // Add importance_score to articles interface - ahora viene del backend
      const articlesWithImportance = data?.articles?.map((article: any) => ({
        ...article,
        importance_score: article.importance_score || 0
      })) || [];

      // Ensure we always return a valid FeedResponse
      if (!data) {
        return {
          articles: [],
          total: 0,
          hasMore: false
        };
      }

      return {
        articles: articlesWithImportance,
        total: data.total || 0,
        hasMore: data.hasMore || false,
        metadata: {
          mode: data.mode,
          sortBy: data.sortBy,
          userInterests: data.userInterests
        }
      };
    } catch (error) {
      console.error('Error fetching simple feed:', error);
      // Return empty feed on error
      return {
        articles: [],
        total: 0,
        hasMore: false
      };
    }
  },

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
    tickers?: string;
    sectors?: string;
    topics?: string;
    keywords?: string;
  } = {}): Promise<FeedResponse> => {
    try {
      // Usar la ruta correcta que existe en la API
      console.log('📡 Fetching feed with params:', params);
      const response = await apiClient.get('/api/news/feed', { params });
      console.log('📦 Feed response:', response.data);
      
      // Handle standardized API response format
      const data = response.data.success ? response.data.data : response.data;
      
      console.log('✅ Processed feed data:', {
        articlesCount: data?.articles?.length || 0,
        total: data?.total || 0,
        hasMore: data?.hasMore || false
      });
      
      // Ensure we always return a valid FeedResponse
      return data || {
        articles: [],
        total: 0,
        hasMore: false
      };
    } catch (error) {
      console.error('Error fetching feed:', error);
      // Return empty feed on error
      return {
        articles: [],
        total: 0,
        hasMore: false
      };
    }
  },

  // Obtener perfil del usuario - USANDO TRACKING
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get('/api/tracking/preferences');

      // Extract the actual preferences data from the API response
      const prefsData = response.data?.data || {};

      // Crear un perfil completo con valores por defecto
      const profile: UserProfile = {
        userId: prefsData.userId || null,
        interests: prefsData.interests || {
          tickers: prefsData.watched_tickers || [],
          sectors: [],
          topics: [],
          marketTypes: []
        },
        preferences: {
          sentimentBias: 'balanced',
          riskTolerance: 'medium',
          timeHorizon: 'medium_term',
          newsFrequency: 'moderate',
          languagePreference: prefsData.language || 'en',
          notificationSettings: {
            breakingNews: prefsData.enable_notifications !== undefined ? prefsData.enable_notifications : true,
            priceAlerts: true,
            earningsAlerts: true,
            portfolioUpdates: true
          }
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
        createdAt: prefsData.createdAt || new Date().toISOString(),
        updatedAt: prefsData.updatedAt || new Date().toISOString()
      };

      return profile;
    } catch (error) {
      console.error('Error loading user profile:', error);

      // Return default profile if there's an error
      return {
        userId: null,
        interests: {
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
          languagePreference: 'en',
          notificationSettings: {
            breakingNews: true,
            priceAlerts: true,
            earningsAlerts: true,
            portfolioUpdates: true
          }
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
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
    try {
      const { data } = await apiClient.get('/api/tracking/saved');
      console.log('📚 Saved articles response:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching saved articles:', error);
      // Return empty response on error
      return {
        articles: [],
        total: 0,
        hasMore: false
      };
    }
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
  // Search articles in database using PostgreSQL endpoint
  searchArticles: async (params: {
    q: string;
    sortBy?: 'relevance' | 'time' | 'importance' | 'quality';
    limit?: number;
    offset?: number;
    timeRange?: string;
    sources?: string;
    tickers?: string;
    sentimentFilter?: string;
    minQuality?: number;
    userId?: string;
  }): Promise<FeedResponse> => {
    try {
      console.log('🔍 FeedService: Searching articles with params:', params);

      const response = await apiClient.get('/api/news/search', { params });
      console.log('📦 FeedService: Search response status:', response.status);

      // Handle standardized API response format
      const data = response.data.success ? response.data.data : response.data;

      console.log('✅ Processed search results:', {
        query: params.q,
        articlesCount: data?.articles?.length || 0,
        total: data?.total || 0,
        hasMore: data?.hasMore || false,
        sortBy: data?.sortBy
      });

      // Add importance_score to articles interface
      const articlesWithImportance = data?.articles?.map((article: any) => ({
        ...article,
        importance_score: article.importance_score || 0
      })) || [];

      // Track search usage
      try {
        await usageTracker.trackSearch(params.q, articlesWithImportance.length, {
          limit: params.limit,
          offset: params.offset,
          sortBy: params.sortBy
        });
      } catch (trackingError) {
        console.warn('Error tracking search usage:', trackingError);
      }

      // Ensure we always return a valid FeedResponse
      if (!data) {
        return {
          articles: [],
          total: 0,
          hasMore: false
        };
      }

      return {
        articles: articlesWithImportance,
        total: data?.total || 0,
        hasMore: data?.hasMore || false,
        query: data?.query,
        sortBy: data?.sortBy,
        source: data?.source || 'postgresql_search',
        searchParams: data?.searchParams,
        marketStats: data?.marketStats,
        userPreferences: data?.userPreferences
      };

    } catch (error) {
      console.error('❌ FeedService: Error searching articles:', error);

      // Return empty search results on error
      return {
        articles: [],
        total: 0,
        hasMore: false,
        query: params.q
      };
    }
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