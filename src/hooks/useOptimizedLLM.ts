import { useState, useCallback, useEffect } from 'react';
import { getOptimizedLLMService } from '../services/llm/optimizedLLMService';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface StreamingData {
  type: 'start' | 'section' | 'content' | 'progress' | 'complete' | 'error';
  content?: string;
  name?: string;
  value?: number;
  error?: string;
}

interface UseOptimizedLLMOptions {
  autoGenerate?: boolean;
  model?: 'openai' | 'claude' | 'gemini' | 'gpt-3.5';
  language?: string;
}

export function useOptimizedLLM(articleId: string | undefined, options: UseOptimizedLLMOptions = {}) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [panelDiscussion, setPanelDiscussion] = useState<any>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingProgress, setStreamingProgress] = useState<number>(0);
  const [performance, setPerformance] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const llmService = getOptimizedLLMService();

  // Generate analysis with optimization
  const generateAnalysis = useCallback(async (
    forceRegenerate = false,
    model = options.model || 'openai'
  ) => {
    if (!articleId) return;

    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const result = await llmService.generateAnalysis(articleId, model, {
        forceRegenerate,
        language: options.language || 'en'
      });

      setAnalysis(result);
      setPerformance({
        ...result.performance,
        totalTime: Date.now() - startTime
      });

      // Show performance toast
      if (result.fromCache) {
        toast.success(`⚡ ${t('analysis.loadedFromCache')} (${result.performance?.responseTime || 0}ms)`, {
          duration: 2000,
          icon: '💾'
        });
      } else if (result.performance?.model !== model) {
        toast.success(`🔄 ${t('analysis.fallbackUsed')}: ${result.performance?.model}`, {
          duration: 3000
        });
      } else {
        toast.success(`✨ ${t('analysis.generated')} (${result.performance?.responseTime || 0}ms)`, {
          duration: 2000
        });
      }

      return result;
    } catch (err: any) {
      console.error('Error generating analysis:', err);
      setError(err);
      toast.error(t('errors.generatingAnalysis'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [articleId, llmService, options.language, options.model, t]);

  // Generate panel discussion with parallelization
  const generatePanelDiscussion = useCallback(async (forceRegenerate = false) => {
    if (!articleId) return;

    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const result = await llmService.generatePanelDiscussion(articleId, {
        forceRegenerate,
        language: options.language || 'en'
      });

      setPanelDiscussion(result);
      setPerformance({
        ...result.performance,
        totalTime: Date.now() - startTime
      });

      // Show performance info
      if (result.fromCache) {
        toast.success(`⚡ ${t('panel.loadedFromCache')} (${result.performance?.responseTime || 0}ms)`, {
          duration: 2000,
          icon: '💾'
        });
      } else {
        toast.success(
          `🚀 ${t('panel.generatedParallel')} ${result.participantCount} ${t('panel.models')} (${result.performance?.responseTime || 0}ms)`,
          { duration: 3000 }
        );
      }

      return result;
    } catch (err: any) {
      console.error('Error generating panel discussion:', err);
      setError(err);
      toast.error(t('errors.generatingPanel'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [articleId, llmService, options.language, t]);

  // Start streaming analysis
  const startStreaming = useCallback((
    model = options.model || 'openai',
    onMessage?: (data: StreamingData) => void
  ) => {
    if (!articleId) return;

    setStreamingContent('');
    setStreamingProgress(0);
    setError(null);

    const eventSource = llmService.startStreamingAnalysis(articleId, model, {
      language: options.language || 'en',
      onMessage: (data: StreamingData) => {
        if (data.type === 'content') {
          setStreamingContent(prev => prev + (data.content || ''));
        } else if (data.type === 'progress') {
          setStreamingProgress(data.value || 0);
        }
        onMessage?.(data);
      },
      onError: (err) => {
        console.error('Streaming error:', err);
        setError(err);
        toast.error(t('errors.streamingFailed'));
      },
      onComplete: () => {
        setStreamingProgress(100);
        toast.success(t('analysis.streamingComplete'));
      }
    });

    return () => {
      llmService.stopStreaming();
    };
  }, [articleId, llmService, options.language, options.model, t]);

  // Clear cache for current article
  const clearCache = useCallback(async () => {
    if (!articleId) return;

    try {
      await llmService.clearArticleCache(articleId);
      toast.success(t('cache.cleared'));
      setAnalysis(null);
      setPanelDiscussion(null);
    } catch (err) {
      console.error('Error clearing cache:', err);
      toast.error(t('errors.clearingCache'));
    }
  }, [articleId, llmService, t]);

  // Get cache statistics
  const getCacheStats = useCallback(async () => {
    try {
      const stats = await llmService.getCacheStats();
      return stats;
    } catch (err) {
      console.error('Error getting cache stats:', err);
      return null;
    }
  }, [llmService]);

  // Auto-generate if configured
  useEffect(() => {
    if (options.autoGenerate && articleId && !analysis) {
      generateAnalysis(false, options.model);
    }
  }, [articleId, options.autoGenerate, options.model]); // eslint-disable-line

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      llmService.stopStreaming();
    };
  }, [llmService]);

  return {
    // State
    isLoading,
    analysis,
    panelDiscussion,
    streamingContent,
    streamingProgress,
    performance,
    error,
    
    // Actions
    generateAnalysis,
    generatePanelDiscussion,
    startStreaming,
    clearCache,
    getCacheStats,
    
    // Utilities
    isFromCache: analysis?.fromCache || panelDiscussion?.fromCache,
    responseTime: performance?.responseTime,
    isFallback: performance?.model !== options.model
  };
}