/**
 * React Hook for Sentiment Analysis
 * Provides easy access to sentiment analysis features
 */

import { useState, useEffect, useCallback } from 'react';
import {
  sentimentService,
  SentimentType,
  SentimentResult,
  BatchSentimentResult,
  NewsSentimentResult
} from '../services/sentimentService';

interface UseSentimentOptions {
  autoFetch?: boolean;
  cacheTime?: number;
  limit?: number;
}

export const useSentiment = (options: UseSentimentOptions = {}) => {
  const { autoFetch = true, limit } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsSentiment, setNewsSentiment] = useState<NewsSentimentResult | null>(null);

  /**
   * Analyze single text sentiment
   */
  const analyzeSentiment = useCallback(async (text: string): Promise<SentimentResult | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await sentimentService.analyzeSentiment(text);
      return result;
    } catch (err) {
      setError('Failed to analyze sentiment');
      console.error('Sentiment analysis error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Analyze batch of texts
   */
  const analyzeBatch = useCallback(async (texts: string[]): Promise<BatchSentimentResult | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await sentimentService.analyzeBatch(texts);
      return result;
    } catch (err) {
      setError('Failed to analyze batch sentiment');
      console.error('Batch sentiment analysis error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch news sentiment analysis
   */
  const fetchNewsSentiment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await sentimentService.getNewsSentiment(limit);
      setNewsSentiment(result);
      return result;
    } catch (err) {
      setError('Failed to fetch news sentiment');
      console.error('News sentiment fetch error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [limit]);

  /**
   * Refresh sentiment data
   */
  const refresh = useCallback(async () => {
    await sentimentService.clearCache();
    return fetchNewsSentiment();
  }, [fetchNewsSentiment]);

  /**
   * Get sentiment color
   */
  const getSentimentColor = useCallback((sentiment: SentimentType) => {
    return sentimentService.getSentimentColor(sentiment);
  }, []);

  /**
   * Get sentiment emoji
   */
  const getSentimentEmoji = useCallback((sentiment: SentimentType) => {
    return sentimentService.getSentimentEmoji(sentiment);
  }, []);

  /**
   * Calculate impact score
   */
  const calculateImpactScore = useCallback((sentiment: SentimentType, confidence: number) => {
    return sentimentService.calculateImpactScore(sentiment, confidence);
  }, []);

  // Auto-fetch news sentiment on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchNewsSentiment();
    }
  }, [autoFetch]); // Removed fetchNewsSentiment from deps to prevent infinite loop

  return {
    // State
    loading,
    error,
    newsSentiment,

    // Actions
    analyzeSentiment,
    analyzeBatch,
    fetchNewsSentiment,
    refresh,

    // Utilities
    getSentimentColor,
    getSentimentEmoji,
    calculateImpactScore
  };
};

/**
 * Hook for sentiment filtering
 */
export const useSentimentFilter = (
  items: any[],
  sentimentField: string = 'sentiment'
) => {
  const [filter, setFilter] = useState<SentimentType | 'all'>('all');
  const [showOnlyHighImpact, setShowOnlyHighImpact] = useState(false);

  const filteredItems = items.filter(item => {
    // Apply sentiment filter
    if (filter !== 'all' && item[sentimentField] !== filter) {
      return false;
    }

    // Apply high impact filter
    if (showOnlyHighImpact) {
      const sentiment = item[sentimentField] as SentimentType;
      const confidence = item.confidence || 0;
      const impactScore = sentimentService.calculateImpactScore(sentiment, confidence);
      return impactScore >= 70; // High impact threshold
    }

    return true;
  });

  const sentimentCounts = items.reduce((acc, item) => {
    const sentiment = item[sentimentField] || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    filter,
    setFilter,
    showOnlyHighImpact,
    setShowOnlyHighImpact,
    filteredItems,
    sentimentCounts
  };
};