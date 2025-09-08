import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/news/api';
import ChatWidget from '../components/Chat/ChatWidget';
import PolygonDataCardFixed from '../components/Analysis/PolygonDataCardFixed';
import LLMPanelDiscussionV2 from '../components/Analysis/LLMPanelDiscussionV2';
import { 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Loader, 
  ArrowLeft, 
  Bot, 
  Sparkles, 
  RefreshCw, 
  MessageCircle, 
  X, 
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BarChart3,
  Brain,
  Eye,
  EyeOff
} from 'lucide-react';
import { Article, FirestoreTimestamp } from '../types';
import { feedService } from '../services/news/feedService';
import toast from 'react-hot-toast';

const ArticleDetailClean: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Estados para controlar qué secciones están expandidas
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showMarketData, setShowMarketData] = useState(false);
  const [showPanelDiscussion, setShowPanelDiscussion] = useState(false);
  const [selectedAI, setSelectedAI] = useState<'openai' | 'claude' | 'gemini' | 'grok'>('openai');
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/articles/${articleId}`);
      return data;
    },
    enabled: !!articleId
  });

  // Mutation para generar análisis con IA
  const generateAnalysisMutation = useMutation({
    mutationFn: ({ aiModel, forceRegenerate }: { aiModel: 'openai' | 'claude' | 'gemini' | 'grok'; forceRegenerate?: boolean }) => 
      feedService.generateAnalysis(articleId!, aiModel, forceRegenerate || false),
    onSuccess: (data) => {
      toast.success(`✨ Analysis generated with ${data.aiModel?.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      setShowAnalysis(true);
    },
    onError: (error: any) => {
      toast.error(`❌ ${error.response?.data?.error || error.message}`);
    }
  });

  useEffect(() => {
    if (article && articleId) {
      feedService.trackInteraction(articleId, 'view');
    }
  }, [article, articleId]);

  const handleGenerateAnalysis = () => {
    if (!article?.llm_analysis) {
      generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: false });
    } else {
      setShowAnalysis(!showAnalysis);
    }
  };

  // Formato de fecha simplificado
  const formatDate = (dateValue: string | FirestoreTimestamp | undefined): string => {
    if (!dateValue) return '';
    
    let date: Date | null = null;
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if ((dateValue as FirestoreTimestamp)?._seconds) {
      date = new Date((dateValue as FirestoreTimestamp)._seconds * 1000);
    }
    
    if (date && !isNaN(date.getTime())) {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffHours < 48) return 'Yesterday';
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Article not found
          </h2>
          <Link to="/feed" className="text-blue-500 hover:underline">
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Navigation */}
        <div className="mb-4">
          <Link
            to="/feed"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>

        {/* Main Article Card */}
        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {article.title}
            </h1>
            
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishedAt || article.published_at || article.createdAt)}
              </span>
              
              {article.source && (
                <span>
                  {typeof article.source === 'string' ? article.source : article.source.name}
                </span>
              )}
              
              {article.url && (
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Read original
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Tickers */}
            {article.tickers && article.tickers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {article.tickers.map(ticker => ticker && (
                  <span key={ticker} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
                    ${ticker}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6">
            {article.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg leading-relaxed">
                {article.description}
              </p>
            )}
            
            {article.content && (
              <div 
                className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400"
                dangerouslySetInnerHTML={{ __html: article.content.substring(0, 500) + '...' }}
              />
            )}
          </div>

          {/* Action Buttons Section */}
          <div className="px-6 pb-6 space-y-3">
            {/* AI Analysis Button */}
            <button
              onClick={handleGenerateAnalysis}
              disabled={generateAnalysisMutation.isPending}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {article.llm_analysis ? 'View AI Analysis' : 'Generate AI Analysis'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {generateAnalysisMutation.isPending && (
                  <Loader className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                )}
                {showAnalysis ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </div>
            </button>

            {/* Market Data Button */}
            {article.tickers && article.tickers.length > 0 && (
              <button
                onClick={() => setShowMarketData(!showMarketData)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Live Market Data</span>
                </div>
                {showMarketData ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>
            )}

            {/* Panel Discussion Button */}
            <button
              onClick={() => setShowPanelDiscussion(!showPanelDiscussion)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-gray-900 dark:text-white">AI Panel Discussion</span>
              </div>
              {showPanelDiscussion ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>

          </div>
        </article>

        {/* Expandable Sections */}
        <AnimatePresence>
          {/* AI Analysis Section */}
          {showAnalysis && article.llm_analysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-500" />
                  AI Analysis
                </h2>
                
                {/* Technical Analysis */}
                {article.llm_analysis.technical_analysis && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Technical Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Trend</span>
                        <p className="font-medium capitalize">{article.llm_analysis.technical_analysis.trend}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Outlook</span>
                        <p className="font-medium">{article.llm_analysis.technical_analysis.outlook}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sentiment Analysis */}
                {article.llm_analysis.sentiment_analysis && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Sentiment Analysis</h3>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        article.llm_analysis.sentiment_analysis.overall_sentiment === 'bullish' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : article.llm_analysis.sentiment_analysis.overall_sentiment === 'bearish'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {article.llm_analysis.sentiment_analysis.overall_sentiment}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence: {article.llm_analysis.sentiment_analysis.confidence}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Trading Plan (Collapsed by default) */}
                {article.llm_analysis.trading_plan && (
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                      View Trading Plan
                    </summary>
                    <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Strategy</span>
                          <p className="font-medium">{article.llm_analysis.trading_plan.strategy}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Risk/Reward</span>
                          <p className="font-medium">{article.llm_analysis.trading_plan.risk_reward}</p>
                        </div>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </motion.div>
          )}

          {/* Market Data Section */}
          {showMarketData && article.tickers && article.tickers[0] && article.llm_analysis?.polygon_data && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <PolygonDataCardFixed 
                polygonData={article.llm_analysis.polygon_data} 
                ticker={article.tickers[0]} 
              />
            </motion.div>
          )}

          {/* Panel Discussion Section */}
          {showPanelDiscussion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <LLMPanelDiscussionV2 
                articleId={articleId!} 
                articleTitle={article.title}
                tickers={article.tickers}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
        
        {/* Fixed Chat Panel on the Right */}
        <div className={`hidden lg:block transition-all duration-300 ${
          isChatExpanded ? 'w-[480px]' : 'w-[60px]'
        } border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
          {isChatExpanded ? (
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">AI Assistant</span>
                </div>
                <button
                  onClick={() => setIsChatExpanded(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Chat Widget */}
              <div className="flex-1 overflow-hidden">
                <ChatWidget 
                  articleId={articleId!} 
                  integrated={true}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <button
                onClick={() => setIsChatExpanded(true)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Open chat"
              >
                <MessageCircle className="w-6 h-6 text-blue-500" />
              </button>
            </div>
          )}
        </div>
        
        {/* Mobile Chat Button - Fixed at bottom */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all"
          >
            {isChatExpanded ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Chat Panel - Slide up from bottom */}
        {isChatExpanded && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 h-[70vh] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
            <div className="h-full flex flex-col">
              {/* Mobile Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">AI Assistant</span>
                <button
                  onClick={() => setIsChatExpanded(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Mobile Chat Widget */}
              <div className="flex-1 overflow-hidden">
                <ChatWidget 
                  articleId={articleId!} 
                  integrated={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetailClean;