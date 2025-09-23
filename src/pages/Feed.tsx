import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SimpleFeed from '../components/Feed/SimpleFeed';
import OptimizedFeed from '../components/Feed/OptimizedFeed';
import EnhancedOptimizedFeed from '../components/Feed/EnhancedOptimizedFeed';
import { useProfile } from '../hooks/useProfile';
import { Loader, Zap, Layout, Sparkles } from 'lucide-react';

const Feed: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoading, isNewUser } = useProfile();
  const [feedMode, setFeedMode] = useState<'enhanced' | 'optimized' | 'simple'>('enhanced'); // Default to enhanced

  useEffect(() => {
    // Check if user has configured interests
    const userHasInterests = localStorage.getItem('userHasInterests') === 'true';
    const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';

    // Only redirect to onboarding if:
    // 1. User is truly new (no interests configured)
    // 2. Haven't marked as having interests
    // 3. Not coming from onboarding completion
    if (!isLoading && isNewUser && !userHasInterests && !onboardingCompleted) {
      console.log('Redirecting to onboarding - User has no interests');
      navigate('/onboarding');
    }

    // Clear the temporary onboarding flag after checking
    if (onboardingCompleted) {
      localStorage.removeItem('onboardingCompleted');
    }
  }, [isLoading, isNewUser, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <Loader className="animate-spin w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{t('feed.loadingArticles')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Toggle Switch */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setFeedMode('simple')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              feedMode === 'simple'
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Layout className="w-4 h-4" />
            Simple
          </button>
          <button
            onClick={() => setFeedMode('optimized')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              feedMode === 'optimized'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Zap className="w-4 h-4" />
            Optimized
          </button>
          <button
            onClick={() => setFeedMode('enhanced')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              feedMode === 'enhanced'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Premium FinBERT
          </button>
        </div>
      </div>

      {/* Render Selected Feed */}
      {feedMode === 'enhanced' && <EnhancedOptimizedFeed />}
      {feedMode === 'optimized' && <OptimizedFeed />}
      {feedMode === 'simple' && <SimpleFeed />}
    </div>
  );
};

export default Feed;