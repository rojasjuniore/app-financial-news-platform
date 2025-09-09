import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  TrendingUp,
  Database,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  Calendar,
  BarChart3,
  Hash,
  Layers
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: string;
  summary?: {
    articlesAdded: number;
    duplicatesFiltered: number;
    failedSaves: number;
    totalProcessed: number;
    successRate: string;
    duplicateRate: string;
    providers?: Record<string, number>;
    marketTypes?: {
      stocks: number;
      crypto: number;
    };
    executionTime: number;
  };
}

interface CronStats {
  totalExecutions: number;
  totalArticlesAdded: number;
  totalDuplicatesFiltered: number;
  avgExecutionTime: number;
  avgSuccessRate: number;
  providerBreakdown: Record<string, number>;
}

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cronStats, setCronStats] = useState<CronStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread' | 'cron'>('all');
  const [timeRange, setTimeRange] = useState(7); // days
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchCronStats();
  }, [filter, timeRange]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 50 };
      
      if (filter === 'unread') {
        params.unread = true;
      } else if (filter === 'cron') {
        params.type = 'cron_execution';
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications`, { params });
      
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(t('notifications.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCronStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications/cron-executions`, {
        params: { days: timeRange }
      });
      
      if (response.data.success) {
        setCronStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching cron stats:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/notifications/${notificationId}/mark-read`);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      toast.success(t('notifications.markedAsRead'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error(t('notifications.errorMarkingRead'));
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/notifications/mark-all-read`);
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      toast.success(t('notifications.allMarkedAsRead'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(t('notifications.errorMarkingRead'));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    await fetchCronStats();
    setIsRefreshing(false);
    toast.success(t('notifications.refreshed'));
  };

  const toggleExpanded = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('notifications.justNow');
    if (minutes < 60) return t('notifications.minutesAgo', { count: minutes });
    if (hours < 24) return t('notifications.hoursAgo', { count: hours });
    return t('notifications.daysAgo', { count: days });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'cron_execution':
        return <Database className="w-5 h-5" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('notifications.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t('notifications.subtitle')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  {t('notifications.markAllRead')}
                </button>
              )}
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {cronStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('notifications.last7Days')}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cronStats.totalExecutions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('notifications.totalExecutions')}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('notifications.newArticles')}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cronStats.totalArticlesAdded.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('notifications.articlesAdded')}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('notifications.filtered')}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cronStats.totalDuplicatesFiltered.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('notifications.duplicatesFiltered')}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('notifications.avgSuccess')}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cronStats.avgSuccessRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('notifications.successRate')}
                </div>
              </motion.div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t('notifications.filterAll')}
              </button>
              
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-2 ${
                  filter === 'unread' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t('notifications.filterUnread')}
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setFilter('cron')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === 'cron' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t('notifications.filterCron')}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
              >
                <option value={1}>{t('notifications.last24Hours')}</option>
                <option value={7}>{t('notifications.last7Days')}</option>
                <option value={30}>{t('notifications.last30Days')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{t('notifications.loading')}</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center"
            >
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('notifications.noNotifications')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('notifications.noNotificationsDesc')}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden ${
                    !notification.read ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'cron_execution' 
                            ? 'bg-blue-100 dark:bg-blue-900/30' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {notification.title}
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </h3>
                          
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            
                            {notification.priority && (
                              <span className={`text-sm font-medium ${getPriorityColor(notification.priority)}`}>
                                {notification.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={t('notifications.markAsRead')}
                          >
                            <Check className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => toggleExpanded(notification.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {expandedNotifications.has(notification.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Summary Stats for Cron Executions */}
                    {notification.type === 'cron_execution' && notification.summary && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                          <div className="text-sm text-green-600 dark:text-green-400">
                            {t('notifications.articlesAdded')}
                          </div>
                          <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                            {notification.summary.articlesAdded}
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            {t('notifications.duplicates')}
                          </div>
                          <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                            {notification.summary.duplicatesFiltered}
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                          <div className="text-sm text-purple-600 dark:text-purple-400">
                            {t('notifications.successRate')}
                          </div>
                          <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                            {notification.summary.successRate}%
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                          <div className="text-sm text-orange-600 dark:text-orange-400">
                            {t('notifications.executionTime')}
                          </div>
                          <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                            {(notification.summary.executionTime / 1000).toFixed(1)}s
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedNotifications.has(notification.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                        >
                          <div className="prose dark:prose-invert max-w-none">
                            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                              {notification.message}
                            </pre>
                          </div>

                          {/* Provider Breakdown for Cron */}
                          {notification.summary?.providers && (
                            <div className="mt-4">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                {t('notifications.providerBreakdown')}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(notification.summary.providers).map(([provider, count]) => (
                                  <div
                                    key={provider}
                                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                                  >
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {provider}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {count}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Provider Stats */}
        {cronStats && cronStats.providerBreakdown && Object.keys(cronStats.providerBreakdown).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {t('notifications.providerStats')}
            </h3>
            
            <div className="space-y-3">
              {Object.entries(cronStats.providerBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([provider, count]) => {
                  // Calculate percentage based on total fetched articles from all providers
                  const totalFetched = Object.values(cronStats.providerBreakdown).reduce((sum, val) => sum + val, 0);
                  const percentage = totalFetched > 0 ? (count / totalFetched) * 100 : 0;
                  return (
                    <div key={provider} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {provider}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {count.toLocaleString()} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Notifications;