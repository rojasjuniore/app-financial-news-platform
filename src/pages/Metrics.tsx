import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Activity,
  Brain,
  MessageSquare,
  Newspaper,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  Cpu,
  Zap,
  Globe,
  Bot
} from 'lucide-react';

// Types
interface UsageMetrics {
  llmUsage: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    byModel: {
      [modelName: string]: {
        requests: number;
        inputTokens: number;
        outputTokens: number;
        cost: number;
      };
    };
    byDate: Array<{
      date: string;
      requests: number;
      tokens: number;
      cost: number;
    }>;
  };
  newsMetrics: {
    articlesRead: number;
    analysisGenerated: number;
    feedInteractions: number;
    searchQueries: number;
  };
  newsApiUsage: {
    totalRequests: number;
    totalArticlesRetrieved: number;
    totalCost: number;
    byProvider: {
      [providerName: string]: {
        requests: number;
        articlesRetrieved: number;
        cost: number;
        lastUsed: string;
      };
    };
  };
  userActivity: {
    chatMessages: number;
    sessionDuration: number;
    lastActivity: string;
    favoriteModels: string[];
  };
}

interface UserMetrics extends UsageMetrics {
  userId: string;
  userName: string;
  joinDate: string;
}

const Metrics: React.FC = () => {
  const { t } = useTranslation();
  
  // Helper function to safely convert to number and format
  const safeToFixed = (value: string | number, decimals: number = 4): string => {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? '0.0000' : num.toFixed(decimals);
    }
    return typeof value === 'number' ? value.toFixed(decimals) : '0.0000';
  };
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'personal' | 'global'>('personal');
  const [selectedDateRange, setSelectedDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedModel, setSelectedModel] = useState<string>('all');

  // Fetch metrics from API
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [personalRes, globalRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/dashboard/metrics/personal?range=${selectedDateRange}&model=${selectedModel}`),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/dashboard/metrics/global?range=${selectedDateRange}&model=${selectedModel}`)
      ]);

      if (personalRes.ok) {
        const personalData = await personalRes.json();
        setMetrics(personalData);
      }

      if (globalRes.ok) {
        const globalData = await globalRes.json();
        setUserMetrics(globalData.users || []);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Set default empty data
      setMetrics({
        llmUsage: {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          byModel: {},
          byDate: []
        },
        newsMetrics: {
          articlesRead: 0,
          analysisGenerated: 0,
          feedInteractions: 0,
          searchQueries: 0
        },
        newsApiUsage: {
          totalRequests: 0,
          totalArticlesRetrieved: 0,
          totalCost: 0,
          byProvider: {}
        },
        userActivity: {
          chatMessages: 0,
          sessionDuration: 0,
          lastActivity: new Date().toISOString(),
          favoriteModels: []
        }
      });
      setUserMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedDateRange, selectedModel]);

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('common.locale') === 'es-ES' ? 'Cargando métricas...' : 'Loading metrics...'}
          </p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Calculate totals for display
  const totalCostUSD = typeof metrics.llmUsage.totalCost === 'string' 
    ? parseFloat(metrics.llmUsage.totalCost) 
    : metrics.llmUsage.totalCost;
  const avgCostPerRequest = metrics.llmUsage.totalRequests > 0 
    ? totalCostUSD / metrics.llmUsage.totalRequests 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl text-white">
                  <BarChart3 className="w-6 h-6" />
                </div>
                {t('common.locale') === 'es-ES' ? 'Métricas de Uso' : 'Usage Metrics'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('common.locale') === 'es-ES' ? 'Control de servicios y tokens' : 'Service and token control'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('personal')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'personal'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('common.locale') === 'es-ES' ? 'Personal' : 'Personal'}
                </button>
                <button
                  onClick={() => setViewMode('global')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'global'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('common.locale') === 'es-ES' ? 'Global' : 'Global'}
                </button>
              </div>

              {/* Date Range Selector */}
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                <option value="7d">{t('common.locale') === 'es-ES' ? 'Última semana' : 'Last 7 days'}</option>
                <option value="30d">{t('common.locale') === 'es-ES' ? 'Último mes' : 'Last 30 days'}</option>
                <option value="90d">{t('common.locale') === 'es-ES' ? 'Últimos 3 meses' : 'Last 90 days'}</option>
                <option value="1y">{t('common.locale') === 'es-ES' ? 'Último año' : 'Last year'}</option>
              </select>

              <button
                onClick={fetchMetrics}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium border border-gray-200 dark:border-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                {t('common.locale') === 'es-ES' ? 'Actualizar' : 'Refresh'}
              </button>
            </div>
          </div>
        </motion.div>

        {viewMode === 'personal' ? (
          <>
            {/* Personal Overview Stats */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {[
                {
                  title: t('common.locale') === 'es-ES' ? 'Requests LLM' : 'LLM Requests',
                  value: metrics.llmUsage.totalRequests.toLocaleString(),
                  change: metrics.llmUsage.byDate.length > 1 ? '+12%' : 'N/A',
                  icon: Brain,
                  color: 'purple',
                  trend: 'up'
                },
                {
                  title: t('common.locale') === 'es-ES' ? 'Tokens Gastados' : 'Tokens Used',
                  value: metrics.llmUsage.totalTokens.toLocaleString(),
                  change: `$${safeToFixed(totalCostUSD)}`,
                  icon: Zap,
                  color: 'orange',
                  trend: 'up'
                },
                {
                  title: t('common.locale') === 'es-ES' ? 'Mensajes de Chat' : 'Chat Messages',
                  value: metrics.userActivity.chatMessages.toLocaleString(),
                  change: metrics.userActivity.favoriteModels.length > 0 ? `${metrics.userActivity.favoriteModels.length} modelos` : 'Sin uso',
                  icon: MessageSquare,
                  color: 'blue',
                  trend: 'up'
                },
                {
                  title: t('common.locale') === 'es-ES' ? 'APIs de Noticias' : 'News APIs',
                  value: metrics.newsApiUsage?.totalRequests?.toLocaleString() || '0',
                  change: `${metrics.newsApiUsage?.totalArticlesRetrieved?.toLocaleString() || '0'} artículos`,
                  icon: Globe,
                  color: 'green',
                  trend: 'up'
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                      stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* LLM Usage by Model */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  {t('common.locale') === 'es-ES' ? 'Uso por Modelo LLM' : 'Usage by LLM Model'}
                </h3>
                
                {Object.keys(metrics.llmUsage.byModel).length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' ? 'Sin uso de modelos LLM registrado' : 'No LLM model usage recorded'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(metrics.llmUsage.byModel).map(([modelName, modelStats]) => (
                      <div key={modelName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{modelName}</h4>
                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            ${safeToFixed(modelStats.cost)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              {t('common.locale') === 'es-ES' ? 'Requests' : 'Requests'}
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {modelStats.requests.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              {t('common.locale') === 'es-ES' ? 'Tokens entrada' : 'Input tokens'}
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {modelStats.inputTokens.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              {t('common.locale') === 'es-ES' ? 'Tokens salida' : 'Output tokens'}
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {modelStats.outputTokens.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* News APIs Usage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  {t('common.locale') === 'es-ES' ? 'Uso de APIs de Noticias' : 'News APIs Usage'}
                </h3>
                
                {!metrics.newsApiUsage || Object.keys(metrics.newsApiUsage.byProvider).length === 0 ? (
                  <div className="text-center py-8">
                    <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' ? 'Sin uso de APIs de noticias registrado' : 'No news API usage recorded'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* News API Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                        <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('common.locale') === 'es-ES' ? 'Total Requests' : 'Total Requests'}
                        </h4>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {metrics.newsApiUsage.totalRequests.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                        <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('common.locale') === 'es-ES' ? 'Artículos Obtenidos' : 'Articles Retrieved'}
                        </h4>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {metrics.newsApiUsage.totalArticlesRetrieved.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                        <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('common.locale') === 'es-ES' ? 'Costo Total' : 'Total Cost'}
                        </h4>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          ${safeToFixed(metrics.newsApiUsage.totalCost)}
                        </p>
                      </div>
                    </div>

                    {/* By Provider */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {t('common.locale') === 'es-ES' ? 'Por Proveedor:' : 'By Provider:'}
                      </h4>
                      {Object.entries(metrics.newsApiUsage.byProvider).map(([providerName, providerStats]) => (
                        <div key={providerName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                              {providerName === 'alphaVantage' ? 'Alpha Vantage' : 
                               providerName === 'cryptoCompare' ? 'CryptoCompare' : 
                               providerName}
                            </h4>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                ${safeToFixed(providerStats.cost)} {providerStats.cost === 0 && '(Free)'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(providerStats.lastUsed).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">
                                {t('common.locale') === 'es-ES' ? 'Requests' : 'Requests'}
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {providerStats.requests.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">
                                {t('common.locale') === 'es-ES' ? 'Artículos' : 'Articles'}
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {providerStats.articlesRetrieved.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Activity Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* News Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-green-600" />
                  {t('common.locale') === 'es-ES' ? 'Actividad de Noticias' : 'News Activity'}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' ? 'Artículos leídos' : 'Articles read'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {metrics.newsMetrics.articlesRead}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' ? 'Análisis generados' : 'Analysis generated'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {metrics.newsMetrics.analysisGenerated}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' ? 'Interacciones feed' : 'Feed interactions'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {metrics.newsMetrics.feedInteractions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' ? 'Búsquedas' : 'Searches'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {metrics.newsMetrics.searchQueries}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  {t('common.locale') === 'es-ES' ? 'Análisis de Costos' : 'Cost Analysis'}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' ? 'Costo total' : 'Total cost'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white text-lg">
                      ${safeToFixed(totalCostUSD)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' ? 'Costo por request' : 'Cost per request'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${safeToFixed(avgCostPerRequest, 6)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' ? 'Tokens por $1' : 'Tokens per $1'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {totalCostUSD > 0 ? Math.round(metrics.llmUsage.totalTokens / totalCostUSD).toLocaleString() : '0'}
                    </span>
                  </div>
                  
                  {metrics.userActivity.favoriteModels.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {t('common.locale') === 'es-ES' ? 'Modelos favoritos:' : 'Favorite models:'}
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {metrics.userActivity.favoriteModels.map((model) => (
                          <span key={model} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          /* Global Admin View */
          <>
            {/* Global System Overview */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {[
                {
                  title: t('common.locale') === 'es-ES' ? 'Total Usuarios' : 'Total Users',
                  value: userMetrics.length.toLocaleString(),
                  change: t('common.locale') === 'es-ES' ? 'Activos' : 'Active',
                  icon: Users,
                  color: 'blue',
                  trend: 'up'
                },
                {
                  title: t('common.locale') === 'es-ES' ? 'LLM Total' : 'Total LLM',
                  value: userMetrics.reduce((sum, u) => sum + u.llmUsage.totalRequests, 0).toLocaleString(),
                  change: `$${safeToFixed(userMetrics.reduce((sum, u) => sum + (typeof u.llmUsage.totalCost === 'number' ? u.llmUsage.totalCost : parseFloat(u.llmUsage.totalCost || '0')), 0))}`,
                  icon: Brain,
                  color: 'purple',
                  trend: 'up'
                },
                {
                  title: t('common.locale') === 'es-ES' ? 'News APIs' : 'News APIs',
                  value: userMetrics.reduce((sum, u) => sum + (u.newsApiUsage?.totalRequests || 0), 0).toLocaleString(),
                  change: `${userMetrics.reduce((sum, u) => sum + (u.newsApiUsage?.totalArticlesRetrieved || 0), 0).toLocaleString()} articles`,
                  icon: Globe,
                  color: 'green',
                  trend: 'up'
                },
                {
                  title: t('common.locale') === 'es-ES' ? 'Costo Total' : 'Total Cost',
                  value: `$${safeToFixed(
                    userMetrics.reduce((sum, u) => sum + (typeof u.llmUsage.totalCost === 'number' ? u.llmUsage.totalCost : parseFloat(u.llmUsage.totalCost || '0')), 0) +
                    userMetrics.reduce((sum, u) => sum + (u.newsApiUsage?.totalCost || 0), 0)
                  )}`,
                  change: t('common.locale') === 'es-ES' ? 'Todos los servicios' : 'All services',
                  icon: DollarSign,
                  color: 'orange',
                  trend: 'up'
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* System-wide LLM Usage by Model */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  {t('common.locale') === 'es-ES' ? 'Uso Global por Modelo LLM' : 'Global Usage by LLM Model'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['openai', 'claude', 'gemini', 'grok'].map((modelName) => {
                    const modelData = userMetrics.reduce((acc, user) => {
                      const model = user.llmUsage.byModel?.[modelName];
                      if (model) {
                        acc.requests += model.requests || 0;
                        acc.inputTokens += model.inputTokens || 0;
                        acc.outputTokens += model.outputTokens || 0;
                        acc.cost += typeof model.cost === 'number' ? model.cost : parseFloat(model.cost || '0');
                      }
                      return acc;
                    }, { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 });

                    return (
                      <div key={modelName} className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{modelName}</h4>
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            ${safeToFixed(modelData.cost)}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Requests:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{modelData.requests.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{(modelData.inputTokens + modelData.outputTokens).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Global News API Usage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  {t('common.locale') === 'es-ES' ? 'Uso Global de APIs de Noticias' : 'Global News APIs Usage'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['newsapi', 'alphaVantage', 'cryptoCompare'].map((providerName) => {
                    const providerData = userMetrics.reduce((acc, user) => {
                      const provider = user.newsApiUsage?.byProvider?.[providerName];
                      if (provider) {
                        acc.requests += provider.requests || 0;
                        acc.articles += provider.articlesRetrieved || 0;
                        acc.cost += typeof provider.cost === 'number' ? provider.cost : parseFloat(provider.cost || '0');
                      }
                      return acc;
                    }, { requests: 0, articles: 0, cost: 0 });

                    return (
                      <div key={providerName} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white capitalize mb-3">
                          {providerName === 'newsapi' ? 'NewsAPI' : 
                           providerName === 'alphaVantage' ? 'Alpha Vantage' : 
                           'CryptoCompare'}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Requests:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{providerData.requests.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Articles:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{providerData.articles.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              ${safeToFixed(providerData.cost)} {providerData.cost === 0 && '(Free)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* User Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {t('common.locale') === 'es-ES' ? 'Detalle de Usuarios' : 'User Details'}
              </h3>
              
              {userMetrics.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('common.locale') === 'es-ES' ? 'Sin datos de usuarios disponibles' : 'No user data available'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                          {t('common.locale') === 'es-ES' ? 'Usuario' : 'User'}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                          {t('common.locale') === 'es-ES' ? 'LLM Requests' : 'LLM Requests'}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                          {t('common.locale') === 'es-ES' ? 'Tokens' : 'Tokens'}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                          {t('common.locale') === 'es-ES' ? 'Costo LLM' : 'LLM Cost'}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                          {t('common.locale') === 'es-ES' ? 'News API' : 'News API'}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                          {t('common.locale') === 'es-ES' ? 'Costo Total' : 'Total Cost'}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                          {t('common.locale') === 'es-ES' ? 'Última Actividad' : 'Last Activity'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {userMetrics.map((user) => {
                        const llmCost = typeof user.llmUsage.totalCost === 'number' ? user.llmUsage.totalCost : parseFloat(user.llmUsage.totalCost || '0');
                        const newsCost = user.newsApiUsage?.totalCost || 0;
                        const totalUserCost = llmCost + newsCost;
                        
                        return (
                          <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{user.userName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {user.userId.substring(0, 8)}...
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {user.llmUsage.totalRequests.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {user.llmUsage.totalTokens.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              ${safeToFixed(llmCost)}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {(user.newsApiUsage?.totalRequests || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                              ${safeToFixed(totalUserCost)}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                              {user.userActivity?.lastActivity ? new Date(user.userActivity.lastActivity).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Metrics;