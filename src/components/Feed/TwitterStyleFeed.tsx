import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Clock,
  Heart,
  Share2,
  Bookmark,
  Shield,
  Brain,
  ChevronDown,
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
  DollarSign,
  Search,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { feedService } from '../../services/news/feedService';
import { articleInteractionService } from '../../services/news/articleInteractionService';
import { useAuth } from '../../contexts/AuthContext';
import { calculateInterestMatch, getMatchBadge, formatMatchDetails } from '../../utils/interestMatching';
import { UserInterests, Article as GlobalArticle } from '../../types';
import toast from 'react-hot-toast';

// Types
type FeedMode = 'trending' | 'my-interests' | 'bullish' | 'bearish' | 'high-impact' | 'all' | 'search';
type SortBy = 'time' | 'importance' | 'quality' | 'sentiment' | 'impact' | 'interest-match' | 'relevance';

// Use the global Article type
type Article = GlobalArticle;

// Skeleton loader component
const ArticleSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 animate-pulse">
    <div className="flex space-x-2 sm:space-x-3">
      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 dark:bg-gray-600 rounded-full" />
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 sm:w-24" />
          <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16" />
        </div>
        <div className="space-y-2">
          <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
          <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
          <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6" />
        </div>
        <div className="mt-3 sm:mt-4 flex items-center space-x-4 sm:space-x-6">
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

// Helper function to normalize sectors to string array
const normalizeSectors = (sectors?: Array<string | { sector: string; confidence?: number }>): string[] => {
  if (!sectors) return [];
  return sectors.map(sector =>
    typeof sector === 'string' ? sector : sector.sector
  );
};

// Helper function to get source name as string
const getSourceName = (source?: string | { name: string; id?: string }): string => {
  if (!source) return 'Unknown';
  return typeof source === 'string' ? source : source.name;
};

// Helper function to get sentiment string
const getSentimentString = (sentiment?: string | { score?: number; label?: string }): string => {
  if (!sentiment) return 'neutral';
  return typeof sentiment === 'string' ? sentiment : (sentiment.label || 'neutral');
};

// Helper function to format timestamp
const formatTimestamp = (timestamp?: string | any): string => {
  if (!timestamp) return '';

  // Handle FirestoreTimestamp
  if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }

  // Handle string timestamp
  return typeof timestamp === 'string' ? timestamp : new Date().toISOString();
};

// Article Card Component
const ArticleCard: React.FC<{ article: Article; index: number; userInterests?: UserInterests | null }> = ({ article, index, userInterests }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Calculate interest match if user has interests
  const interestMatch = useMemo(() => {
    if (!userInterests) return null;
    return calculateInterestMatch({
      id: article.id,
      title: article.title,
      description: article.description || '',
      content: '',
      tickers: article.tickers,
      sectors: normalizeSectors(article.sectors),
      sentiment: article.sentiment as string,
      quality_score: article.quality_score,
      impact_score: article.importance_score || 0
    }, userInterests);
  }, [article, userInterests]);

  // Get match badge configuration
  const matchBadge = interestMatch ? getMatchBadge(interestMatch) : null;

  // Load initial interaction state
  useEffect(() => {
    const loadInteractions = async () => {
      if (article.id) {
        const interactions = await articleInteractionService.getUserInteractions(
          article.id,
          user?.uid
        );
        setLiked(interactions.liked);
        setSaved(interactions.saved);
      }
    };
    loadInteractions();
  }, [article.id, user?.uid]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isProcessing) return;
    setIsProcessing(true);

    // Optimistic update
    const previousState = liked;
    setLiked(!liked);

    try {
      const response = await articleInteractionService.toggleLike(article.id, user?.uid);

      if (response.success) {
        setLiked(response.liked || !previousState);
        if (response.liked) {
          toast.success('Added to favorites ❤️', { duration: 1000 });
        } else {
          toast.success('Removed from favorites', { duration: 1000 });
        }
      }
    } catch (error) {
      // Revert on error
      setLiked(previousState);
      toast.error('Failed to update like status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isProcessing) return;
    setIsProcessing(true);

    // Optimistic update
    const previousState = saved;
    setSaved(!saved);

    try {
      const response = await articleInteractionService.toggleSave(article.id, user?.uid);

      if (response.success) {
        setSaved(response.saved || !previousState);
        if (response.saved) {
          toast.success('Article saved 📌', { duration: 1000 });
        } else {
          toast.success('Article removed from saved', { duration: 1000 });
        }
      }
    } catch (error) {
      // Revert on error
      setSaved(previousState);
      toast.error('Failed to save article');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Track share event
    articleInteractionService.trackShare(article.id, user?.uid, 'web');

    // Web Share API (if available)
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.origin + `/article/${article.id}`
        });
        toast.success('Shared successfully! 🚀', { duration: 1500 });
      } catch (error) {
        // User cancelled or error
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: Copy link to clipboard
      const articleUrl = `${window.location.origin}/article/${article.id}`;
      navigator.clipboard.writeText(articleUrl);
      toast.success('Link copied to clipboard! 📋', { duration: 1500 });
    }
  };

  const handleArticleClick = () => {
    navigate(`/article/${article.id}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
      onClick={handleArticleClick}
    >
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start space-x-2 sm:space-x-3">
          {/* Avatar/Source Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
              {getSourceName(article.source)?.charAt(0) || 'N'}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Source & Time */}
            <div className="flex items-center flex-wrap gap-1 text-xs sm:text-sm">
              <span className="font-bold text-gray-900 dark:text-white hover:underline truncate">
                {getSourceName(article.source)}
              </span>
              <span className="text-gray-500 hidden xs:inline">·</span>
              <span className="text-gray-500 hover:underline">
                {formatTimeAgo(formatTimestamp(article.published_at || article.publishedAt))}
              </span>

              {/* Sentiment Badge */}
              {article.sentiment && (
                <>
                  <span className="text-gray-500 hidden xs:inline">·</span>
                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(getSentimentString(article.sentiment))}`}>
                    <span className="mr-1">{getSentimentEmoji(getSentimentString(article.sentiment))}</span>
                    <span className="hidden sm:inline">{getSentimentString(article.sentiment).replace('_', ' ').toUpperCase()}</span>
                  </span>
                </>
              )}

              {/* Interest Match Badge */}
              {matchBadge && (
                <>
                  <span className="text-gray-500 hidden xs:inline">·</span>
                  <span
                    className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold ${matchBadge.color} animate-pulse cursor-help`}
                    title={`${formatMatchDetails(interestMatch!)} - Score: ${interestMatch!.score}/100`}
                  >
                    <span className="mr-1">{matchBadge.icon}</span>
                    <span className="hidden sm:inline">{matchBadge.text}</span>
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h2 className="mt-1 text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white font-medium leading-snug">
              {article.title}
            </h2>

            {/* Description */}
            {article.description && (
              <p className="mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {article.description}
              </p>
            )}

            {/* Image */}
            {article.urlToImage && (
              <div className="mt-3 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="w-full h-48 sm:h-56 md:h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Tickers - Twitter style cashtags with sentiment indicator and interest highlighting */}
            {article.tickers && article.tickers.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1 sm:gap-2">
                <DollarSign className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                {article.tickers.slice(0, 5).map((ticker, idx) => {
                  // Determine ticker sentiment based on article sentiment
                  const sentimentStr = getSentimentString(article.sentiment);
                  const isPositive = sentimentStr && ['very_bullish', 'bullish', 'positive'].includes(sentimentStr);
                  const isNegative = sentimentStr && ['very_bearish', 'bearish', 'negative'].includes(sentimentStr);

                  // Check if this ticker matches user interests
                  const isInterestMatch = interestMatch?.matches.tickers.includes(ticker) || false;

                  return (
                    <a
                      key={idx}
                      href={`#${ticker}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast.success(`Viewing ${ticker} details`, { duration: 1500 });
                      }}
                      className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-xs sm:text-sm font-semibold transition-all hover:scale-105 min-h-[28px] ${
                        isInterestMatch
                          ? 'bg-yellow-50 text-yellow-800 border border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700 dark:hover:bg-yellow-900/30 animate-pulse'
                          : isPositive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                          : isNegative
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
                      }`}
                      title={isInterestMatch ? 'This ticker matches your interests!' : undefined}
                    >
                      {isInterestMatch && <Star className="w-3 h-3" />}
                      {!isInterestMatch && isPositive && <TrendingUp className="w-3 h-3" />}
                      {!isInterestMatch && isNegative && <TrendingDown className="w-3 h-3" />}
                      ${ticker}
                    </a>
                  );
                })}
                {article.tickers.length > 5 && (
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium px-1.5 py-0.5">
                    +{article.tickers.length - 5}
                  </span>
                )}
              </div>
            )}

            {/* Quality & Impact Scores */}
            {(article.quality_score || article.importance_score) && (
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {article.quality_score && (
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Quality: {article.quality_score}%</span>
                  </div>
                )}
                {article.importance_score && (
                  <div className="flex items-center gap-1">
                    <BarChart2 className="w-3 h-3" />
                    <span>Importance: {article.importance_score}%</span>
                  </div>
                )}
                {interestMatch && interestMatch.score > 0 && (
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Interest Match: {interestMatch.score}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Interest Match Information */}
            {interestMatch && interestMatch.totalMatches > 0 && (
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                    Why this matches your interests:
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {interestMatch.matchTypes.join(', ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {interestMatch.matches.tickers.length > 0 && (
                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                      <DollarSign className="w-3 h-3" />
                      <span>{interestMatch.matches.tickers.slice(0, 3).join(', ')}</span>
                      {interestMatch.matches.tickers.length > 3 && <span>+{interestMatch.matches.tickers.length - 3}</span>}
                    </div>
                  )}
                  {interestMatch.matches.sectors.length > 0 && (
                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                      <Activity className="w-3 h-3" />
                      <span>{interestMatch.matches.sectors.slice(0, 2).join(', ')}</span>
                      {interestMatch.matches.sectors.length > 2 && <span>+{interestMatch.matches.sectors.length - 2}</span>}
                    </div>
                  )}
                  {interestMatch.matches.topics.length > 0 && (
                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                      <Brain className="w-3 h-3" />
                      <span>{interestMatch.matches.topics.slice(0, 2).join(', ')}</span>
                      {interestMatch.matches.topics.length > 2 && <span>+{interestMatch.matches.topics.length - 2}</span>}
                    </div>
                  )}
                  {interestMatch.matches.keywords.length > 0 && (
                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                      <Target className="w-3 h-3" />
                      <span>{interestMatch.matches.keywords.slice(0, 2).join(', ')}</span>
                      {interestMatch.matches.keywords.length > 2 && <span>+{interestMatch.matches.keywords.length - 2}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-3">
                {/* Like */}
                <button
                  onClick={handleLike}
                  disabled={isProcessing}
                  className={`group flex items-center space-x-1 sm:space-x-2 transition-all p-2 rounded-full min-h-[44px] ${
                    liked
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''} ${isProcessing ? 'animate-pulse' : ''}`} />
                  <span className={`text-xs sm:text-sm ${liked ? 'text-red-500' : 'group-hover:text-red-500'} hidden sm:inline`}>
                    {liked ? 'Liked' : 'Like'}
                  </span>
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="group flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 min-h-[44px]"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-xs sm:text-sm group-hover:text-blue-500 hidden sm:inline">Share</span>
                </button>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className={`group flex items-center space-x-1 sm:space-x-2 transition-all p-2 rounded-full min-h-[44px] ${
                    saved
                      ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''} ${isProcessing ? 'animate-pulse' : ''}`} />
                  <span className={`text-xs sm:text-sm ${saved ? 'text-blue-500' : 'group-hover:text-blue-500'} hidden sm:inline`}>
                    {saved ? 'Saved' : 'Save'}
                  </span>
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
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mode, setMode] = useState<FeedMode>('trending');
  const [sortBy, setSortBy] = useState<SortBy>('time');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [userInterests, setUserInterests] = useState<UserInterests | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load user interests from localStorage or API
  useEffect(() => {
    const loadUserInterests = async () => {
      try {
        // First try localStorage for quick access
        const savedInterests = localStorage.getItem('userInterests');
        if (savedInterests) {
          setUserInterests(JSON.parse(savedInterests));
        }

        // Then try to load from backend if user is authenticated
        if (user?.uid) {
          const { feedService } = await import('../../services/news/feedService');
          const profile = await feedService.getProfile();
          if (profile?.interests) {
            setUserInterests(profile.interests);
            localStorage.setItem('userInterests', JSON.stringify(profile.interests));
          }
        }
      } catch (error) {
        console.error('Error loading user interests:', error);
      }
    };

    loadUserInterests();
  }, [user?.uid]);

  // Mode configurations
  const modeConfigs = [
    { mode: 'trending' as FeedMode, icon: Flame, label: 'Trending', color: 'from-orange-500 to-red-500' },
    { mode: 'my-interests' as FeedMode, icon: Star, label: 'My Interests', color: 'from-blue-500 to-indigo-500' },
    { mode: 'bullish' as FeedMode, icon: TrendingUp, label: 'Bullish', color: 'from-green-500 to-emerald-500' },
    { mode: 'bearish' as FeedMode, icon: TrendingDown, label: 'Bearish', color: 'from-red-500 to-orange-500' },
    { mode: 'high-impact' as FeedMode, icon: Zap, label: 'High Impact', color: 'from-purple-500 to-indigo-500' },
    { mode: 'all' as FeedMode, icon: Globe, label: 'All News', color: 'from-gray-500 to-gray-600' },
    { mode: 'search' as FeedMode, icon: Search, label: 'Search Results', color: 'from-indigo-500 to-purple-500' }
  ];

  // Sort options - conditionally include interest match if user has interests
  const sortOptions = [
    { value: 'impact' as SortBy, label: 'Impact', icon: Target },
    { value: 'sentiment' as SortBy, label: 'Sentiment', icon: Brain },
    { value: 'time' as SortBy, label: 'Latest', icon: Clock },
    { value: 'importance' as SortBy, label: 'Important', icon: Star },
    { value: 'quality' as SortBy, label: 'Quality', icon: Award },
    { value: 'relevance' as SortBy, label: 'Relevance', icon: Search },
    ...(userInterests ? [{ value: 'interest-match' as SortBy, label: 'Interest Match', icon: Target }] : [])
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
    queryKey: ['twitter-feed', user?.uid, mode, sortBy, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      let response;

      // If in search mode, use search endpoint
      if (mode === 'search' && searchQuery.trim()) {
        response = await feedService.searchArticles({
          q: searchQuery.trim(),
          sortBy: sortBy === 'impact' ? 'importance' : sortBy === 'interest-match' ? 'relevance' : sortBy as any,
          limit: 20,
          offset: pageParam * 20,
          userId: user?.uid
        });
      } else {
        // Regular feed mode
        response = await feedService.getSimpleFeed({
          mode: mode === 'bullish' || mode === 'bearish' || mode === 'high-impact' ? 'all' : mode as any,
          sortBy: sortBy === 'impact' || sortBy === 'sentiment' ? 'importance' : sortBy as any,
          limit: 20,
          offset: pageParam * 20,
          userId: user?.uid
        });
      }

      // Apply client-side filters for sentiment-based modes
      let filtered = response.articles || [];

      // Filter by user interests if in my-interests mode
      if (mode === 'my-interests' && user?.uid && userInterests) {
        // Client-side filtering to ensure only articles with interest matches are shown
        filtered = filtered.filter((a: any) => {
          const interestMatch = calculateInterestMatch({
            id: a.id,
            title: a.title,
            description: a.description || '',
            content: '',
            tickers: a.tickers,
            sectors: normalizeSectors(a.sectors),
            sentiment: a.sentiment,
            quality_score: a.quality_score,
            impact_score: a.impact_score || 0
          }, userInterests);

          // Only show articles with a minimum interest score of 15 or at least one match
          return interestMatch.score >= 15 || interestMatch.totalMatches > 0;
        });

        // Sort by interest match score by default
        filtered.sort((a: any, b: any) => {
          const aMatch = calculateInterestMatch({
            id: a.id,
            title: a.title,
            description: a.description || '',
            content: '',
            tickers: a.tickers,
            sectors: normalizeSectors(a.sectors),
            sentiment: a.sentiment,
            quality_score: a.quality_score,
            impact_score: a.impact_score || 0
          }, userInterests);

          const bMatch = calculateInterestMatch({
            id: b.id,
            title: b.title,
            description: b.description || '',
            content: '',
            tickers: b.tickers,
            sectors: normalizeSectors(b.sectors),
            sentiment: b.sentiment,
            quality_score: b.quality_score,
            impact_score: b.impact_score || 0
          }, userInterests);

          return bMatch.score - aMatch.score;
        });
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
          Math.abs(a.sentiment_score || 0) > 0.5 || (a.importance_score && a.importance_score > 70)
        );
      }

      // Sort by impact, sentiment, or interest match if requested
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
      } else if (sortBy === 'interest-match' && userInterests) {
        filtered.sort((a: any, b: any) => {
          const aMatch = calculateInterestMatch({
            id: a.id,
            title: a.title,
            description: a.description || '',
            content: '',
            tickers: a.tickers,
            sectors: normalizeSectors(a.sectors),
            sentiment: a.sentiment,
            quality_score: a.quality_score,
            impact_score: a.impact_score || 0
          }, userInterests);

          const bMatch = calculateInterestMatch({
            id: b.id,
            title: b.title,
            description: b.description || '',
            content: '',
            tickers: b.tickers,
            sectors: normalizeSectors(b.sectors),
            sentiment: b.sentiment,
            quality_score: b.quality_score,
            impact_score: b.impact_score || 0
          }, userInterests);

          return bMatch.score - aMatch.score;
        });
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

  // Search functions
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      setMode('search');
      setSortBy('relevance');
      setIsSearching(false);
      toast.success(`Searching for: "${query}"`, { duration: 2000 });
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSearch(false);
    setIsSearching(false);
    setMode('trending');
    setSortBy('time');
  }, []);

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
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                <span className="hidden sm:inline">Financial News Feed</span>
                <span className="sm:hidden">News Feed</span>
              </h1>
              <div className="flex items-center px-1.5 sm:px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white text-xs font-medium">
                <Brain className="w-3 h-3 mr-1" />
                <span className="hidden xs:inline">FinBERT AI</span>
                <span className="xs:hidden">AI</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              {/* Sort Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                >
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-400 hidden sm:inline" />
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
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-3 flex gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide px-1 -mx-1 sm:px-0 sm:mx-0">
            {modeConfigs.map((config) => {
              const Icon = config.icon;
              return (
                <button
                  key={config.mode}
                  onClick={() => setMode(config.mode)}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all min-h-[36px] ${
                    mode === config.mode
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg scale-105`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search news by ticker, company, topic, or keyword..."
                    value={isSearching ? searchQuery : ''}
                    onChange={(e) => {
                      setIsSearching(true);
                      setSearchQuery(e.target.value);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        handleSearch(searchQuery);
                      }
                    }}
                    className="block w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {mode === 'search' ? (
                      <button
                        onClick={handleClearSearch}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      </button>
                    ) : searchQuery.trim() && isSearching ? (
                      <button
                        onClick={() => handleSearch(searchQuery)}
                        className="p-1 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
                      >
                        <Search className="h-4 w-4 text-white" />
                      </button>
                    ) : null}
                  </div>
                </div>
                {/* Search Results Info */}
                {mode === 'search' && searchQuery && (
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Search results for: <strong>"{searchQuery}"</strong></span>
                    <span>{allArticles.length} results found</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Interest Match Summary for My Interests mode */}
          {mode === 'my-interests' && userInterests && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Your Interests</span>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/30 px-2 py-1 rounded-full">
                  {allArticles.filter(article => {
                    const match = calculateInterestMatch({
                      id: article.id,
                      title: article.title,
                      description: article.description || '',
                      content: '',
                      tickers: article.tickers,
                      sectors: normalizeSectors(article.sectors),
                      sentiment: article.sentiment as string,
                      quality_score: article.quality_score,
                      impact_score: article.importance_score || 0
                    }, userInterests);
                    return match.score > 20;
                  }).length} matches
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {userInterests.tickers.length} tickers
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {userInterests.sectors.length} sectors
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {userInterests.topics.length} topics
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {(userInterests.keywords?.length || 0)} keywords
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
                userInterests={userInterests}
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
            {mode === 'my-interests' ? (
              <div>
                <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No articles match your interests
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No articles found that match your tickers, sectors, topics, or keywords.
                  Try expanding your interests or check back later.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => navigate('/preferences')}
                    className="px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                  >
                    Manage Interests
                  </button>
                  <button
                    onClick={() => refetch()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                  >
                    Refresh Feed
                  </button>
                </div>
              </div>
            ) : (
              <div>
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
        )}
      </div>
    </div>
  );
};

export default TwitterStyleFeed;