import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Clock,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  Shield,
  Brain,
  ChevronDown,
  Repeat2,
  BarChart2,
  Globe,
  Flame,
  Zap,
  Star,
  Award,
  Target,
  Filter,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  Circle,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { feedService } from '../../services/news/feedService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Types
type FeedMode = 'trending' | 'my-interests' | 'bullish' | 'bearish' | 'high-impact' | 'all';
type SortBy = 'time' | 'importance' | 'quality' | 'sentiment' | 'impact';

// Enhanced types
interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  source: string;
  author?: string;
  publishedAt?: string;
  published_at?: string; // Backend sends with underscore
  sentiment?: string;
  sentiment_score?: number;
  sentiment_confidence?: number;
  quality_score?: number;
  impact_score?: number;
  tickers?: string[];
}

// Skeleton loader component
const ArticleSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 animate-pulse">
    <div className="flex space-x-3">
      <div className="flex-shrink-0 w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full" />
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6" />
        </div>
        <div className="mt-4 flex items-center space-x-6">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

// Get sentiment color
const getSentimentColor = (sentiment?: string) => {
  switch (sentiment) {
    case 'very_bullish': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    case 'bullish': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
    case 'positive': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
    case 'neutral': return 'text-gray-500 bg-gray-50 dark:bg-gray-800/20';
    case 'negative': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
    case 'bearish': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    case 'very_bearish': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    default: return 'text-gray-500 bg-gray-50 dark:bg-gray-800/20';
  }
};

// Get sentiment emoji
const getSentimentEmoji = (sentiment?: string) => {
  switch (sentiment) {
    case 'very_bullish': return '🚀';
    case 'bullish': return '📈';
    case 'positive': return '👍';
    case 'neutral': return '➖';
    case 'negative': return '👎';
    case 'bearish': return '📉';
    case 'very_bearish': return '🔻';
    default: return '📊';
  }
};

// Format time like Twitter
const formatTimeAgo = (date: string | undefined) => {
  if (!date) return 'Now';

  const now = new Date();
  const publishedDate = new Date(date);

  // Check if date is valid
  if (isNaN(publishedDate.getTime())) {
    return 'Recently';
  }

  const diffInSeconds = Math.floor((now.getTime() - publishedDate.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

  return publishedDate.toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

// Article Card Component
const ArticleCard: React.FC<{ article: Article; index: number }> = ({ article, index }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      toast.success('Added to favorites', { duration: 1000 });
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    if (!saved) {
      toast.success('Article saved', { duration: 1000 });
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start space-x-3">
          {/* Avatar/Source Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {article.source?.charAt(0) || 'N'}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Source & Time */}
            <div className="flex items-center space-x-1 text-sm">
              <span className="font-bold text-gray-900 dark:text-white hover:underline">
                {article.source}
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 hover:underline">
                {formatTimeAgo(article.published_at || article.publishedAt)}
              </span>

              {/* Sentiment Badge */}
              {article.sentiment && (
                <>
                  <span className="text-gray-500">·</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(article.sentiment)}`}>
                    <span className="mr-1">{getSentimentEmoji(article.sentiment)}</span>
                    {article.sentiment.replace('_', ' ').toUpperCase()}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h2 className="mt-1 text-gray-900 dark:text-white font-medium leading-snug">
              {article.title}
            </h2>

            {/* Description */}
            {article.description && (
              <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                {article.description}
              </p>
            )}

            {/* Image */}
            {article.urlToImage && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Tickers - Twitter style cashtags with sentiment indicator */}
            {article.tickers && article.tickers.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DollarSign className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                {article.tickers.slice(0, 5).map((ticker, idx) => {
                  // Determine ticker sentiment based on article sentiment
                  const isPositive = article.sentiment && ['very_bullish', 'bullish', 'positive'].includes(article.sentiment);
                  const isNegative = article.sentiment && ['very_bearish', 'bearish', 'negative'].includes(article.sentiment);

                  return (
                    <a
                      key={idx}
                      href={`#${ticker}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast.success(`Viewing ${ticker} details`, { duration: 1500 });
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-semibold transition-all hover:scale-105 ${
                        isPositive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                          : isNegative
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
                      }`}
                    >
                      {isPositive && <TrendingUp className="w-3 h-3" />}
                      {isNegative && <TrendingDown className="w-3 h-3" />}
                      ${ticker}
                    </a>
                  );
                })}
                {article.tickers.length > 5 && (
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                    +{article.tickers.length - 5} more
                  </span>
                )}
              </div>
            )}

            {/* Quality & Impact Scores */}
            {(article.quality_score || article.impact_score) && (
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {article.quality_score && (
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Quality: {article.quality_score}%</span>
                  </div>
                )}
                {article.impact_score && (
                  <div className="flex items-center gap-1">
                    <BarChart2 className="w-3 h-3" />
                    <span>Impact: {article.impact_score}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {/* Comment */}
                <button className="group flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm group-hover:text-blue-500">
                    {Math.floor(Math.random() * 50)}
                  </span>
                </button>

                {/* Retweet */}
                <button className="group flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20">
                  <Repeat2 className="w-5 h-5" />
                  <span className="text-sm group-hover:text-green-500">
                    {Math.floor(Math.random() * 100)}
                  </span>
                </button>

                {/* Like */}
                <button
                  onClick={handleLike}
                  className={`group flex items-center space-x-2 transition-colors p-2 rounded-full ${
                    liked
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  <span className={`text-sm ${liked ? 'text-red-500' : 'group-hover:text-red-500'}`}>
                    {Math.floor(Math.random() * 200) + (liked ? 1 : 0)}
                  </span>
                </button>

                {/* Share */}
                <button className="group text-gray-500 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Save & More */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleSave}
                  className={`transition-colors p-2 rounded-full ${
                    saved
                      ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                </button>

                <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

// Main Twitter Style Feed Component
const TwitterStyleFeed: React.FC = () => {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mode, setMode] = useState<FeedMode>('trending');
  const [sortBy, setSortBy] = useState<SortBy>('time');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Mode configurations
  const modeConfigs = [
    { mode: 'trending' as FeedMode, icon: Flame, label: 'Trending', color: 'from-orange-500 to-red-500' },
    { mode: 'my-interests' as FeedMode, icon: Star, label: 'My Interests', color: 'from-blue-500 to-indigo-500' },
    { mode: 'bullish' as FeedMode, icon: TrendingUp, label: 'Bullish', color: 'from-green-500 to-emerald-500' },
    { mode: 'bearish' as FeedMode, icon: TrendingDown, label: 'Bearish', color: 'from-red-500 to-orange-500' },
    { mode: 'high-impact' as FeedMode, icon: Zap, label: 'High Impact', color: 'from-purple-500 to-indigo-500' },
    { mode: 'all' as FeedMode, icon: Globe, label: 'All News', color: 'from-gray-500 to-gray-600' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'impact' as SortBy, label: 'Impact', icon: Target },
    { value: 'sentiment' as SortBy, label: 'Sentiment', icon: Brain },
    { value: 'time' as SortBy, label: 'Latest', icon: Clock },
    { value: 'importance' as SortBy, label: 'Important', icon: Star },
    { value: 'quality' as SortBy, label: 'Quality', icon: Award }
  ];

  // Infinite query for pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['twitter-feed', user?.uid, mode, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await feedService.getSimpleFeed({
        mode: mode === 'bullish' || mode === 'bearish' || mode === 'high-impact' ? 'all' : mode as any,
        sortBy: sortBy === 'impact' || sortBy === 'sentiment' ? 'importance' : sortBy as any,
        limit: 20,
        offset: pageParam * 20,
        userId: user?.uid
      });

      // Apply client-side filters for sentiment-based modes
      let filtered = response.articles || [];

      // Filter by user interests if in my-interests mode
      if (mode === 'my-interests' && user?.uid) {
        // This will use the user's personalized feed from the backend
        // The backend already filters by user interests
      } else if (mode === 'bullish') {
        filtered = filtered.filter((a: any) =>
          a.sentiment === 'very_bullish' || a.sentiment === 'bullish' || a.sentiment === 'positive'
        );
      } else if (mode === 'bearish') {
        filtered = filtered.filter((a: any) =>
          a.sentiment === 'very_bearish' || a.sentiment === 'bearish' || a.sentiment === 'negative'
        );
      } else if (mode === 'high-impact') {
        filtered = filtered.filter((a: any) =>
          Math.abs(a.sentiment_score || 0) > 0.5 || (a.impact_score && a.impact_score > 70)
        );
      }

      // Sort by impact or sentiment if requested
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

      return {
        articles: filtered,
        nextPage: response.hasMore ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 60000,
    refetchInterval: 180000
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success('Feed updated! 🚀', { duration: 2000 });
  }, [refetch]);

  // Flatten all pages of articles
  const allArticles = data?.pages.flatMap(page => page.articles) || [];

  // Market summary calculation
  const marketSummary = useMemo(() => {
    if (!allArticles.length) return null;

    const sentimentCounts = {
      bullish: 0,
      bearish: 0,
      neutral: 0
    };

    allArticles.forEach((article: any) => {
      if (article.sentiment) {
        if (['very_bullish', 'bullish', 'positive'].includes(article.sentiment)) {
          sentimentCounts.bullish++;
        } else if (['very_bearish', 'bearish', 'negative'].includes(article.sentiment)) {
          sentimentCounts.bearish++;
        } else {
          sentimentCounts.neutral++;
        }
      }
    });

    const total = allArticles.length;
    const bullishPercent = Math.round((sentimentCounts.bullish / total) * 100);
    const bearishPercent = Math.round((sentimentCounts.bearish / total) * 100);
    const neutralPercent = Math.round((sentimentCounts.neutral / total) * 100);

    let trend = 'Neutral Market';
    let trendIcon = '➖';
    let trendColor = 'text-gray-600';

    if (bullishPercent > bearishPercent + 20) {
      trend = 'Bullish Trend';
      trendIcon = '📈';
      trendColor = 'text-green-600';
    } else if (bearishPercent > bullishPercent + 20) {
      trend = 'Bearish Trend';
      trendIcon = '📉';
      trendColor = 'text-red-600';
    }

    return {
      bullishPercent,
      bearishPercent,
      neutralPercent,
      bullishCount: sentimentCounts.bullish,
      bearishCount: sentimentCounts.bearish,
      neutralCount: sentimentCounts.neutral,
      totalArticles: total,
      trend,
      trendIcon,
      trendColor
    };
  }, [allArticles]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300">Error loading feed</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Financial News Feed
              </h1>
              <div className="flex items-center px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white text-xs font-medium">
                <Brain className="w-3 h-3 mr-1" />
                FinBERT AI
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Sort Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center gap-1"
                >
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>

                {showSortMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortMenu(false);
                          }}
                          className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            sortBy === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {modeConfigs.map((config) => {
              const Icon = config.icon;
              return (
                <button
                  key={config.mode}
                  onClick={() => setMode(config.mode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    mode === config.mode
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg scale-105`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Market Summary */}
          {marketSummary && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Market Sentiment</span>
                </div>
                <span className={`text-sm font-bold flex items-center gap-1 ${marketSummary.trendColor}`}>
                  <span>{marketSummary.trendIcon}</span>
                  {marketSummary.trend}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="flex items-center gap-1">
                  <ArrowUpCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {marketSummary.bullishPercent}% Bullish
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {marketSummary.neutralPercent}% Neutral
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowDownCircle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {marketSummary.bearishPercent}% Bearish
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          // Show skeleton loaders while loading
          <>
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
          </>
        ) : (
          <AnimatePresence>
            {allArticles.map((article, index) => (
              <ArticleCard
                key={`${article.id}-${index}`}
                article={article as Article}
                index={index}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <>
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
          </>
        )}

        {/* Intersection observer target */}
        <div ref={observerTarget} className="h-10" />

        {/* End of feed message */}
        {!hasNextPage && allArticles.length > 0 && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <ChevronDown className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              You're all caught up!
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              No more articles to show
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && allArticles.length === 0 && (
          <div className="p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No articles yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Check back later for the latest financial news
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Refresh Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitterStyleFeed;