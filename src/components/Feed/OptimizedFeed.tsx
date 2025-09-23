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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NewsListItem from './NewsListItem';
import { feedService } from '../../services/news/feedService';
import { Article } from '../../types';
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

// Sentiment color mapping
const getSentimentColor = (sentiment?: string) => {
  switch (sentiment) {
    case 'very_bullish': return 'text-green-600 bg-green-50 border-green-200';
    case 'bullish': return 'text-green-500 bg-green-50 border-green-200';
    case 'positive': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    case 'neutral': return 'text-gray-500 bg-gray-50 border-gray-200';
    case 'negative': return 'text-orange-500 bg-orange-50 border-orange-200';
    case 'bearish': return 'text-red-500 bg-red-50 border-red-200';
    case 'very_bearish': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-500 bg-gray-50 border-gray-200';
  }
};

// Sentiment icon
const getSentimentIcon = (sentiment?: string) => {
  switch (sentiment) {
    case 'very_bullish': return ArrowUpCircle;
    case 'bullish': return TrendingUp;
    case 'positive': return TrendingUp;
    case 'neutral': return Circle;
    case 'negative': return TrendingDown;
    case 'bearish': return TrendingDown;
    case 'very_bearish': return ArrowDownCircle;
    default: return Circle;
  }
};

// Market signal indicator
const getMarketSignal = (sentiment?: string) => {
  switch (sentiment) {
    case 'very_bullish': return '🟢🟢 Strong Buy Signal';
    case 'bullish': return '🟢 Buy Signal';
    case 'positive': return '🟢 Mild Buy Signal';
    case 'neutral': return '⚪ Hold';
    case 'negative': return '🟡 Mild Sell Signal';
    case 'bearish': return '🔴 Sell Signal';
    case 'very_bearish': return '🔴🔴 Strong Sell Signal';
    default: return '⚪ No Signal';
  }
};

const OptimizedFeed: React.FC = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<FeedMode>('trending');
  const [sortBy, setSortBy] = useState<SortBy>('impact');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [page, setPage] = useState(0);
  const [allArticles, setAllArticles] = useState<EnhancedArticle[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch feed data with enhanced parameters
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['optimized-feed', mode, sortBy, sentimentFilter, page, user?.uid],
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
            Math.abs(a.sentiment_score || 0) > 0.5
          );
        }

        // Sort by impact if requested
        if (sortBy === 'impact') {
          filtered.sort((a: any, b: any) => {
            const aImpact = Math.abs(a.sentiment_score || 0) * (a.quality_score || 50) / 100;
            const bImpact = Math.abs(b.sentiment_score || 0) * (b.quality_score || 50) / 100;
            return bImpact - aImpact;
          });
        } else if (sortBy === 'sentiment') {
          filtered.sort((a: any, b: any) =>
            (b.sentiment_score || 0) - (a.sentiment_score || 0)
          );
        }

        return { ...response, articles: filtered };
      }

      return response;
    },
    refetchInterval: mode === 'trending' || mode === 'high-impact' ? 60000 : 300000,
    staleTime: 30000
  });

  // Calculate market sentiment summary
  const marketSummary = useMemo(() => {
    if (!allArticles.length) return null;

    const sentimentCounts = {
      very_bullish: 0,
      bullish: 0,
      neutral: 0,
      bearish: 0,
      very_bearish: 0
    };

    let totalScore = 0;
    allArticles.forEach(article => {
      const sentiment = article.sentiment as keyof typeof sentimentCounts;
      if (sentiment && sentimentCounts[sentiment] !== undefined) {
        sentimentCounts[sentiment]++;
      }
      totalScore += article.sentiment_score || 0;
    });

    const averageScore = totalScore / allArticles.length;
    const bullishPercent = ((sentimentCounts.very_bullish + sentimentCounts.bullish) / allArticles.length * 100).toFixed(1);
    const bearishPercent = ((sentimentCounts.very_bearish + sentimentCounts.bearish) / allArticles.length * 100).toFixed(1);

    return {
      averageScore,
      bullishPercent,
      bearishPercent,
      sentiment: averageScore > 0.3 ? 'Bullish' : averageScore < -0.3 ? 'Bearish' : 'Neutral',
      signal: averageScore > 0.5 ? '🟢 Strong Buy' : averageScore > 0.2 ? '🟢 Buy' :
              averageScore < -0.5 ? '🔴 Strong Sell' : averageScore < -0.2 ? '🔴 Sell' : '⚪ Hold'
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
    toast.success('Feed actualizado con análisis FinBERT');
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (data?.hasMore && !isFetching) {
      setPage(prev => prev + 1);
    }
  }, [data?.hasMore, isFetching]);

  // Get mode info with sentiment modes
  const getModeInfo = () => {
    switch (mode) {
      case 'trending':
        return {
          icon: TrendingUp,
          title: 'Trending',
          description: 'Noticias más importantes con análisis de sentimiento',
          color: 'text-red-500'
        };
      case 'bullish':
        return {
          icon: ArrowUpCircle,
          title: 'Señales Bullish',
          description: 'Solo noticias con sentimiento positivo',
          color: 'text-green-500'
        };
      case 'bearish':
        return {
          icon: ArrowDownCircle,
          title: 'Señales Bearish',
          description: 'Solo noticias con sentimiento negativo',
          color: 'text-red-600'
        };
      case 'high-impact':
        return {
          icon: Zap,
          title: 'Alto Impacto',
          description: 'Noticias con mayor impacto en el mercado',
          color: 'text-purple-500'
        };
      case 'my-interests':
        return {
          icon: Star,
          title: 'Mis Intereses',
          description: 'Personalizado según tus preferencias',
          color: 'text-yellow-500'
        };
      case 'all':
        return {
          icon: Globe,
          title: 'Todo el Mercado',
          description: 'Vista completa del mercado con sentimientos',
          color: 'text-blue-500'
        };
    }
  };

  const modeInfo = getModeInfo();
  const Icon = modeInfo.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Market Summary Card */}
      {marketSummary && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Sentimiento del Mercado</h2>
              <p className="text-3xl font-bold">{marketSummary.signal}</p>
              <p className="text-sm opacity-90 mt-1">
                {marketSummary.bullishPercent}% Bullish | {marketSummary.bearishPercent}% Bearish
              </p>
            </div>
            <div className="text-right">
              <BarChart3 className="w-12 h-12 opacity-50 mb-2" />
              <p className="text-sm">Score: {marketSummary.averageScore.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header with Enhanced Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Icon className={`w-8 h-8 ${modeInfo.color}`} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {modeInfo.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {modeInfo.description}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Enhanced Mode Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
          {['trending', 'bullish', 'bearish', 'high-impact', 'my-interests', 'all'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as FeedMode)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {m === 'bullish' ? '🟢 Bullish' :
               m === 'bearish' ? '🔴 Bearish' :
               m === 'high-impact' ? '⚡ Impacto' :
               m === 'my-interests' ? '⭐ Mis' :
               m === 'trending' ? '🔥 Trending' : '🌍 Todo'}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
            >
              {/* Sort Options */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="impact">Mayor Impacto</option>
                  <option value="sentiment">Sentimiento</option>
                  <option value="time">Más Reciente</option>
                  <option value="quality">Mejor Calidad</option>
                  <option value="importance">Importancia</option>
                </select>
              </div>

              {/* Sentiment Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Filtrar Sentimiento
                </label>
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value as SentimentFilter)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Todos</option>
                  <option value="very_bullish">🟢🟢 Muy Bullish</option>
                  <option value="bullish">🟢 Bullish</option>
                  <option value="neutral">⚪ Neutral</option>
                  <option value="bearish">🔴 Bearish</option>
                  <option value="very_bearish">🔴🔴 Muy Bearish</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <RefreshCw className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Analizando sentimientos con FinBERT...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-400">
                Error al cargar el feed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {(error as Error).message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Articles List with Sentiment */}
      {!isLoading && allArticles.length > 0 && (
        <div className="space-y-4">
          {allArticles.map((article, index) => {
            const SentimentIcon = getSentimentIcon(article.sentiment);
            const sentimentColors = getSentimentColor(article.sentiment);
            const impactScore = Math.abs(article.sentiment_score || 0) * (article.quality_score || 50) / 100;

            return (
              <motion.div
                key={article.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {/* Sentiment Badge */}
                <div className={`absolute -left-2 top-4 px-3 py-1 rounded-full ${sentimentColors} border flex items-center gap-1 z-10`}>
                  <SentimentIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    {article.sentiment_score?.toFixed(2)}
                  </span>
                </div>

                {/* Quality & Impact Badges */}
                <div className="absolute right-4 top-4 flex gap-2 z-10">
                  {article.quality_score && article.quality_score > 70 && (
                    <div className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      Q: {article.quality_score}/100
                    </div>
                  )}
                  {impactScore > 50 && (
                    <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      ⚡ High Impact
                    </div>
                  )}
                </div>

                <NewsListItem article={article as Article} />

                {/* Market Signal */}
                <div className="mt-2 ml-12 text-xs text-gray-600 dark:text-gray-400">
                  {getMarketSignal(article.sentiment)}
                </div>
              </motion.div>
            );
          })}

          {/* Load More */}
          {data?.hasMore && (
            <button
              onClick={loadMore}
              disabled={isFetching}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              {isFetching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Cargando más...
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Cargar más artículos
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && allArticles.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay artículos disponibles
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Intenta cambiar los filtros o actualizar el feed
          </p>
        </div>
      )}
    </div>
  );
};

export default OptimizedFeed;