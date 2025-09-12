import React, { useState, useEffect } from 'react';
import { articlesService, feedService } from '../services/news';
import { useAuth } from '../contexts/AuthContext';
import { Loader, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const FeedDebug: React.FC = () => {
  const { user } = useAuth();
  const [latestArticles, setLatestArticles] = useState<any>(null);
  const [feedArticles, setFeedArticles] = useState<any>(null);
  const [savedArticles, setSavedArticles] = useState<any>(null);
  const [trending, setTrending] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testEndpoint = async (
    name: string, 
    testFunc: () => Promise<any>,
    setter: (data: any) => void
  ) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    try {
      console.log(`🔄 Testing ${name}...`);
      const result = await testFunc();
      console.log(`✅ ${name} result:`, result);
      setter(result);
    } catch (error: any) {
      console.error(`❌ ${name} error:`, error);
      setErrors(prev => ({ 
        ...prev, 
        [name]: error.response?.data?.message || error.message 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const runAllTests = async () => {
    // Test 1: Latest Articles (no auth required)
    await testEndpoint(
      'Latest Articles',
      () => articlesService.getLatestArticles({ limit: 5 }),
      setLatestArticles
    );

    // Test 2: Feed (requires auth)
    if (user) {
      await testEndpoint(
        'Personalized Feed',
        () => feedService.getFeed({ limit: 5 }),
        setFeedArticles
      );

      // Test 3: Saved Articles
      await testEndpoint(
        'Saved Articles',
        () => feedService.getSavedArticles(),
        setSavedArticles
      );
    }

    // Test 4: Trending (no auth required)
    await testEndpoint(
      'Trending',
      () => feedService.getTrending({ limit: 5 }),
      setTrending
    );
  };

  useEffect(() => {
    runAllTests();
  }, [user]);

  const EndpointCard = ({ 
    title, 
    endpoint, 
    data, 
    error, 
    isLoading 
  }: { 
    title: string;
    endpoint: string;
    data: any;
    error?: string;
    isLoading?: boolean;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        {isLoading && <Loader className="w-4 h-4 animate-spin" />}
        {!isLoading && !error && <CheckCircle className="w-4 h-4 text-green-500" />}
        {!isLoading && error && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
      
      <code className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
        {endpoint}
      </code>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded text-sm mb-2">
          Error: {error}
        </div>
      )}
      
      {data && (
        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Feed Services Debug
          </h1>
          <button
            onClick={runAllTests}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Retest All
          </button>
        </div>

        {/* User Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold mb-2">Authentication Status</h2>
          {user ? (
            <div className="text-green-600 dark:text-green-400">
              ✅ Authenticated as: {user.email}
            </div>
          ) : (
            <div className="text-yellow-600 dark:text-yellow-400">
              ⚠️ Not authenticated (some endpoints won't work)
            </div>
          )}
        </div>

        {/* API Base URL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold mb-2">API Configuration</h2>
          <div className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Base URL: </span>
            <code className="text-blue-600 dark:text-blue-400">
              {process.env.REACT_APP_API_URL || 'http://localhost:3000'}
            </code>
          </div>
        </div>

        {/* Endpoints Test Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EndpointCard
            title="Latest Articles"
            endpoint="GET /api/articles/latest"
            data={latestArticles}
            error={errors['Latest Articles']}
            isLoading={loading['Latest Articles']}
          />

          <EndpointCard
            title="Personalized Feed"
            endpoint="GET /api/news/feed"
            data={feedArticles}
            error={errors['Personalized Feed']}
            isLoading={loading['Personalized Feed']}
          />

          <EndpointCard
            title="Saved Articles"
            endpoint="GET /api/tracking/saved"
            data={savedArticles}
            error={errors['Saved Articles']}
            isLoading={loading['Saved Articles']}
          />

          <EndpointCard
            title="Trending"
            endpoint="GET /api/tracking/trending"
            data={trending}
            error={errors['Trending']}
            isLoading={loading['Trending']}
          />
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mt-6">
          <h2 className="font-semibold mb-2">Summary</h2>
          <div className="space-y-1 text-sm">
            <div>
              Total Articles (Latest): {latestArticles?.articles?.length || 0}
            </div>
            <div>
              Total Articles (Feed): {feedArticles?.articles?.length || 0}
            </div>
            <div>
              Saved Articles: {savedArticles?.articles?.length || 0}
            </div>
            <div>
              Trending Articles: {trending?.trending?.length || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedDebug;