import apiClient from '../news/api';

export interface TrackingData {
  // LLM Usage
  modelName?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  
  // News Usage
  action?: 'read' | 'analysis' | 'interaction' | 'search';
  articleId?: string;
  query?: string;
  
  // Chat Usage
  messageCount?: number;
  
  // Additional context
  additionalData?: Record<string, any>;
}

export class UsageTracker {
  private static instance: UsageTracker;
  private userId: string | null = null;

  private constructor() {
    // Get user ID from auth context or localStorage
    this.initializeUserId();
  }

  public static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  private initializeUserId() {
    try {
      // In a real app, get from auth context
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.userId = user.uid || user.id || 'anonymous';
      } else {
        this.userId = 'anonymous';
      }
    } catch (error) {
      console.warn('Could not initialize user ID for tracking:', error);
      this.userId = 'anonymous';
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  private async track(service: 'llm' | 'news' | 'chat', data: TrackingData) {
    try {
      await apiClient.post('/api/metrics/track', {
        userId: this.userId,
        service,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
      
      console.log(`📊 Usage tracked: ${service}`, data);
    } catch (error) {
      console.warn('Failed to track usage:', error);
      // Don't throw - tracking shouldn't break the app
    }
  }

  // LLM Tracking Methods
  public async trackLLMUsage(data: {
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cost?: number;
    context?: string;
  }) {
    await this.track('llm', {
      modelName: data.modelName,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      cost: data.cost || this.calculateCost(data.modelName, data.inputTokens, data.outputTokens),
      additionalData: {
        context: data.context
      }
    });
  }

  // News Tracking Methods
  public async trackArticleRead(articleId: string, additionalData?: Record<string, any>) {
    await this.track('news', {
      action: 'read',
      articleId,
      additionalData
    });
  }

  public async trackAnalysisGenerated(articleId: string, modelName: string, additionalData?: Record<string, any>) {
    await this.track('news', {
      action: 'analysis',
      articleId,
      additionalData: {
        modelName,
        ...additionalData
      }
    });
  }

  public async trackFeedInteraction(action: string, articleId?: string, additionalData?: Record<string, any>) {
    await this.track('news', {
      action: 'interaction',
      articleId,
      additionalData: {
        interactionType: action,
        ...additionalData
      }
    });
  }

  public async trackSearch(query: string, resultsCount?: number, additionalData?: Record<string, any>) {
    await this.track('news', {
      action: 'search',
      query,
      additionalData: {
        resultsCount,
        ...additionalData
      }
    });
  }

  // Chat Tracking Methods
  public async trackChatMessage(messageCount: number = 1, modelName?: string, additionalData?: Record<string, any>) {
    await this.track('chat', {
      messageCount,
      additionalData: {
        modelName,
        ...additionalData
      }
    });
  }

  // Cost calculation (simplified)
  private calculateCost(modelName: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.00003, output: 0.00006 },
      'gpt-3.5-turbo': { input: 0.0000015, output: 0.000002 },
      'claude-3-opus': { input: 0.000015, output: 0.000075 },
      'claude-3-sonnet': { input: 0.000003, output: 0.000015 },
      'gemini-pro': { input: 0.000001, output: 0.000002 },
      'grok-1': { input: 0.000005, output: 0.000015 }
    };

    const modelPricing = pricing[modelName.toLowerCase()] || pricing['gpt-3.5-turbo'];
    return (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
  }

  // Batch tracking for performance
  private batchQueue: Array<{ service: string; data: TrackingData }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  public async trackBatch(service: 'llm' | 'news' | 'chat', data: TrackingData) {
    this.batchQueue.push({ service, data });

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(async () => {
      if (this.batchQueue.length > 0) {
        try {
          await apiClient.post('/api/metrics/track-batch', {
            userId: this.userId,
            events: this.batchQueue.map(item => ({
              service: item.service,
              data: {
                ...item.data,
                timestamp: new Date().toISOString()
              }
            }))
          });
          
          console.log(`📊 Batch tracked: ${this.batchQueue.length} events`);
          this.batchQueue = [];
        } catch (error) {
          console.warn('Failed to batch track usage:', error);
          this.batchQueue = [];
        }
      }
    }, 5000); // Send batch every 5 seconds
  }
}

// Export singleton instance
export const usageTracker = UsageTracker.getInstance();

// React hook for easy usage
export const useUsageTracker = () => {
  return {
    trackLLMUsage: usageTracker.trackLLMUsage.bind(usageTracker),
    trackArticleRead: usageTracker.trackArticleRead.bind(usageTracker),
    trackAnalysisGenerated: usageTracker.trackAnalysisGenerated.bind(usageTracker),
    trackFeedInteraction: usageTracker.trackFeedInteraction.bind(usageTracker),
    trackSearch: usageTracker.trackSearch.bind(usageTracker),
    trackChatMessage: usageTracker.trackChatMessage.bind(usageTracker)
  };
};