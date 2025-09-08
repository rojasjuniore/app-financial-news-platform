import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useFeed } from '../../hooks/useFeed';
import { useDebounce } from '../../hooks/usePerformance';
import ArticleCard from './ArticleCard';
import {
  FeedLoadingSkeleton,
  InitialLoadingState,
  LoadingMoreState,
  RefreshingState,
  ErrorState,
  EmptyState
} from '../Loading/LoadingStates';
import { Loader, TrendingUp, AlertCircle, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const FeedList: React.FC = () => {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(20);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    articles, 
    isLoading, 
    error, 
    hasMore,
    trackView,
    likeArticle,
    saveArticle,
    refetch
  } = useFeed({ limit });

  // Debounced handlers for better performance
  const debouncedTrackView = useDebounce(trackView, 200);
  const debouncedLike = useDebounce(likeArticle, 100);
  const debouncedSave = useDebounce(saveArticle, 100);

  // Memoized event handlers
  const handleView = useCallback((id: string) => {
    debouncedTrackView(id);
  }, [debouncedTrackView]);

  const handleLike = useCallback((id: string) => {
    debouncedLike(id);
    toast.success('Artículo marcado como favorito', {
      duration: 1000,
      position: 'bottom-right'
    });
  }, [debouncedLike]);

  const handleSave = useCallback((id: string) => {
    debouncedSave(id);
    toast.success('Artículo guardado', {
      duration: 1000,
      position: 'bottom-right'
    });
  }, [debouncedSave]);

  const handleShare = useCallback(async (article: any) => {
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
        toast.success('Enlace copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
      toast.error(t('errors.sharingArticle'));
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Feed actualizado');
    } catch (error) {
      toast.error(t('errors.updating'));
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    setLimit(prev => prev + 20);
  }, []);

  if (isLoading && articles.length === 0) {
    return <InitialLoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        message={t('errors.loadingFeed')}
        onRetry={handleRefresh}
      />
    );
  }

  if (articles.length === 0) {
    return (
      <EmptyState
        title="No hay artículos disponibles"
        description="Vuelve más tarde para ver nuevas noticias"
        icon={<TrendingUp className="w-16 h-16 text-gray-400" />}
      />
    );
  }

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {isRefreshing && <RefreshingState />}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
              Tu Feed Personalizado
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-300">
              {articles.length} artículos disponibles
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Refresh Button */}
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 group disabled:opacity-50"
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Actualizar feed"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Articles Grid with Staggered Animation */}
      <Suspense fallback={<FeedLoadingSkeleton />}>
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {articles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              index={index}
              onView={() => handleView(article.id)}
            />
          ))}
        </motion.div>
      </Suspense>

      {/* Load More */}
      <AnimatePresence>
        {hasMore && (
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.button 
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <LoadingMoreState />
              ) : (
                <>
                  <span>Cargar más artículos</span>
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(FeedList);