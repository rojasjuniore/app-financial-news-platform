import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/news/api';
import ChatWidget from '../components/Chat/ChatWidget';
import PolygonDataCardFixed from '../components/Analysis/PolygonDataCardFixed';
import LLMPanelDiscussionV2 from '../components/Analysis/LLMPanelDiscussionV2';
import { useOptimizedLLM } from '../hooks/useOptimizedLLM';
import { 
  Calendar, TrendingUp, AlertCircle, Loader, ArrowLeft, Bot, 
  Sparkles, RefreshCw, MessageCircle, X, Users, Zap, Database,
  Clock, CheckCircle
} from 'lucide-react';
import { Article, FirestoreTimestamp } from '../types';
import { feedService } from '../services/news/feedService';
import toast from 'react-hot-toast';

const ArticleDetailOptimized: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Get default LLM model from user preferences
  const defaultLLM = localStorage.getItem('userDefaultLLM') || 'openai';
  const [selectedAI, setSelectedAI] = useState<'openai' | 'claude' | 'gemini' | 'gpt-3.5'>(defaultLLM as any);
  const [showAnalysisGenerator, setShowAnalysisGenerator] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [chatWidth, setChatWidth] = useState(480);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  
  // Fetch article data
  const { data: article, isLoading: articleLoading, error: articleError } = useQuery<Article>({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/articles/${articleId}`);
      return data;
    },
    enabled: !!articleId
  });

  // Use optimized LLM hook
  const {
    isLoading: analysisLoading,
    analysis,
    panelDiscussion,
    streamingContent,
    streamingProgress,
    performance,
    generateAnalysis,
    generatePanelDiscussion,
    startStreaming,
    clearCache,
    getCacheStats,
    isFromCache,
    responseTime,
    isFallback
  } = useOptimizedLLM(articleId, {
    autoGenerate: true,
    model: selectedAI,
    language: localStorage.getItem('i18nextLng') || 'en'
  });

  // Track view and auto-generate analysis
  useEffect(() => {
    if (article && articleId) {
      // Track view
      feedService.trackInteraction(articleId, 'view');
    }
  }, [article, articleId]);

  // Handle analysis generation
  const handleGenerateAnalysis = async (forceRegenerate = false) => {
    setShowAnalysisGenerator(false);
    await generateAnalysis(forceRegenerate, selectedAI);
    
    // Update article in cache
    queryClient.invalidateQueries({ queryKey: ['article', articleId] });
  };

  // Handle streaming analysis
  const handleStreamingAnalysis = () => {
    setShowAnalysisGenerator(false);
    startStreaming(selectedAI, (data) => {
      // Handle streaming updates
      console.log('Streaming:', data);
    });
  };

  // Get cache statistics
  const handleShowStats = async () => {
    const stats = await getCacheStats();
    if (stats) {
      console.log('Cache Stats:', stats);
      setShowPerformanceStats(true);
    }
  };

  // AI Models configuration
  const aiModels = [
    { 
      id: 'openai', 
      name: t('analysis.models.openai.name'), 
      icon: '🤖', 
      color: 'bg-green-500', 
      description: t('analysis.models.openai.description') 
    },
    { 
      id: 'claude', 
      name: t('analysis.models.claude.name'), 
      icon: '🧠', 
      color: 'bg-purple-500', 
      description: t('analysis.models.claude.description') 
    },
    { 
      id: 'gemini', 
      name: t('analysis.models.gemini.name'), 
      icon: '✨', 
      color: 'bg-blue-500', 
      description: t('analysis.models.gemini.description') 
    },
    { 
      id: 'gpt-3.5', 
      name: 'GPT-3.5 Turbo', 
      icon: '⚡', 
      color: 'bg-yellow-500', 
      description: 'Fast and cost-effective' 
    }
  ] as const;

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (articleError || !article) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">{t('article.notFound')}</h2>
          <Link to="/feed" className="text-blue-400 hover:text-blue-300">
            {t('article.backToFeed')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${isChatExpanded ? `mr-[${chatWidth}px]` : 'mr-0'}`}>
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Back Button */}
            <Link 
              to="/feed" 
              className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              {t('article.backToFeed')}
            </Link>

            {/* Performance Indicators */}
            {(isFromCache || responseTime) && (
              <div className="mb-6 flex items-center gap-4 text-sm">
                {isFromCache && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-lg">
                    <Database className="w-4 h-4" />
                    <span>Cached Response</span>
                  </div>
                )}
                {responseTime && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>{responseTime}ms</span>
                  </div>
                )}
                {isFallback && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg">
                    <Zap className="w-4 h-4" />
                    <span>Fallback Model Used</span>
                  </div>
                )}
                <button
                  onClick={handleShowStats}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Performance Stats</span>
                </button>
              </div>
            )}

            {/* Article Header */}
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-8 backdrop-blur-sm border border-gray-800/50 mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                {article.title}
              </h1>
              
              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(article.publishedAt || article.created_at).toLocaleDateString()}</span>
                </div>
                {article.source && (
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <span>{article.source}</span>
                  </div>
                )}
                {article.sentiment && (
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      article.sentiment === 'bullish' ? 'bg-green-500/20 text-green-400' :
                      article.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      <TrendingUp className="w-3 h-3" />
                      <span className="capitalize">{article.sentiment}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Article Description */}
              {article.description && (
                <p className="mt-6 text-gray-300 text-lg leading-relaxed">
                  {article.description}
                </p>
              )}

              {/* Article Image */}
              {article.urlToImage && (
                <img 
                  src={article.urlToImage} 
                  alt={article.title}
                  className="mt-6 w-full rounded-xl object-cover max-h-96"
                />
              )}
            </div>

            {/* Analysis Section */}
            <div className="space-y-8">
              {/* AI Analysis Generator */}
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl p-6 backdrop-blur-sm border border-blue-800/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">{t('analysis.title')}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Streaming Button */}
                    <button
                      onClick={handleStreamingAnalysis}
                      className="px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Stream</span>
                    </button>
                    
                    {/* Clear Cache Button */}
                    <button
                      onClick={() => clearCache()}
                      className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-all flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear Cache</span>
                    </button>
                    
                    {/* Generate/Regenerate Button */}
                    <button
                      onClick={() => setShowAnalysisGenerator(!showAnalysisGenerator)}
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all flex items-center gap-2"
                    >
                      {analysisLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : analysis ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>
                        {analysisLoading ? t('analysis.generating') : 
                         analysis ? t('analysis.regenerate') : 
                         t('analysis.generateAnalysis')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Model Selector */}
                {showAnalysisGenerator && (
                  <div className="mt-4 p-4 bg-gray-900/50 rounded-xl">
                    <p className="text-gray-400 mb-3">{t('analysis.chooseModel')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {aiModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedAI(model.id as any);
                            handleGenerateAnalysis(true);
                          }}
                          className={`p-3 rounded-lg border transition-all ${
                            selectedAI === model.id
                              ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 text-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{model.icon}</div>
                          <div className="text-sm font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display Analysis or Streaming Content */}
                {(analysis || streamingContent) && (
                  <div className="mt-6 p-4 bg-gray-900/50 rounded-xl">
                    {streamingContent ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-gray-400">Streaming Analysis...</span>
                          <span className="text-blue-400">{streamingProgress}%</span>
                        </div>
                        <div className="prose prose-invert max-w-none">
                          <p className="text-gray-300 whitespace-pre-wrap">{streamingContent}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none">
                        {/* Display structured analysis */}
                        <div className="space-y-4">
                          {analysis.marketImpact && (
                            <div>
                              <h4 className="text-blue-400 font-semibold">Market Impact</h4>
                              <p className="text-gray-300">{analysis.marketImpact}</p>
                            </div>
                          )}
                          {analysis.keyTakeaways && (
                            <div>
                              <h4 className="text-blue-400 font-semibold">Key Takeaways</h4>
                              <ul className="text-gray-300">
                                {analysis.keyTakeaways.map((takeaway: string, i: number) => (
                                  <li key={i}>{takeaway}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.recommendation && (
                            <div>
                              <h4 className="text-blue-400 font-semibold">Trading Recommendation</h4>
                              <p className="text-gray-300">{analysis.recommendation}</p>
                            </div>
                          )}
                          {analysis.riskLevel && (
                            <div>
                              <h4 className="text-blue-400 font-semibold">Risk Level</h4>
                              <p className={`font-semibold ${
                                analysis.riskLevel === 'High' ? 'text-red-400' :
                                analysis.riskLevel === 'Medium' ? 'text-yellow-400' :
                                'text-green-400'
                              }`}>{analysis.riskLevel}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Panel Discussion */}
              {article.tickers && article.tickers.length > 0 && (
                <LLMPanelDiscussionV2
                  articleId={articleId!}
                  articleTitle={article.title}
                  tickers={article.tickers}
                  existingAnalysis={panelDiscussion}
                  onGenerateDiscussion={async () => {
                    await generatePanelDiscussion(false);
                    return panelDiscussion;
                  }}
                />
              )}

              {/* Market Data */}
              {article.tickers && article.tickers.length > 0 && (
                <PolygonDataCardFixed tickers={article.tickers} />
              )}
            </div>
          </div>
        </div>

        {/* Chat Widget */}
        <ChatWidget
          articleId={articleId!}
          articleTitle={article.title}
          isExpanded={isChatExpanded}
          onToggle={() => setIsChatExpanded(!isChatExpanded)}
          width={chatWidth}
        />

        {/* Mobile Chat Button */}
        <button
          onClick={() => setShowMobileChat(true)}
          className="md:hidden fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        {/* Performance Stats Modal */}
        {showPerformanceStats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Performance Stats</h3>
                <button
                  onClick={() => setShowPerformanceStats(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {performance && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Response Time:</span>
                      <span className="text-white">{performance.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">From Cache:</span>
                      <span className={performance.fromCache ? 'text-green-400' : 'text-gray-400'}>
                        {performance.fromCache ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Model Used:</span>
                      <span className="text-white">{performance.model || selectedAI}</span>
                    </div>
                    {performance.parallelExecution && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Parallel Execution:</span>
                        <span className="text-green-400">Enabled</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={async () => {
                  const stats = await getCacheStats();
                  console.log('Full Cache Stats:', stats);
                  toast.success('Check console for detailed stats');
                }}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Full Cache Stats
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetailOptimized;