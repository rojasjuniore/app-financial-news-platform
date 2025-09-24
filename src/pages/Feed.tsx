import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TwitterStyleFeed from '../components/Feed/TwitterStyleFeed';
import { useProfile } from '../hooks/useProfile';
import { Loader } from 'lucide-react';

const Feed: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoading, isNewUser } = useProfile();

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
    <div className="min-h-screen">
      {/* Twitter/X Style Infinite Scroll Feed */}
      <TwitterStyleFeed />
    </div>
  );
};

export default Feed;