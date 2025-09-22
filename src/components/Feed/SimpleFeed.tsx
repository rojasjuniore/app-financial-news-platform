import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Star,
  Globe,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Activity,
  Clock,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NewsListItem from './NewsListItem';
import { feedService } from '../../services/news/feedService';
import { Article } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

type FeedMode = 'trending' | 'my-interests' | 'all';
type SortBy = 'time' | 'importance' | 'quality';


const SimpleFeed: React.FC = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<FeedMode>('trending');
  const [sortBy, setSortBy] = useState<SortBy>('time');
  const [page, setPage] = useState(0);
  const [allArticles, setAllArticles] = useState<Article[]>([]);

  // Fetch feed data
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['simple-feed', mode, sortBy, page, user?.uid],
    queryFn: async () => {
      console.log('🔄 SimpleFeed: Fetching data with params:', {
        mode,
        sortBy,
        limit: 20,
        offset: page * 20,
        userId: user?.uid
      });
      const response = await feedService.getSimpleFeed({
        mode,
        sortBy,
        limit: 20,
        offset: page * 20,
        userId: user?.uid
      });
      console.log('📦 SimpleFeed: Response received:', {
        articlesCount: response?.articles?.length || 0,
        total: response?.total || 0,
        hasMore: response?.hasMore || false
      });
      return response;
    },
    refetchInterval: mode === 'trending' ? 60000 : 300000, // Trending updates more frequently
    staleTime: 30000
  });

  // Update articles when data changes
  useEffect(() => {
    if (data?.articles) {
      if (page === 0) {
        setAllArticles(data.articles);
      } else {
        setAllArticles(prev => [...prev, ...data.articles]);
      }
    }
  }, [data, page]);

  // Reset page when mode or sort changes
  useEffect(() => {
    setPage(0);
    setAllArticles([]);
  }, [mode, sortBy]);

  const handleRefresh = useCallback(() => {
    setPage(0);
    setAllArticles([]);
    refetch();
    toast.success('Feed actualizado');
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (data?.hasMore && !isFetching) {
      setPage(prev => prev + 1);
    }
  }, [data?.hasMore, isFetching]);

  // Get mode info
  const getModeInfo = () => {
    switch (mode) {
      case 'trending':
        return {
          icon: TrendingUp,
          title: 'Trending',
          description: 'Los 20 artículos más recientes e importantes',
          color: 'text-red-500'
        };
      case 'my-interests':
        return {
          icon: Star,
          title: 'Mis Intereses',
          description: 'Los 20 artículos más recientes de tus intereses',
          color: 'text-yellow-500'
        };
      case 'all':
        return {
          icon: Globe,
          title: 'Todos',
          description: 'Los 20 artículos más recientes de todas las fuentes',
          color: 'text-blue-500'
        };
    }
  };

  const modeInfo = getModeInfo();
  const Icon = modeInfo.icon;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
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
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
          <button
            onClick={() => setMode('trending')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              mode === 'trending'
                ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Trending
          </button>
          <button
            onClick={() => setMode('my-interests')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              mode === 'my-interests'
                ? 'bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            Mis Intereses
          </button>
          <button
            onClick={() => setMode('all')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              mode === 'all'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Todos
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Ordenar por:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="time">📅 Más Recientes (últimos 20)</option>
              <option value="importance">⚡ Importancia</option>
              <option value="quality">⭐ Calidad</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Stats */}
          {data && (
            <div className="ml-auto flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                <span>{data.total} artículos</span>
              </div>
              {mode === 'my-interests' && data.metadata?.userInterests && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>
                    {(data.metadata.userInterests.tickers?.length || 0) +
                     (data.metadata.userInterests.sectors?.length || 0) +
                     (data.metadata.userInterests.keywords?.length || 0)} intereses
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Activity className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando noticias...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
              Error cargando noticias
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              {(error as Error).message}
            </p>
          </div>
        </div>
      )}

      {/* Empty State - My Interests */}
      {!isLoading && mode === 'my-interests' && allArticles.length === 0 && !error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-8 text-center">
          <Star className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            No hay artículos para tus intereses
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            Configura tus tickers, sectores y keywords en Preferencias para ver contenido personalizado
          </p>
          <button
            onClick={() => window.location.href = '/preferences'}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Ir a Preferencias
          </button>
        </div>
      )}

      {/* Empty State - General */}
      {!isLoading && mode !== 'my-interests' && allArticles.length === 0 && !error && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-8 text-center">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay artículos disponibles
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Intenta actualizar o cambiar el modo de visualización
          </p>
        </div>
      )}

      {/* News List */}
      {!isLoading && allArticles.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {allArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <NewsListItem
                  article={article}
                  showImportanceBar={sortBy === 'importance'}
                />
              </motion.div>
            ))}
          </div>

          {/* Load More Button */}
          {data?.hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={isFetching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2 mx-auto"
              >
                {isFetching ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Cargar Más Artículos'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SimpleFeed;