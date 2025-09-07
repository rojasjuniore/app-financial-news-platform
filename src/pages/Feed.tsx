import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TwitterFeedListV2 from '../components/Feed/TwitterFeedListV2';
import { useProfile } from '../hooks/useProfile';
import { Loader } from 'lucide-react';

const Feed: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoading, isNewUser } = useProfile();

  useEffect(() => {
    // Redirigir a onboarding si es usuario nuevo
    if (!isLoading && isNewUser) {
      navigate('/onboarding');
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <TwitterFeedListV2 />
      </div>
    </div>
  );
};

export default Feed;