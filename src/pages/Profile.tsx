import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
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
  Award
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { feedService } from '../services/feedService';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get user stats
  const { data: profileData } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: () => feedService.getProfile(),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      <Navbar />
      
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
          {/* Articles Viewed */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-colors">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData?.behavior?.viewedArticles?.length || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dashboard.statistics.articlesRead')}
            </p>
          </div>

          {/* Saved Articles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Bookmark className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData?.behavior?.savedArticles?.length || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dashboard.statistics.savedArticles')}
            </p>
          </div>

          {/* Interests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData?.interests?.tickers?.length || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('settings.interests')}
            </p>
          </div>

          {/* Reading Time */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(profileData?.behavior?.avgReadTime || 0)} min
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dashboard.statistics.readingTime')}
            </p>
          </div>
        </div>

        {/* Interests Section */}
        {profileData?.interests && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 mb-6 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {t('settings.interests')}
            </h2>

            {/* Tickers */}
            {profileData.interests.tickers && profileData.interests.tickers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t('settings.tickersOfInterest')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.tickers.map((ticker: string) => (
                    <span
                      key={ticker}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                    >
                      ${ticker}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sectors */}
            {profileData.interests.sectors && profileData.interests.sectors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t('settings.sectors')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.sectors.map((sector: string) => (
                    <span
                      key={sector}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {profileData.interests.topics && profileData.interests.topics.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t('settings.topics')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.topics.map((topic: string) => (
                    <span
                      key={topic}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/settings')}
              className="mt-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
            >
              {t('settings.updateInterests')} →
            </button>
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