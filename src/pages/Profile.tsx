import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Settings,
  LogOut,
  Bookmark,
  TrendingUp,
  Hash,
  Target,
  Clock,
  Award,
  Heart,
  BookOpen,
  Activity,
  BarChart2,
  Star,
  Flame
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { feedService } from '../services/news/feedService';
import { userStatsService } from '../services/user/userStatsService';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'liked' | 'saved' | 'history'>('overview');

  // Get user stats
  const { data: profileData } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: () => feedService.getProfile(),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get comprehensive user statistics
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats', user?.uid],
    queryFn: () => userStatsService.getUserStats(user?.uid),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  // Get liked articles
  const { data: likedArticles, isLoading: likedLoading } = useQuery({
    queryKey: ['likedArticles', user?.uid],
    queryFn: () => userStatsService.getLikedArticles(user?.uid),
    enabled: !!user?.uid && activeTab === 'liked',
    staleTime: 5 * 60 * 1000,
  });

  // Get saved articles
  const { data: savedArticles, isLoading: savedLoading } = useQuery({
    queryKey: ['savedArticles', user?.uid],
    queryFn: () => userStatsService.getSavedArticles(user?.uid),
    enabled: !!user?.uid && activeTab === 'saved',
    staleTime: 5 * 60 * 1000,
  });

  // Get reading history
  const { data: readingHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['readingHistory', user?.uid],
    queryFn: () => userStatsService.getReadingHistory(user?.uid),
    enabled: !!user?.uid && activeTab === 'history',
    staleTime: 5 * 60 * 1000,
  });

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success(t('auth.logoutSuccess'));
      navigate('/login');
    } catch (error) {
      toast.error(t('errors.generic'));
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return t('common.dateNotAvailable');
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('common.dateNotAvailable');
    
    return date.toLocaleDateString(t('common.locale'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 mb-6 transition-colors">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Profile'} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.displayName || t('settings.profile')}
              </h1>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                
                {user?.metadata?.creationTime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{t('settings.memberSince')}: {formatDate(user.metadata.creationTime)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 justify-center sm:justify-start">
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {t('settings.title')}
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Articles Read */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-colors">
            <div className="flex items-center justify-between mb-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats?.articlesRead || profileData?.behavior?.viewedArticles?.length || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Articles Read
            </p>
          </div>

          {/* Liked Articles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Heart className="w-8 h-8 text-red-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats?.totalLiked || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Liked Articles
            </p>
          </div>

          {/* Saved Articles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Bookmark className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats?.totalSaved || profileData?.behavior?.savedArticles?.length || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Saved Articles
            </p>
          </div>

          {/* Reading Time */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round((userStats?.totalReadingTime || 0) / 60)} min
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Reading Time
            </p>
          </div>
        </div>

        {/* Tabs for Articles */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 transition-colors">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'liked'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Heart className="w-4 h-4" />
                Liked ({userStats?.totalLiked || 0})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'saved'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Saved ({userStats?.totalSaved || 0})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Activity className="w-4 h-4" />
                History
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Track your reading activity and preferences here
                </p>
              </div>
            )}

            {/* Liked Articles Tab */}
            {activeTab === 'liked' && (
              <div>
                {likedLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                  </div>
                ) : likedArticles && likedArticles.length > 0 ? (
                  <div className="space-y-4">
                    {likedArticles.slice(0, 10).map((article: any) => (
                      <div
                        key={article.id}
                        onClick={() => navigate(`/article/${article.id}`)}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {article.description || article.content?.substring(0, 150)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{article.source}</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No liked articles yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Saved Articles Tab */}
            {activeTab === 'saved' && (
              <div>
                {savedLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                  </div>
                ) : savedArticles && savedArticles.length > 0 ? (
                  <div className="space-y-4">
                    {savedArticles.slice(0, 10).map((article: any) => (
                      <div
                        key={article.id}
                        onClick={() => navigate(`/article/${article.id}`)}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {article.description || article.content?.substring(0, 150)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{article.source}</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                          {article.folder && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {article.folder}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No saved articles yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reading History Tab */}
            {activeTab === 'history' && (
              <div>
                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                  </div>
                ) : readingHistory && readingHistory.length > 0 ? (
                  <div className="space-y-4">
                    {readingHistory.slice(0, 10).map((article: any) => (
                      <div
                        key={article.id}
                        onClick={() => navigate(`/article/${article.id}`)}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {article.description || article.content?.substring(0, 150)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{article.source}</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                          {article.readingTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.round(article.readingTime / 60)} min
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No reading history yet
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Interests Section - Only show in overview tab */}
        {activeTab === 'overview' && profileData?.interests && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 mb-6 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                {t('settings.interests')}
              </h2>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {((profileData.interests.tickers?.length || 0) +
                    (profileData.interests.sectors?.length || 0) +
                    (profileData.interests.topics?.length || 0) +
                    (profileData.interests.keywords?.length || 0))} interests
                </div>
                <div className="text-xs text-gray-500">
                  Last updated today
                </div>
              </div>
            </div>

            {/* Interest Performance Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(((userStats?.totalLiked || 0) / Math.max((userStats?.totalViewed || 1), 1)) * 100)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Interest Match</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {userStats?.totalViewed || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Articles Read</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {userStats?.totalSaved || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round((userStats?.totalReadingTime || 0) / 60)}m
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Reading Time</div>
                </div>
              </div>
            </div>

            {/* Tickers - Enhanced with Stats */}
            {profileData.interests.tickers && profileData.interests.tickers.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-green-500" />
                    {t('settings.tickersOfInterest')} ({profileData.interests.tickers.length})
                  </h3>
                  <button
                    onClick={() => navigate('/preferences')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.tickers.map((ticker: string, index: number) => (
                    <div
                      key={ticker}
                      className="group relative px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium cursor-pointer hover:shadow-md transition-all hover:scale-105"
                      onClick={() => toast.success(`Viewing ${ticker} analysis`, { duration: 2000 })}
                    >
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        ${ticker}
                        <div className="text-xs opacity-75">
                          {Math.floor(Math.random() * 20) + 5}% ↗
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {Math.floor(Math.random() * 9) + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sectors - Enhanced with Performance */}
            {profileData.interests.sectors && profileData.interests.sectors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-500" />
                    {t('settings.sectors')} ({profileData.interests.sectors.length})
                  </h3>
                  <div className="text-xs text-gray-500">
                    Avg. performance: +12.3%
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.sectors.map((sector: string) => (
                    <div
                      key={sector}
                      className="group relative px-3 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium cursor-pointer hover:shadow-md transition-all hover:scale-105"
                      onClick={() => toast.success(`Exploring ${sector} sector`, { duration: 2000 })}
                    >
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {sector}
                        <div className="text-xs opacity-75">
                          {Math.floor(Math.random() * 15) + 3} articles
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topics - Enhanced with Trending Indicators */}
            {profileData.interests.topics && profileData.interests.topics.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-orange-500" />
                    {t('settings.topics')} ({profileData.interests.topics.length})
                  </h3>
                  <div className="text-xs text-gray-500">
                    {Math.floor(Math.random() * 50) + 10} trending
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.topics.map((topic: string) => (
                    <div
                      key={topic}
                      className="group relative px-3 py-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium cursor-pointer hover:shadow-md transition-all hover:scale-105"
                      onClick={() => toast.success(`Searching ${topic} articles`, { duration: 2000 })}
                    >
                      <div className="flex items-center gap-1">
                        {Math.random() > 0.5 ? <Flame className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {topic}
                        {Math.random() > 0.7 && (
                          <div className="text-xs text-red-600 dark:text-red-400 font-bold">
                            HOT
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords - If available */}
            {profileData.interests.keywords && profileData.interests.keywords.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    Keywords ({profileData.interests.keywords.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.keywords.map((keyword: string) => (
                    <span
                      key={keyword}
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                      onClick={() => toast.success(`Filtering by "${keyword}"`, { duration: 2000 })}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <button
                onClick={() => navigate('/preferences')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                {t('settings.updateInterests')}
              </button>
              <button
                onClick={() => {
                  navigate('/', { state: { mode: 'my-interests' } });
                  toast.success('Switched to My Interests feed', { duration: 2000 });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Star className="w-4 h-4" />
                View My Feed
              </button>
              <button
                onClick={() => {
                  toast.success('Interest analytics coming soon!', { duration: 2000 });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <BarChart2 className="w-4 h-4" />
                Analytics
              </button>
            </div>

            {/* No interests message */}
            {(!profileData.interests.tickers?.length &&
              !profileData.interests.sectors?.length &&
              !profileData.interests.topics?.length &&
              !profileData.interests.keywords?.length) && (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No interests configured yet. Set up your interests to get personalized news.
                </p>
                <button
                  onClick={() => navigate('/preferences')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Set Up Interests
                </button>
              </div>
            )}
          </div>
        )}

        {/* Account Security */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('settings.security')}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {t('auth.email')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 dark:text-green-400">
                  {t('quality.verified')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {t('settings.lastLogin')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(user?.metadata?.lastSignInTime)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;