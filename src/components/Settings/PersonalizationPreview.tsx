import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  BarChart3,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Article, UserInterests, UserPreferences, SettingsPreview } from '../../types';
import { feedService } from '../../services/news/feedService';
// import ArticleCard from '../Feed/old/ArticleCard'; // Component removed

interface PersonalizationPreviewProps {
  interests: UserInterests;
  preferences: UserPreferences;
  isVisible: boolean;
  onClose: () => void;
}

const PersonalizationPreview: React.FC<PersonalizationPreviewProps> = ({
  interests,
  preferences,
  isVisible,
  onClose
}) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<SettingsPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      generatePreview();
    }
  }, [isVisible, interests, preferences]);

  const generatePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate preview generation
      // In a real implementation, this would call the backend
      const mockPreview = await generateMockPreview();
      setPreview(mockPreview);

    } catch (err: any) {
      setError(err.message || t('errors.generatingPreview'));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockPreview = async (): Promise<SettingsPreview> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate relevance score based on settings
    const relevanceScore = calculateRelevanceScore();

    // Get sample articles from the actual feed
    let sampleArticles: Article[] = [];
    try {
      const feedResponse = await feedService.getFeed({ limit: 3 });
      sampleArticles = feedResponse.articles.slice(0, 3);
    } catch (error) {
      console.warn('Could not fetch real articles for preview, using mock data');
      sampleArticles = getMockArticles();
    }

    // Generate matching factors
    const matchingFactors = generateMatchingFactors();

    return {
      estimatedRelevance: relevanceScore,
      sampleArticles,
      matchingFactors
    };
  };

  const calculateRelevanceScore = (): number => {
    let score = 50; // Base score

    // Boost for having interests
    if (interests.tickers.length > 0) score += 15;
    if (interests.sectors.length > 0) score += 10;
    if (interests.topics.length > 0) score += 10;
    if (interests.marketTypes.length > 1) score += 5;

    // Boost for weight distribution
    if (interests.weights) {
      const activeWeights = Object.values(interests.weights.tickers || {});
      if (activeWeights.length > 0) {
        const avgWeight = activeWeights.reduce((sum, w) => sum + w, 0) / activeWeights.length;
        score += Math.min(15, avgWeight / 10);
      }
    }

    // Adjust for preferences
    if (preferences.sentimentBias !== 'balanced') score += 5;
    if (preferences.newsFrequency === 'high') score += 5;
    if (preferences.timeHorizon === 'day_trading') score += 10;

    return Math.min(100, Math.max(0, score));
  };

  const generateMatchingFactors = (): string[] => {
    const factors: string[] = [];

    if (interests.tickers.length > 0) {
      factors.push(`Tracking ${interests.tickers.length} specific stock${interests.tickers.length > 1 ? 's' : ''}`);
    }

    if (interests.sectors.length > 0) {
      factors.push(`Following ${interests.sectors.length} sector${interests.sectors.length > 1 ? 's' : ''}`);
    }

    if (interests.topics.length > 0) {
      factors.push(`Interested in ${interests.topics.length} topic${interests.topics.length > 1 ? 's' : ''}`);
    }

    if (preferences.sentimentBias === 'bullish') {
      factors.push('Prefers positive market news');
    } else if (preferences.sentimentBias === 'bearish') {
      factors.push('Prefers cautionary market analysis');
    }

    if (preferences.riskTolerance === 'high') {
      factors.push('Comfortable with high-risk opportunities');
    } else if (preferences.riskTolerance === 'low') {
      factors.push('Focuses on stable, low-risk investments');
    }

    if (preferences.timeHorizon === 'day_trading') {
      factors.push('Prioritizes real-time market updates');
    } else if (preferences.timeHorizon === 'long_term') {
      factors.push('Focuses on long-term trends and analysis');
    }

    if (factors.length === 0) {
      factors.push('Using default recommendations');
    }

    return factors;
  };

  const getMockArticles = (): Article[] => [
    {
      id: '1',
      title: 'Apple Reports Strong Q4 Earnings Beat Expectations',
      description: 'Apple Inc. exceeded analyst expectations with strong iPhone sales and services revenue growth.',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: { name: 'Financial Times', id: 'financial-times' },
      tickers: ['AAPL'],
      sentiment: 'positive',
      market_type: 'stocks'
    },
    {
      id: '2',
      title: 'Tesla Unveils New Autonomous Driving Features',
      description: 'Tesla announces major updates to its Full Self-Driving capability with improved safety metrics.',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      source: { name: 'TechCrunch', id: 'techcrunch' },
      tickers: ['TSLA'],
      sentiment: 'positive',
      market_type: 'stocks'
    },
    {
      id: '3',
      title: 'Federal Reserve Signals Potential Rate Changes',
      description: 'The Fed hints at possible monetary policy adjustments in response to inflation data.',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      source: { name: 'Reuters', id: 'reuters' },
      tickers: [],
      sentiment: 'neutral',
      market_type: 'stocks'
    }
  ];

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    if (score >= 60) return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
  };

  const getRelevanceLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Personalization Preview
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See how your settings will affect your feed
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={generatePreview}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Generating preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={generatePreview}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : preview ? (
            <div className="space-y-6">
              {/* Relevance Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getRelevanceColor(preview.estimatedRelevance)}`}>
                      <Target className="w-4 h-4 mr-2" />
                      {preview.estimatedRelevance}% Relevance
                    </div>
                    <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                      {getRelevanceLabel(preview.estimatedRelevance)}
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Matching Factors
                  </h3>
                  <div className="space-y-1">
                    {preview.matchingFactors.map((factor, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample Articles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Sample Articles Based on Your Preferences
                </h3>
                
                {preview.sampleArticles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {preview.sampleArticles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {/* ArticleCard component removed - showing simple preview */}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {article.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {article.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{typeof article.source === 'string' ? article.source : article.source?.name || 'Unknown'}</span>
                            <span>{typeof article.sentiment === 'string' ? article.sentiment : 'neutral'}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">📰</div>
                    <p>No sample articles available</p>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Recommendations to Improve Your Feed
                </h4>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  {preview.estimatedRelevance < 60 && (
                    <>
                      {interests.tickers.length === 0 && (
                        <div>• Add some stock tickers you're interested in tracking</div>
                      )}
                      {interests.sectors.length === 0 && (
                        <div>• Select some market sectors that interest you</div>
                      )}
                      {interests.topics.length === 0 && (
                        <div>• Add specific topics you'd like to follow</div>
                      )}
                    </>
                  )}
                  {preview.estimatedRelevance >= 60 && preview.estimatedRelevance < 80 && (
                    <>
                      <div>• Consider adjusting the weights of your interests for better personalization</div>
                      <div>• Fine-tune your sentiment bias and risk tolerance settings</div>
                    </>
                  )}
                  {preview.estimatedRelevance >= 80 && (
                    <div className="flex items-center text-green-700 dark:text-green-300">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Your personalization settings look great!
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PersonalizationPreview;