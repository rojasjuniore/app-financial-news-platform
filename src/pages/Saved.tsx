import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { feedService } from '../services/news/feedService';
import { FirestoreTimestamp } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader, 
  Bookmark, 
  ArrowLeft, 
  Share2, 
  X, 
  Hash, 
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  FileText,
  BookmarkX
} from 'lucide-react';
import toast from 'react-hot-toast';
import QualityBadge from '../components/QualityBadge/QualityBadge';
import { isPositiveSentiment, isNegativeSentiment } from '../utils/sentimentHelpers';

const Saved: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Obtener artículos guardados directamente del endpoint
  const { data: savedResponse, isLoading, error } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => feedService.getSavedArticles(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Filtrar artículos que están siendo removidos
  const savedArticles = (savedResponse?.articles || []).filter(
    article => !removingIds.has(article.id)
  );

  // Mutation para quitar artículos guardados
  const unsaveMutation = useMutation({
    mutationFn: (articleId: string) => feedService.unsaveArticle(articleId),
    onMutate: async (articleId: string) => {
      // Optimistic update: marcar como removiendo
      setRemovingIds(prev => new Set(prev).add(articleId));
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['savedArticles'] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['savedArticles']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['savedArticles'], (old: any) => ({
        ...old,
        articles: old?.articles?.filter((article: any) => article.id !== articleId) || []
      }));
      
      // Return a context object with the snapshotted value
      return { previousData, articleId };
    },
    onError: (error: any, articleId: string, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['savedArticles'], context.previousData);
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    },
    onSettled: (data, error, articleId) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      // Remove from removing set
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
      
      if (!error) {
        toast.success(t('saved.removedFromSaved'));
      }
    },
  });

  const handleUnsave = (articleId: string) => {
    unsaveMutation.mutate(articleId);
  };

  const handleShare = async (article: any) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.origin + `/article/${article.id}`
        });
      } else {
        await navigator.clipboard.writeText(
          `${article.title}\n${window.location.origin}/article/${article.id}`
        );
        toast.success(t('common.linkCopied'));
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
    }
  };

  const getSentimentIcon = (sentiment?: any) => {
    if (!sentiment) return null;
    
    if (isPositiveSentiment(sentiment)) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (isNegativeSentiment(sentiment)) {
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
      
      return articleDate.toLocaleString('es-ES', { 
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
      return t('common.dateNotAvailable');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader className="animate-spin w-10 h-10 text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">{t('saved.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">{t('saved.errorLoading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/feed"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            {t('article.backToFeed')}
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl text-white">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('saved.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('saved.articlesCount', { count: savedArticles.length })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {savedArticles.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <BookmarkX className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('saved.noSaved')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {t('saved.saveForLater')}
            </p>
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('saved.exploreNews')}
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {savedArticles.map((article) => (
                <motion.div 
                  key={article.id}
                  layout
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden"
                >
                {/* Imagen del artículo como header */}
                {article.urlToImage && (
                  <div className="relative">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      onClick={() => handleUnsave(article.id)}
                      disabled={removingIds.has(article.id)}
                      className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full shadow-md backdrop-blur-sm transition-all group"
                      title={t('saved.removeFromSaved')}
                    >
                      {removingIds.has(article.id) ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <BookmarkX className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      )}
                    </button>
                  </div>
                )}
                
                <div className="p-4">
                  {/* Header sin imagen */}
                  {!article.urlToImage && (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => handleUnsave(article.id)}
                        disabled={removingIds.has(article.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all group"
                        title={t('saved.removeFromSaved')}
                      >
                        {removingIds.has(article.id) ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <BookmarkX className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Título compacto */}
                  <Link
                    to={`/article/${article.id}`}
                    className="block group mb-2"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 text-sm leading-tight">
                      {article.title}
                    </h3>
                  </Link>

                  {/* Meta información compacta */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>{typeof article.source === 'string' ? article.source : 'Unknown'}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(article.publishedAt || article.published_at || article.createdAt || article.created_at)}</span>
                    {article.sentiment && (
                      <>
                        <span>•</span>
                        {getSentimentIcon(article.sentiment)}
                      </>
                    )}
                  </div>

                  {/* Quality Badge */}
                  {article.quality_classification && (
                    <div className="mb-2">
                      <QualityBadge 
                        classification={article.quality_classification}
                        size="sm"
                        showTooltip={true}
                        showScore={false}
                      />
                    </div>
                  )}

                  {/* Descripción breve */}
                  {article.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-xs line-clamp-2 mb-3">
                      {article.description}
                    </p>
                  )}

                  {/* Tickers compactos */}
                  {article.tickers && article.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tickers.slice(0, 3).map((ticker) => (
                        <span
                          key={ticker}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs font-medium"
                        >
                          <Hash className="w-2.5 h-2.5" />
                          {ticker}
                        </span>
                      ))}
                      {article.tickers.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                          +{article.tickers.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Acciones compactas */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShare(article)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                        title={t('article.share')}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all"
                          title={t('article.readOriginal')}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      
                      <Link
                        to={`/article/${article.id}`}
                        className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-all"
                        title={t('saved.viewFullAnalysis')}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="flex items-center">
                      <Bookmark className="w-3 h-3 text-blue-500 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('article.saved')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;