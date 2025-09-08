import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFeed } from '../../hooks/useFeed';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { feedService } from '../../services/news/feedService';
import {
  Bookmark,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  RefreshCw,
  Loader,
  AlertCircle,
  BarChart3,
  Hash,
  ChevronDown,
  ChevronUp,
  Settings,
  Target,
  DollarSign,
  Clock,
  Award,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import QualityBadge from '../QualityBadge/QualityBadge';
import { FirestoreTimestamp } from '../../types';

type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';
type SortOption = 'time' | 'quality' | 'personalized';

const TwitterFeedList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [limit, setLimit] = useState(20);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInterests, setShowInterests] = useState(false);
  
  const { user } = useAuth();

  const {
    articles,
    isLoading,
    error,
    hasMore,
    trackView,
    likeArticle,
    saveArticle,
    refetch,
  } = useFeed({ limit, sortBy });

  // Obtener perfil del usuario para mostrar intereses
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => feedService.getProfile(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Filtrar artículos por sentimiento
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
  }, [refetch]);

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
      console.error('Error compartiendo:', error);
    }
  }, []);

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
      
      // Si es una cadena ISO, úsala directamente
      if (typeof date === 'string') {
        articleDate = new Date(date);
      } else if ((date as FirestoreTimestamp)._seconds) {
        // Si es un timestamp de Firestore, conviértelo
        articleDate = new Date((date as FirestoreTimestamp)._seconds * 1000);
      } else {
        articleDate = new Date(date as any);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(articleDate.getTime())) {
        console.warn('Invalid date:', date);
        return t('common.dateNotAvailable');
      }
      
      // Mostrar fecha y hora completas como solicitó el usuario
      const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
      return articleDate.toLocaleString(locale, { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Mexico_City' // Ajustar zona horaria
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Fecha no disponible';
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
      {/* Header con filtros */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('feed.title')}
            </h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>

          {/* Botón para ver intereses */}
          {user && (
            <button
              onClick={() => setShowInterests(!showInterests)}
              className="mb-3 w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {t('feed.myPersonalizedInterests')}
                </span>
              </div>
              {showInterests ? (
                <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          )}

          {/* Filtros por sentimiento */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setSentimentFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sentimentFilter === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('feed.filters.all')}
            </button>
            <button
              onClick={() => setSentimentFilter('positive')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                sentimentFilter === 'positive'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {t('article.sentiments.positive')}
            </button>
            <button
              onClick={() => setSentimentFilter('neutral')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                sentimentFilter === 'neutral'
                  ? 'bg-gray-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Minus className="w-4 h-4" />
              {t('article.sentiments.neutral')}
            </button>
            <button
              onClick={() => setSentimentFilter('negative')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                sentimentFilter === 'negative'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              {t('article.sentiments.negative')}
            </button>
          </div>

          {/* Opciones de Ordenamiento */}
          <div className="flex gap-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2 py-2">
              {t('common.sortBy')}:
            </span>
            <button
              onClick={() => setSortBy('time')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                sortBy === 'time'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              {t('feed.sortOptions.latest')}
            </button>
            <button
              onClick={() => setSortBy('quality')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                sortBy === 'quality'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Award className="w-4 h-4" />
              {t('feed.sortOptions.quality')}
            </button>
            <button
              onClick={() => setSortBy('personalized')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                sortBy === 'personalized'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <User className="w-4 h-4" />
              {t('feed.sortOptions.relevant')}
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Intereses Desplegable */}
      <AnimatePresence>
        {showInterests && user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50">
              {profileLoading ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : userProfile ? (
                <div className="space-y-4">
                  {/* Tickers */}
                  {userProfile.interests?.tickers && userProfile.interests.tickers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t('settings.tickersOfInterest')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.interests.tickers.map((ticker) => (
                          <span
                            key={ticker}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-medium"
                          >
                            <Hash className="w-3 h-3" />
                            {ticker}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sectores */}
                  {userProfile.interests?.sectors && userProfile.interests.sectors.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t('settings.sectors')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.interests.sectors.map((sector) => (
                          <span
                            key={sector}
                            className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium capitalize"
                          >
                            {sector}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Temas */}
                  {userProfile.interests?.topics && userProfile.interests.topics.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t('settings.topics')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.interests.topics.map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium capitalize"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tipos de Mercado */}
                  {userProfile.interests?.marketTypes && userProfile.interests.marketTypes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t('settings.marketTypes')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.interests.marketTypes.map((marketType) => (
                          <span
                            key={marketType}
                            className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-full text-xs font-medium capitalize"
                          >
                            {marketType === 'stocks' ? t('markets.stocks') : marketType === 'crypto' ? t('markets.crypto') : t('markets.forex')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enlace a configuraciones */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      to="/settings"
                      className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {t('settings.modifyInterests')}
                    </Link>
                  </div>

                  {/* Mensaje si no hay intereses configurados */}
                  {(!userProfile.interests?.tickers?.length && 
                    !userProfile.interests?.sectors?.length && 
                    !userProfile.interests?.topics?.length && 
                    !userProfile.interests?.marketTypes?.length) && (
                    <div className="text-center py-6">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {t('settings.noInterestsConfigured')}
                      </p>
                      <Link
                        to="/settings"
                        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        <Settings className="w-4 h-4" />
                        {t('settings.configureInterests')}
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-600 dark:text-red-400">
                    {t('settings.errorLoadingInterests')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed Timeline */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        <AnimatePresence mode="popLayout">
          {filteredArticles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
              onClick={() => trackView(article.id)}
            >
              <div className="flex gap-3">
                {/* Avatar/Logo placeholder */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {typeof article.source === 'string'
                          ? article.source
                          : (article.source as any)?.name || 'Financial News'}
                      </span>
                      {/* Market Type Badge */}
                      {article.market_type && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          article.market_type === 'stocks' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          article.market_type === 'crypto' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                          article.market_type === 'forex' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          article.market_type === 'commodities' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                          'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                        }`}>
                          {article.market_type}
                        </span>
                      )}
                      <span className="text-gray-500 dark:text-gray-400">·</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {formatTimeAgo(article.publishedAt || article.published_at || article.createdAt || article.created_at)}
                      </span>
                      {article.sentiment && getSentimentIcon(article.sentiment)}
                      {/* Quality Badge */}
                      {article.quality_classification && (
                        <QualityBadge 
                          classification={article.quality_classification}
                          size="sm"
                          showTooltip={true}
                        />
                      )}
                    </div>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Título como link */}
                  <Link
                    to={`/article/${article.id}`}
                    className="block group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 className="text-gray-900 dark:text-white font-medium mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h2>
                  </Link>

                  {/* Descripción */}
                  {article.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                      {article.description}
                    </p>
                  )}

                  {/* Tickers */}
                  {article.tickers && article.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.tickers.map((ticker) => (
                        <span
                          key={ticker}
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-sm"
                        >
                          <Hash className="w-3 h-3" />
                          {ticker}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Imagen preview si existe */}
                  {article.urlToImage && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Acciones - Solo enlaces al artículo y guardar */}
                  <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                    <Link
                      to={`/article/${article.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      Ver análisis completo →
                    </Link>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveArticle(article.id);
                        toast.success('Guardado', { duration: 500 });
                      }}
                      className={`p-2 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all ${
                        article.userInteraction?.saved ? 'text-blue-500' : ''
                      }`}
                    >
                      <Bookmark
                        className="w-5 h-5"
                        fill={article.userInteraction?.saved ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setLimit((prev) => prev + 20)}
            disabled={isLoading}
            className="w-full py-3 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-xl transition-all font-medium"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Cargar más noticias'
            )}
          </button>
        </div>
      )}

      {/* Empty state */}
      {filteredArticles.length === 0 && !isLoading && (
        <div className="p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              No hay noticias {sentimentFilter !== 'all' ? sentimentFilter + 's' : ''} disponibles
            </p>
            <p className="text-sm">
              Intenta cambiar los filtros o actualizar el feed
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwitterFeedList;