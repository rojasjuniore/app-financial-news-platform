import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List, areEqual } from 'react-window';
import { useTranslation } from 'react-i18next';
import { useFeed } from '../../hooks/useFeed';
import { useVirtualScroll, useDebounce, usePerformance } from '../../hooks/usePerformance';
import ArticleCard from './ArticleCard';
import {
  FeedLoadingSkeleton,
  InitialLoadingState,
  LoadingMoreState,
  RefreshingState,
  ErrorState,
  EmptyState
} from '../Loading/LoadingStates';
import {
  Loader,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronDown,
  Settings,
  Grid,
  List as ListIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

// Memoized list item component for virtual scrolling
const VirtualizedArticleItem = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    articles: any[];
    onView: (id: string) => void;
    onLike: (id: string) => void;
    onSave: (id: string) => void;
    onShare: (article: any) => void;
  };
}>(({ index, style, data }) => {
  const { articles, onView, onLike, onSave, onShare } = data;
  const article = articles[index];

  if (!article) return null;

  return (
    <div style={style} className="px-3 py-2">
      <ArticleCard
        article={article}
        index={index}
        onView={() => onView(article.id)}
      />
    </div>
  );
}, areEqual);

VirtualizedArticleItem.displayName = 'VirtualizedArticleItem';

// Main virtualized feed component
const VirtualizedFeedList: React.FC = () => {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(50); // Increased for better virtualization
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { startTimer, endTimer, getMemoryUsage, metrics } = usePerformance();
  
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
  const debouncedTrackView = useDebounce(trackView, 300);
  const debouncedLike = useDebounce(likeArticle, 100);
  const debouncedSave = useDebounce(saveArticle, 100);

  // Memoized event handlers
  const handleView = useCallback((id: string) => {
    startTimer();
    debouncedTrackView(id);
    endTimer('interactionTime');
  }, [debouncedTrackView, startTimer, endTimer]);

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
          url: `${window.location.origin}/article/${article.id}`
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
    startTimer();
    try {
      await refetch();
      toast.success('Feed actualizado');
    } catch (error) {
      toast.error(t('errors.updating'));
    } finally {
      setIsRefreshing(false);
      endTimer('renderTime');
    }
  }, [refetch, startTimer, endTimer]);

  const handleLoadMore = useCallback(() => {
    setLimit(prev => prev + 20);
  }, []);

  // Memoized list data to prevent unnecessary re-renders
  const listData = useMemo(() => ({
    articles,
    onView: handleView,
    onLike: handleLike,
    onSave: handleSave,
    onShare: handleShare
  }), [articles, handleView, handleLike, handleSave, handleShare]);

  // Performance monitoring
  useEffect(() => {
    const memoryUsage = getMemoryUsage();
    if (memoryUsage && memoryUsage.used > 100) { // More than 100MB
      console.warn('High memory usage detected:', memoryUsage);
    }
  }, [articles.length, getMemoryUsage]);

  // Grid/List mode calculations
  const itemHeight = viewMode === 'grid' ? 400 : 200;
  const columnCount = viewMode === 'grid' ? 3 : 1;
  const containerHeight = 800;

  // Loading states
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
    <div className="space-y-6">
      <AnimatePresence>
        {isRefreshing && <RefreshingState />}
      </AnimatePresence>

      {/* Header with controls */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tu Feed Personalizado
          </h1>
          <p className="text-gray-600 mt-1">
            {articles.length} artículos • Memoria: {getMemoryUsage()?.used || 0}MB
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <motion.button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Grid className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListIcon className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Filter Button */}
          <motion.button 
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            <ChevronDown className="w-4 h-4" />
          </motion.button>

          {/* Refresh Button */}
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all group disabled:opacity-50"
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Actualizar feed"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Virtualized Articles */}
      <motion.div
        className="bg-white rounded-xl shadow-sm overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {viewMode === 'grid' ? (
          // Grid mode - use CSS Grid with intersection observer
          <div className="p-6">
            <motion.div 
              className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1"
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
          </div>
        ) : (
          // List mode - use react-window for virtualization
          <div className="h-[800px]">
            <List
              height={containerHeight}
              width="100%"
              itemCount={articles.length}
              itemSize={itemHeight}
              itemData={listData}
              overscanCount={5}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {VirtualizedArticleItem}
            </List>
          </div>
        )}
      </motion.div>

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
                <>
                  <Loader className="animate-spin w-5 h-5" />
                  <span>Cargando...</span>
                </>
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

      {/* Performance indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Render: {metrics.renderTime.toFixed(2)}ms |
          Memory: {getMemoryUsage()?.used || 0}MB |
          Articles: {articles.length}
        </motion.div>
      )}
    </div>
  );
};

export default React.memo(VirtualizedFeedList);