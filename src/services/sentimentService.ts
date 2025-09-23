/**
 * Sentiment Analysis Service
 * Connects to backend FinBERT API for financial sentiment analysis
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export type SentimentType =
  | 'very_bullish'
  | 'bullish'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'bearish'
  | 'very_bearish';

export interface SentimentResult {
  sentiment: SentimentType;
  score: number;
  confidence: number;
  method: 'finbert' | 'fallback_enhanced' | 'cached';
  finbert_label?: string;
  finbert_scores?: Array<{ label: string; score: number }>;
}

export interface BatchSentimentResult {
  results: SentimentResult[];
  aggregates: {
    overallSentiment: SentimentType;
    averageScore: string;
    averageConfidence: string;
    distribution: Record<SentimentType, string>;
  };
  processedCount: number;
}

export interface NewsSentimentResult {
  articleCount: number;
  sentimentAnalysis: BatchSentimentResult;
  marketSummary: {
    bullishPercentage: string;
    bearishPercentage: string;
    neutralPercentage: string;
    marketTrend: 'bullish' | 'bearish' | 'neutral';
    averageConfidence: string;
  };
  topBullish: Array<{
    title: string;
    sentiment: SentimentType;
    score: number;
    confidence: number;
  }>;
  topBearish: Array<{
    title: string;
    sentiment: SentimentType;
    score: number;
    confidence: number;
  }>;
}

class SentimentService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/sentiment`;
    this.cache = new Map();
  }

  /**
   * Analyze sentiment of a single text
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/analyze`, { text });
      return response.data.data;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Return neutral sentiment as fallback
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        method: 'fallback_enhanced'
      };
    }
  }

  /**
   * Analyze sentiment of multiple texts in batch
   */
  async analyzeBatch(texts: string[]): Promise<BatchSentimentResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/batch`, { texts });
      return response.data.data;
    } catch (error) {
      console.error('Error analyzing batch sentiment:', error);
      // Return neutral results as fallback
      return {
        results: texts.map(() => ({
          sentiment: 'neutral' as SentimentType,
          score: 0,
          confidence: 0,
          method: 'fallback_enhanced' as const
        })),
        aggregates: {
          overallSentiment: 'neutral',
          averageScore: '0',
          averageConfidence: '0%',
          distribution: {
            very_bullish: '0%',
            bullish: '0%',
            positive: '0%',
            neutral: '100%',
            negative: '0%',
            bearish: '0%',
            very_bearish: '0%'
          }
        },
        processedCount: texts.length
      };
    }
  }

  /**
   * Get sentiment analysis for news articles
   */
  async getNewsSentiment(limit?: number): Promise<NewsSentimentResult> {
    const cacheKey = `news_sentiment_${limit || 'all'}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const params = limit ? { limit } : {};
      const response = await axios.get(`${this.baseUrl}/news`, { params });

      // Cache the result
      this.cache.set(cacheKey, {
        data: response.data.data,
        timestamp: Date.now()
      });

      return response.data.data;
    } catch (error) {
      console.error('Error getting news sentiment:', error);
      // Return default structure as fallback
      return {
        articleCount: 0,
        sentimentAnalysis: {
          results: [],
          aggregates: {
            overallSentiment: 'neutral',
            averageScore: '0',
            averageConfidence: '0%',
            distribution: {
              very_bullish: '0%',
              bullish: '0%',
              positive: '0%',
              neutral: '100%',
              negative: '0%',
              bearish: '0%',
              very_bearish: '0%'
            }
          },
          processedCount: 0
        },
        marketSummary: {
          bullishPercentage: '0%',
          bearishPercentage: '0%',
          neutralPercentage: '100%',
          marketTrend: 'neutral',
          averageConfidence: '0%'
        },
        topBullish: [],
        topBearish: []
      };
    }
  }

  /**
   * Get sentiment service statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/statistics`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting sentiment statistics:', error);
      return null;
    }
  }

  /**
   * Clear sentiment cache on backend
   */
  async clearCache(): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/cache/clear`);
      // Also clear local cache
      this.cache.clear();
      return response.data.success;
    } catch (error) {
      console.error('Error clearing sentiment cache:', error);
      return false;
    }
  }

  /**
   * Get sentiment color for UI display
   */
  getSentimentColor(sentiment: SentimentType): string {
    switch (sentiment) {
      case 'very_bullish':
        return '#10B981'; // Emerald-500
      case 'bullish':
        return '#34D399'; // Emerald-400
      case 'positive':
        return '#86EFAC'; // Emerald-300
      case 'neutral':
        return '#9CA3AF'; // Gray-400
      case 'negative':
        return '#FCA5A5'; // Red-300
      case 'bearish':
        return '#F87171'; // Red-400
      case 'very_bearish':
        return '#EF4444'; // Red-500
      default:
        return '#9CA3AF'; // Gray-400
    }
  }

  /**
   * Get sentiment emoji for UI display
   */
  getSentimentEmoji(sentiment: SentimentType): string {
    switch (sentiment) {
      case 'very_bullish':
        return '🚀';
      case 'bullish':
        return '📈';
      case 'positive':
        return '👍';
      case 'neutral':
        return '➖';
      case 'negative':
        return '👎';
      case 'bearish':
        return '📉';
      case 'very_bearish':
        return '💀';
      default:
        return '➖';
    }
  }

  /**
   * Calculate impact score based on sentiment and confidence
   */
  calculateImpactScore(sentiment: SentimentType, confidence: number): number {
    const sentimentWeights: Record<SentimentType, number> = {
      very_bullish: 1.0,
      bullish: 0.7,
      positive: 0.4,
      neutral: 0.1,
      negative: 0.4,
      bearish: 0.7,
      very_bearish: 1.0
    };

    const weight = sentimentWeights[sentiment] || 0.1;
    return Math.round(weight * confidence * 100);
  }
}

// Export singleton instance
export const sentimentService = new SentimentService();