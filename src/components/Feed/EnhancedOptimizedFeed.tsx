import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Globe,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Activity,
  Clock,
  Award,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  Circle,
  BarChart3,
  Zap,
  Flame,
  Target,
  DollarSign,
  Eye,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NewsListItem from './NewsListItem';
import { feedService } from '../../services/news/feedService';
import { Article, Sentiment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useSentiment } from '../../hooks/useSentiment';
import { SentimentType } from '../../services/sentimentService';

// Enhanced types with sentiment
type FeedMode = 'trending' | 'my-interests' | 'all' | 'bullish' | 'bearish' | 'high-impact';
type SortBy = 'time' | 'importance' | 'quality' | 'sentiment' | 'impact';
type SentimentFilter = SentimentType | 'all';

interface EnhancedArticle extends Omit<Article, 'sentiment'> {
  sentiment?: SentimentType;
  sentiment_score?: number;
  sentiment_confidence?: number;
  quality_score?: number;
  impact_score?: number;
}

// Enhanced sentiment color mapping with gradients
const getSentimentColor = (sentiment?: string) => {
  switch (sentiment) {
    case 'very_bullish': return 'from-green-500 to-emerald-500';
    case 'bullish': return 'from-green-400 to-emerald-400';
    case 'positive': return 'from-emerald-300 to-green-300';
    case 'neutral': return 'from-gray-300 to-gray-400';
    case 'negative': return 'from-orange-300 to-red-300';
    case 'bearish': return 'from-red-400 to-orange-400';
    case 'very_bearish': return 'from-red-500 to-red-600';
    default: return 'from-gray-300 to-gray-400';
  }
};

// Enhanced sentiment badge with better visuals
const getSentimentBadge = (sentiment?: string) => {
  switch (sentiment) {
    case 'very_bullish':
      return { emoji: '🚀', text: 'MUY BULLISH', color: 'bg-green-500 text-white' };
    case 'bullish':
      return { emoji: '📈', text: 'BULLISH', color: 'bg-green-400 text-white' };
    case 'positive':
      return { emoji: '👍', text: 'POSITIVO', color: 'bg-emerald-400 text-white' };
    case 'neutral':
      return { emoji: '➖', text: 'NEUTRAL', color: 'bg-gray-400 text-white' };
    case 'negative':
      return { emoji: '👎', text: 'NEGATIVO', color: 'bg-orange-400 text-white' };
    case 'bearish':
      return { emoji: '📉', text: 'BEARISH', color: 'bg-red-400 text-white' };
    case 'very_bearish':
      return { emoji: '🔻', text: 'MUY BEARISH', color: 'bg-red-500 text-white' };
    default:
      return { emoji: '❓', text: 'DESCONOCIDO', color: 'bg-gray-300 text-gray-700' };
  }
};

// Market signal with enhanced visuals
const getMarketSignal = (sentiment?: string, score?: number) => {
  const strength = Math.abs(score || 0);

  if (sentiment === 'very_bullish' || (sentiment === 'bullish' && strength > 0.7)) {
    return { icon: '🟢🟢', text: 'COMPRA FUERTE', color: 'text-green-600' };
  } else if (sentiment === 'bullish' || sentiment === 'positive') {
    return { icon: '🟢', text: 'COMPRA', color: 'text-green-500' };
  } else if (sentiment === 'very_bearish' || (sentiment === 'bearish' && strength > 0.7)) {
    return { icon: '🔴🔴', text: 'VENTA FUERTE', color: 'text-red-600' };
  } else if (sentiment === 'bearish' || sentiment === 'negative') {
    return { icon: '🔴', text: 'VENTA', color: 'text-red-500' };
  } else {
    return { icon: '⚪', text: 'MANTENER', color: 'text-gray-500' };
  }
};

const EnhancedOptimizedFeed: React.FC = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<FeedMode>('trending');
  const [sortBy, setSortBy] = useState<SortBy>('impact');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [page, setPage] = useState(0);
  const [allArticles, setAllArticles] = useState<EnhancedArticle[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Use sentiment hook for real-time analysis
  const {
    newsSentiment,
    fetchNewsSentiment,
    getSentimentColor: getSentimentColorHelper,
    getSentimentEmoji
  } = useSentiment({ autoFetch: false });

  // Fetch feed data with enhanced parameters
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['enhanced-feed', mode, sortBy, sentimentFilter, page, user?.uid],
    queryFn: async () => {
      const response = await feedService.getSimpleFeed({
        mode: mode === 'bullish' || mode === 'bearish' || mode === 'high-impact' ? 'all' : mode,
        sortBy: sortBy === 'impact' || sortBy === 'sentiment' ? 'importance' : sortBy as 'time' | 'importance' | 'quality',
        limit: 30,
        offset: page * 30,
        userId: user?.uid
      });

      // Apply client-side filters for sentiment-based modes
      if (response?.articles) {
        let filtered = response.articles;

        // Filter by sentiment
        if (sentimentFilter !== 'all') {
          filtered = filtered.filter((a: any) => a.sentiment === sentimentFilter);
        }

        // Apply mode-specific filters
        if (mode === 'bullish') {
          filtered = filtered.filter((a: any) =>
            a.sentiment === 'very_bullish' || a.sentiment === 'bullish' || a.sentiment === 'positive'
          );
        } else if (mode === 'bearish') {
          filtered = filtered.filter((a: any) =>
            a.sentiment === 'very_bearish' || a.sentiment === 'bearish' || a.sentiment === 'negative'
          );
        } else if (mode === 'high-impact') {
          filtered = filtered.filter((a: any) =>
            Math.abs(a.sentiment_score || 0) > 0.5 || a.impact_score > 70
          );
        }

        // Sort by impact if requested
        if (sortBy === 'impact') {
          filtered.sort((a: any, b: any) => {
            const aImpact = (Math.abs(a.sentiment_score || 0) * (a.quality_score || 50)) / 100;
            const bImpact = (Math.abs(b.sentiment_score || 0) * (b.quality_score || 50)) / 100;
            return bImpact - aImpact;
          });
        } else if (sortBy === 'sentiment') {
          filtered.sort((a: any, b: any) =>
            Math.abs(b.sentiment_score || 0) - Math.abs(a.sentiment_score || 0)
          );
        }

        return { ...response, articles: filtered };
      }

      return response;
    },
    refetchInterval: mode === 'trending' || mode === 'high-impact' ? 60000 : 300000,
    staleTime: 30000
  });

  // Enhanced market summary with better calculations
  const marketSummary = useMemo(() => {
    if (!allArticles.length) return null;

    const sentimentCounts = {
      very_bullish: 0,
      bullish: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      bearish: 0,
      very_bearish: 0
    };

    let totalScore = 0;
    let confidenceSum = 0;
    let validCount = 0;

    allArticles.forEach(article => {
      const sentiment = article.sentiment as keyof typeof sentimentCounts;
      if (sentiment && sentimentCounts[sentiment] !== undefined) {
        sentimentCounts[sentiment]++;
      }
      if (article.sentiment_score !== undefined) {
        totalScore += article.sentiment_score;
        confidenceSum += article.sentiment_confidence || 0.5;
        validCount++;
      }
    });

    const averageScore = validCount > 0 ? totalScore / validCount : 0;
    const averageConfidence = validCount > 0 ? confidenceSum / validCount : 0;

    const bullishCount = sentimentCounts.very_bullish + sentimentCounts.bullish + sentimentCounts.positive;
    const bearishCount = sentimentCounts.very_bearish + sentimentCounts.bearish + sentimentCounts.negative;
    const neutralCount = sentimentCounts.neutral;

    const bullishPercent = allArticles.length > 0 ? ((bullishCount / allArticles.length) * 100).toFixed(1) : '0';
    const bearishPercent = allArticles.length > 0 ? ((bearishCount / allArticles.length) * 100).toFixed(1) : '0';
    const neutralPercent = allArticles.length > 0 ? ((neutralCount / allArticles.length) * 100).toFixed(1) : '0';

    // Market trend analysis
    let trend = 'LATERAL';
    let trendIcon = '↔️';
    let trendColor = 'text-gray-600';

    if (averageScore > 0.3) {
      trend = 'ALCISTA';
      trendIcon = '📈';
      trendColor = 'text-green-600';
    } else if (averageScore < -0.3) {
      trend = 'BAJISTA';
      trendIcon = '📉';
      trendColor = 'text-red-600';
    }

    const signal = getMarketSignal(
      averageScore > 0.3 ? 'bullish' : averageScore < -0.3 ? 'bearish' : 'neutral',
      averageScore
    );

    return {
      averageScore,
      averageConfidence,
      bullishPercent,
      bearishPercent,
      neutralPercent,
      bullishCount,
      bearishCount,
      neutralCount,
      trend,
      trendIcon,
      trendColor,
      signal,
      totalArticles: allArticles.length
    };
  }, [allArticles]);

  // Update articles when data changes
  useEffect(() => {
    if (data?.articles) {
      if (page === 0) {
        setAllArticles(data.articles as EnhancedArticle[]);
      } else {
        setAllArticles(prev => [...prev, ...(data.articles as EnhancedArticle[])]);
      }
    }
  }, [data, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
    setAllArticles([]);
  }, [mode, sortBy, sentimentFilter]);

  const handleRefresh = useCallback(() => {
    setPage(0);
    setAllArticles([]);
    refetch();
    fetchNewsSentiment();
    toast.success('Feed actualizado con análisis FinBERT 🚀');
  }, [refetch, fetchNewsSentiment]);

  const loadMore = useCallback(() => {
    if (data?.hasMore && !isFetching) {
      setPage(prev => prev + 1);
    }
  }, [data?.hasMore, isFetching]);

  // Mode configurations with better icons
  const modeConfigs = [
    {
      mode: 'trending' as FeedMode,
      icon: Flame,
      label: 'Trending',
      description: 'Lo más relevante',
      color: 'from-orange-500 to-red-500'
    },
    {
      mode: 'bullish' as FeedMode,
      icon: TrendingUp,
      label: 'Bullish',
      description: 'Señales positivas',
      color: 'from-green-500 to-emerald-500'
    },
    {
      mode: 'bearish' as FeedMode,
      icon: TrendingDown,
      label: 'Bearish',
      description: 'Señales negativas',
      color: 'from-red-500 to-red-600'
    },
    {
      mode: 'high-impact' as FeedMode,
      icon: Zap,
      label: 'Alto Impacto',
      description: 'Mayor volatilidad',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      mode: 'my-interests' as FeedMode,
      icon: Star,
      label: 'Mis Intereses',
      description: 'Personalizado',
      color: 'from-yellow-400 to-orange-400'
    },
    {
      mode: 'all' as FeedMode,
      icon: Globe,
      label: 'Todo',
      description: 'Sin filtros',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Error al cargar el feed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Enhanced Market Summary Card */}
        {marketSummary && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Sentimiento del Mercado
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Análisis de {marketSummary.totalArticles} noticias
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${marketSummary.trendColor}`}>
                  {marketSummary.trendIcon} {marketSummary.trend}
                </span>
                <div className={`text-sm font-semibold ${marketSummary.signal.color}`}>
                  {marketSummary.signal.icon} {marketSummary.signal.text}
                </div>
              </div>
            </div>

            {/* Sentiment Bars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  🟢 Bullish ({marketSummary.bullishCount})
                </span>
                <div className="flex-1 mx-3 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${marketSummary.bullishPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {marketSummary.bullishPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ⚪ Neutral ({marketSummary.neutralCount})
                </span>
                <div className="flex-1 mx-3 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${marketSummary.neutralPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-gray-300 to-gray-400"
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {marketSummary.neutralPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  🔴 Bearish ({marketSummary.bearishCount})
                </span>
                <div className="flex-1 mx-3 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${marketSummary.bearishPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-400 to-red-500"
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {marketSummary.bearishPercent}%
                </span>
              </div>
            </div>

            {/* Score Meter */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Score</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {marketSummary.averageScore.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute h-full transition-all duration-500 ${
                    marketSummary.averageScore > 0
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                      : 'bg-gradient-to-r from-red-400 to-red-500'
                  }`}
                  style={{
                    width: `${Math.abs(marketSummary.averageScore) * 50}%`,
                    left: marketSummary.averageScore > 0 ? '50%' : 'auto',
                    right: marketSummary.averageScore < 0 ? '50%' : 'auto'
                  }}
                />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Mode Selector Tabs */}
        <div className="mb-6">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {modeConfigs.map((config) => (
              <motion.button
                key={config.mode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(config.mode)}
                className={`
                  relative p-3 rounded-xl transition-all duration-300
                  ${mode === config.mode
                    ? 'bg-gradient-to-r ' + config.color + ' text-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
                  }
                `}
              >
                <config.icon className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-semibold">{config.label}</div>
                {mode === config.mode && (
                  <motion.div
                    layoutId="mode-indicator"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Quick Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Ordenar:</span>
            {[
              { value: 'time' as SortBy, label: 'Reciente', icon: Clock },
              { value: 'impact' as SortBy, label: 'Impacto', icon: Zap },
              { value: 'sentiment' as SortBy, label: 'Sentimiento', icon: Activity }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${sortBy === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <option.icon className="inline w-3 h-3 mr-1" />
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Actualizar</span>
          </button>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Filtrar por Sentimiento
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all' as SentimentFilter, label: 'Todos', color: 'bg-gray-100 dark:bg-gray-700' },
                    { value: 'very_bullish' as SentimentFilter, label: '🚀 Muy Bullish', color: 'bg-green-100 dark:bg-green-900' },
                    { value: 'bullish' as SentimentFilter, label: '📈 Bullish', color: 'bg-green-50 dark:bg-green-800' },
                    { value: 'neutral' as SentimentFilter, label: '➖ Neutral', color: 'bg-gray-50 dark:bg-gray-700' },
                    { value: 'bearish' as SentimentFilter, label: '📉 Bearish', color: 'bg-red-50 dark:bg-red-900' },
                    { value: 'very_bearish' as SentimentFilter, label: '🔻 Muy Bearish', color: 'bg-red-100 dark:bg-red-800' }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setSentimentFilter(filter.value)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${sentimentFilter === filter.value
                          ? 'ring-2 ring-blue-500 ' + filter.color + ' transform scale-105'
                          : filter.color + ' hover:scale-105'
                        }
                      `}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Articles List */}
        <div className="space-y-4">
          {isLoading && page === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Analizando sentimiento con FinBERT...</p>
              </div>
            </div>
          ) : allArticles.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">No hay artículos disponibles</p>
            </div>
          ) : (
            <AnimatePresence>
              {allArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="flex">
                    {/* Sentiment Indicator Bar */}
                    <div className={`w-1 bg-gradient-to-b ${getSentimentColor(article.sentiment)}`} />

                    <div className="flex-1 p-4">
                      {/* Article Header with Enhanced Badges */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Sentiment Badge */}
                          {article.sentiment && (
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${getSentimentBadge(article.sentiment).color}`}>
                              {getSentimentBadge(article.sentiment).emoji} {getSentimentBadge(article.sentiment).text}
                            </div>
                          )}

                          {/* Impact Score Badge */}
                          {article.impact_score && article.impact_score > 70 && (
                            <div className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                              ⚡ Alto Impacto
                            </div>
                          )}

                          {/* Quality Score */}
                          {article.quality_score && article.quality_score >= 80 && (
                            <div className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                              ⭐ Q{article.quality_score}
                            </div>
                          )}
                        </div>

                        {/* Market Signal */}
                        {article.sentiment && (
                          <div className={`text-sm font-bold ${getMarketSignal(article.sentiment, article.sentiment_score).color}`}>
                            {getMarketSignal(article.sentiment, article.sentiment_score).icon} {getMarketSignal(article.sentiment, article.sentiment_score).text}
                          </div>
                        )}
                      </div>

                      {/* Article Content */}
                      <NewsListItem article={article as Article} />

                      {/* Enhanced Footer */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {/* Sentiment Score */}
                          {article.sentiment_score !== undefined && (
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              <span>Score: {article.sentiment_score.toFixed(2)}</span>
                            </div>
                          )}

                          {/* Confidence */}
                          {article.sentiment_confidence !== undefined && (
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              <span>Conf: {(article.sentiment_confidence * 100).toFixed(0)}%</span>
                            </div>
                          )}

                          {/* Tickers */}
                          {article.tickers && article.tickers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <div className="flex gap-1">
                                {article.tickers.slice(0, 3).map(ticker => (
                                  <span key={ticker} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                                    ${ticker}
                                  </span>
                                ))}
                                {article.tickers.length > 3 && (
                                  <span className="text-gray-400">+{article.tickers.length - 3}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <button className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Load More Button */}
        {data?.hasMore && !isLoading && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              disabled={isFetching}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            >
              {isFetching ? (
                <>
                  <RefreshCw className="inline w-4 h-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Eye className="inline w-4 h-4 mr-2" />
                  Cargar más artículos
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedOptimizedFeed;