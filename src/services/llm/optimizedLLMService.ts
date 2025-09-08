import apiClient from '../news/api';

/**
 * Servicio optimizado de LLM con caché, paralelización y streaming
 */
class OptimizedLLMService {
  private baseUrl = '/api/optimized';
  private eventSource: EventSource | null = null;

  /**
   * Genera análisis optimizado con caché y fallback
   */
  async generateAnalysis(
    articleId: string,
    model: 'openai' | 'claude' | 'gemini' | 'gpt-3.5' = 'openai',
    options: {
      forceRegenerate?: boolean;
      language?: string;
    } = {}
  ) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/analysis/${articleId}`, {
        model,
        forceRegenerate: options.forceRegenerate || false,
        language: options.language || 'en'
      });

      return {
        ...response.data.analysis,
        performance: response.data.performance,
        fromCache: response.data.performance?.fromCache || false
      };
    } catch (error: any) {
      console.error('Error generating optimized analysis:', error);
      
      // Si el servicio optimizado falla, fallback al servicio original
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('Falling back to original LLM service...');
        const fallbackResponse = await apiClient.post(`/api/articles/${articleId}/analysis`, {
          aiModel: model,
          forceRegenerate: options.forceRegenerate
        });
        return fallbackResponse.data;
      }
      
      throw error;
    }
  }

  /**
   * Genera panel de discusión con llamadas paralelas
   */
  async generatePanelDiscussion(
    articleId: string,
    options: {
      forceRegenerate?: boolean;
      language?: string;
    } = {}
  ) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/panel/${articleId}`, {
        forceRegenerate: options.forceRegenerate || false,
        language: options.language || 'en'
      });

      return {
        ...response.data.panel,
        performance: response.data.performance,
        fromCache: response.data.performance?.fromCache || false
      };
    } catch (error: any) {
      console.error('Error generating panel discussion:', error);
      
      // Fallback al servicio original si falla
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('Falling back to original panel service...');
        const fallbackResponse = await apiClient.post(`/api/panel-discussion/${articleId}/generate`);
        return fallbackResponse.data;
      }
      
      throw error;
    }
  }

  /**
   * Inicia streaming de análisis en tiempo real
   */
  startStreamingAnalysis(
    articleId: string,
    model: 'openai' | 'claude' | 'gemini' | 'gpt-3.5' = 'openai',
    options: {
      language?: string;
      onMessage?: (data: any) => void;
      onError?: (error: any) => void;
      onComplete?: () => void;
    } = {}
  ) {
    // Cerrar conexión anterior si existe
    this.stopStreaming();

    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const url = `${baseUrl}${this.baseUrl}/stream/${articleId}?model=${model}&language=${options.language || 'en'}`;

    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'complete') {
          options.onComplete?.();
          this.stopStreaming();
        } else if (data.type === 'error') {
          options.onError?.(new Error(data.error));
          this.stopStreaming();
        } else {
          options.onMessage?.(data);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        options.onError?.(error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      options.onError?.(error);
      this.stopStreaming();
    };

    return this.eventSource;
  }

  /**
   * Detiene el streaming actual
   */
  stopStreaming() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  async getCacheStats() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/cache/stats`);
      return response.data.stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Limpia el caché para un artículo específico
   */
  async clearArticleCache(articleId: string) {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/cache/clear/${articleId}`);
      return response.data;
    } catch (error) {
      console.error('Error clearing article cache:', error);
      throw error;
    }
  }

  /**
   * Precalienta el caché con artículos comunes
   */
  async warmupCache() {
    try {
      const response = await apiClient.post(`${this.baseUrl}/warmup`);
      return response.data;
    } catch (error) {
      console.error('Error warming up cache:', error);
      return null;
    }
  }

  /**
   * Genera análisis para múltiples modelos en paralelo
   */
  async generateMultiModelAnalysis(
    articleId: string,
    models: string[] = ['openai', 'claude', 'gemini'],
    options: {
      forceRegenerate?: boolean;
      language?: string;
    } = {}
  ) {
    try {
      // Ejecutar todas las llamadas en paralelo
      const promises = models.map(model => 
        this.generateAnalysis(articleId, model as any, options)
          .catch(error => {
            console.error(`Error with ${model}:`, error);
            return { model, error: true, message: error.message };
          })
      );

      const results = await Promise.all(promises);
      
      // Filtrar resultados exitosos
      const successful = results.filter(r => !r.error);
      const failed = results.filter(r => r.error);

      return {
        successful,
        failed,
        totalTime: successful.reduce((acc, r) => acc + (r.performance?.responseTime || 0), 0),
        fromCache: successful.some(r => r.fromCache)
      };
    } catch (error) {
      console.error('Error in multi-model analysis:', error);
      throw error;
    }
  }
}

// Singleton instance
let instance: OptimizedLLMService | null = null;

export function getOptimizedLLMService(): OptimizedLLMService {
  if (!instance) {
    instance = new OptimizedLLMService();
  }
  return instance;
}

export default OptimizedLLMService;