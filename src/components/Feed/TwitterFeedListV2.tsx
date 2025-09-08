import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFeed } from '../../hooks/useFeed';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { feedService } from '../../services/feedService';
import {
  Bookmark,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  RefreshCw,
  Loader,
  AlertCircle,
  Clock,
  Target,
  Hash,
  User,
  Globe,
  Heart,
  Share,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import QualityBadge from '../QualityBadge/QualityBadge';
import { FirestoreTimestamp } from '../../types';

type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';
type FeedTab = 'latest' | 'personalized';

const TwitterFeedListV2: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [limit, setLimit] = useState(20);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [activeTab, setActiveTab] = useState<FeedTab>('latest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { user } = useAuth();

  // Use different sort strategies based on active tab
  const sortStrategy = activeTab === 'latest' ? 'time' : 'personalized';
  
  // Configurar opciones según el tab activo
  const feedOptions = activeTab === 'personalized' 
    ? {
        limit,
        sortBy: 'personalized' as const,
        onlyMyInterests: true, // Filtrar por intereses del usuario
        minRelevanceScore: 30 // Mínimo 30% de relevancia
      }
    : {
        limit,
        sortBy: 'time' as const,
        onlyMyInterests: false, // Mostrar todo en cronológico
        minRelevanceScore: 0
      };

  const {
    articles,
    isLoading,
    error,
    hasMore,
    trackView,
    likeArticle,
    saveArticle,
    refetch,
  } = useFeed(feedOptions);

  // Get user profile for personalized interests
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => feedService.getProfile(),
    enabled: !!user && activeTab === 'personalized',
    staleTime: 5 * 60 * 1000,
  });

  // Filter articles by sentiment
  const filteredArticles = articles.filter((article) => {
    if (sentimentFilter === 'all') return true;
    
    const sentiment = article.sentiment?.toLowerCase() || 'neutral';
    
    if (sentimentFilter === 'positive') {
      return sentiment.includes('bullish') || sentiment === 'positive' || sentiment === 'very_bullish';
    } else if (sentimentFilter === 'negative') {
      return sentiment.includes('bearish') || sentiment === 'negative' || sentiment === 'very_bearish';
    } else {
      return sentiment === 'neutral';
    }
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success(t('feed.updated'), { duration: 1000 });
  }, [refetch, t]);

  const handleShare = useCallback(async (article: any) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.origin + `/article/${article.id}`,
        });
      } else {
        await navigator.clipboard.writeText(
          `${article.title}\n${window.location.origin}/article/${article.id}`
        );
        toast.success(t('common.linkCopied'), { duration: 1000 });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [t]);

  const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return null;
    
    const s = sentiment.toLowerCase();
    if (s.includes('bullish') || s === 'positive') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (s.includes('bearish') || s === 'negative') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const formatTimeAgo = (date: string | FirestoreTimestamp | undefined) => {
    if (!date) return t('common.dateNotAvailable');
    
    try {
      let articleDate: Date;
      
      if (typeof date === 'string') {
        articleDate = new Date(date);
      } else if ((date as FirestoreTimestamp)._seconds) {
        articleDate = new Date((date as FirestoreTimestamp)._seconds * 1000);
      } else {
        articleDate = new Date(date as any);
      }
      
      if (isNaN(articleDate.getTime())) {
        console.warn('Invalid date:', date);
        return t('common.dateNotAvailable');
      }
      
      const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
      return articleDate.toLocaleString(locale, { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Mexico_City'
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return t('common.dateNotAvailable');
    }
  };

  if (isLoading && articles.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{t('feed.errorLoading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with simplified tabs */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          {/* Main Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('feed.title')}
            </h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title={t('common.refresh')}
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-3 sm:mb-4">
            <button
              onClick={() => setActiveTab('latest')}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'latest'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('feed.title')}</span>
              <span className="sm:hidden">Latest</span>
            </button>
            
            {user && (
              <button
                onClick={() => setActiveTab('personalized')}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'personalized'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t('feed.myPersonalizedInterests')}</span>
                <span className="sm:hidden">Personal</span>
              </button>
            )}
          </div>

          {/* Sentiment Filters - Mobile Optimized */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSentimentFilter('all')}
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                sentimentFilter === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {t('feed.filters.all')}
            </button>
            
            <button
              onClick={() => setSentimentFilter('positive')}
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                sentimentFilter === 'positive'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('article.sentiments.positive')}
            </button>
            
            <button
              onClick={() => setSentimentFilter('neutral')}
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                sentimentFilter === 'neutral'
                  ? 'bg-gray-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('article.sentiments.neutral')}
            </button>
            
            <button
              onClick={() => setSentimentFilter('negative')}
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                sentimentFilter === 'negative'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('article.sentiments.negative')}
            </button>
          </div>

          {/* Personalized Interests Info Panel */}
          {activeTab === 'personalized' && user && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              {profileLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Loading your interests...
                  </span>
                </div>
              ) : userProfile?.interests ? (
                <div className="space-y-2">
                  {userProfile.interests.tickers && userProfile.interests.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                        Your tickers:
                      </span>
                      {userProfile.interests.tickers.slice(0, 5).map((ticker) => (
                        <span
                          key={ticker}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium"
                        >
                          <Hash className="w-3 h-3" />
                          {ticker}
                        </span>
                      ))}
                      {userProfile.interests.tickers.length > 5 && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          +{userProfile.interests.tickers.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-blue-700 dark:text-blue-300">
                  <Target className="w-5 h-5 mx-auto mb-1 opacity-60" />
                  Configure your interests in Settings to see personalized news
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Articles List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        <AnimatePresence mode="popLayout">
          {filteredArticles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
              onClick={() => trackView(article.id)}
            >
              <Link to={`/article/${article.id}`} className="block">
                <div className="flex gap-3">
                  {/* Article Image */}
                  {article.urlToImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={article.urlToImage}
                        alt=""
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-gray-200 dark:bg-gray-700"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  {/* Article Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h2>
                    
                    {/* Description */}
                    {article.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {article.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {/* Time */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(article.publishedAt || article.published_at || article.createdAt || article.created_at)}</span>
                      </div>
                      
                      {/* Sentiment */}
                      {article.sentiment && (
                        <div className="flex items-center gap-1">
                          {getSentimentIcon(article.sentiment)}
                          <span className="capitalize">
                            {article.sentiment.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Quality Badge */}
                      {article.quality_classification && (
                        <QualityBadge classification={article.quality_classification} size="sm" />
                      )}

                      {/* Tickers */}
                      {article.tickers && article.tickers.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span>{article.tickers.slice(0, 2).join(', ')}</span>
                          {article.tickers.length > 2 && (
                            <span>+{article.tickers.length - 2}</span>
                          )}
                        </div>
                      )}
                      
                      {/* NUEVO: Empresas detectadas */}
                      {article.companies && article.companies.length > 0 && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <span className="font-medium">📊</span>
                          <span className="text-xs">{article.companies.slice(0, 2).join(', ')}</span>
                          {article.companies.length > 2 && (
                            <span>+{article.companies.length - 2}</span>
                          )}
                        </div>
                      )}
                      
                      {/* NUEVO: Sectores detectados */}
                      {article.sectors && article.sectors.length > 0 && (
                        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <span className="font-medium">🏢</span>
                          <span className="text-xs">
                            {article.sectors.slice(0, 2).map(s => 
                              typeof s === 'string' ? s : s.sector
                            ).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* NUEVO: Método de extracción (solo en modo debug) */}
                      {article.extraction_metadata?.method && article.extraction_metadata.method.includes('huggingface') && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <span className="font-medium">🤖</span>
                          <span className="text-xs">AI Enhanced</span>
                        </div>
                      )}
                    </div>

                    {/* Personalization Match Reason - Solo en feed personalizado */}
                    {activeTab === 'personalized' && article.personalization?.reason && 
                     article.personalization.reason !== 'Market: stocks' && (
                      <div className="mt-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
                          <Target className="w-3 h-3" />
                          <span className="font-medium">Matches: </span>
                          <span>{
                            // Filtrar "Market: stocks" si hay otras coincidencias
                            article.personalization.reason.includes(',') 
                              ? article.personalization.reason
                                  .split(', ')
                                  .filter(r => r !== 'Market: stocks')
                                  .join(', ')
                              : article.personalization.reason
                          }</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      likeArticle(article.id);
                    }}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      article.userInteraction?.liked
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${article.userInteraction?.liked ? 'fill-current' : ''}`} />
                    <span>0</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      saveArticle(article.id);
                    }}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      article.userInteraction?.saved
                        ? 'text-blue-500 hover:text-blue-600'
                        : 'text-gray-500 hover:text-blue-500'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${article.userInteraction?.saved ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShare(article);
                    }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <Share className="w-4 h-4" />
                  </button>
                </div>

                {/* Source */}
                {article.source && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {typeof article.source === 'string' ? article.source : article.source.name}
                  </span>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 && !isLoading && (
        <div className="p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            {activeTab === 'personalized' && (!userProfile?.interests || 
              (!userProfile.interests.tickers?.length && !userProfile.interests.sectors?.length && !userProfile.interests.topics?.length)) ? (
              <>
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No interests configured</p>
                <p className="text-sm mb-4">Configure your interests in Settings to see personalized news</p>
                <Link 
                  to="/preferences"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configure Preferences
                </Link>
              </>
            ) : activeTab === 'personalized' ? (
              <>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  No articles matching your interests right now
                </p>
                <div className="text-sm mb-4 space-y-1">
                  {userProfile?.interests?.tickers && userProfile.interests.tickers.length > 0 && (
                    <p>📈 Tickers: {userProfile.interests.tickers.join(', ')}</p>
                  )}
                  {userProfile?.interests?.sectors && userProfile.interests.sectors.length > 0 && (
                    <p>🏢 Sectors: {userProfile.interests.sectors.join(', ')}</p>
                  )}
                  {userProfile?.interests?.topics && userProfile.interests.topics.length > 0 && (
                    <p>📰 Topics: {userProfile.interests.topics.join(', ')}</p>
                  )}
                  {userProfile?.interests?.keywords && userProfile.interests.keywords.length > 0 && (
                    <p>🔍 Keywords: {userProfile.interests.keywords.join(', ')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Try these options:</p>
                  <button
                    onClick={() => setActiveTab('latest')}
                    className="block w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    View Latest News (All Articles)
                  </button>
                  <Link 
                    to="/preferences"
                    className="block w-full px-4 py-2 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                  >
                    Adjust Your Preferences
                  </Link>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  No {sentimentFilter !== 'all' ? sentimentFilter : ''} news available
                </p>
                <p className="text-sm">Check back later for new articles</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Load More */}
      {hasMore && filteredArticles.length > 0 && (
        <div className="p-4 text-center">
          <button
            onClick={() => setLimit(limit + 20)}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              t('common.viewMore')
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TwitterFeedListV2;