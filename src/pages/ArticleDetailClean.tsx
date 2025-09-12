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
  const [showAnalysis, setShowAnalysis] = useState(true); // Mostrar por defecto si hay análisis
  const [showMarketData, setShowMarketData] = useState(true); // Mostrar por defecto si hay datos
  const [showPanelDiscussion, setShowPanelDiscussion] = useState(false);
  const [selectedAI, setSelectedAI] = useState<'openai' | 'claude' | 'gemini' | 'grok'>('openai');
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['article', articleId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/articles/${articleId}`);
        console.log('🔍 Full API response:', response.data);
        
        // Handle standardized API response format
        if (response.data.success === false) {
          console.error('❌ API returned error:', response.data.message);
          throw new Error(response.data.message || 'Article not found');
        }
        
        const article = response.data.success ? response.data.data : response.data;
        console.log('✅ Article loaded successfully:', {
          id: article?.id,
          title: article?.title?.substring(0, 50) + '...',
          hasContent: !!article?.content,
          hasDescription: !!article?.description,
          hasLLMAnalysis: !!article?.llm_analysis
        });
        
        // Ensure the article has required fields
        if (!article || !article.title) {
          console.error('❌ Invalid article data:', article);
          throw new Error('Invalid article data received');
        }
        
        return article;
      } catch (error) {
        console.error('❌ Error fetching article:', error);
        throw error;
      }
    },
    enabled: !!articleId
  });

  // Mutation para generar análisis con IA
  const generateAnalysisMutation = useMutation({
    mutationFn: ({ aiModel, forceRegenerate }: { aiModel: 'openai' | 'claude' | 'gemini' | 'grok'; forceRegenerate?: boolean }) => 
      feedService.generateAnalysis(articleId!, aiModel, forceRegenerate || false),
    onSuccess: (response) => {
      console.log('Analysis generated:', response);
      
      // Handle standardized API response format  
      const data = response.success ? response.data : (response.data || response);
      
      if (data && data.agents) {
        toast.success(`✨ Análisis generado con ${selectedAI.toUpperCase()}`);
      } else {
        toast.success('✨ Análisis generado exitosamente');
      }
      
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
      setShowAnalysis(true); // Asegurar que se muestre después de generar
    } else {
      setShowAnalysis(!showAnalysis);
    }
  };

  // Helper para parsear el análisis de IA
  const getParsedAnalysis = () => {
    if (!article?.llm_analysis) return null;
    
    // Si llm_analysis es un objeto con agentes
    if (article.llm_analysis.openai || article.llm_analysis.claude || article.llm_analysis.gemini || article.llm_analysis.grok) {
      const agent = article.llm_analysis.openai || article.llm_analysis.claude || article.llm_analysis.gemini || article.llm_analysis.grok;
      if (agent && agent.content) {
        try {
          // Limpiar el contenido de markdown
          const cleanContent = agent.content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          const parsed = JSON.parse(cleanContent);
          return parsed;
        } catch (e) {
          console.log('Could not parse analysis as JSON, returning formatted content');
          // Try to extract useful information from raw content
          return { rawContent: agent.content, formatted: true };
        }
      }
    }
    
    // Si ya es un objeto estructurado
    if (article.llm_analysis.technical_analysis || article.llm_analysis.sentiment_analysis) {
      return article.llm_analysis;
    }
    
    return null;
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

  console.log('🎯 ArticleDetailClean render state:', {
    isLoading,
    hasError: !!error,
    hasArticle: !!article,
    articleId,
    articleTitle: article?.title?.substring(0, 30) + '...'
  });

  if (isLoading) {
    console.log('🔄 Showing loading state');
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin w-8 h-8 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando artículo...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    console.log('❌ Showing error state:', { error: error?.message, hasArticle: !!article });
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
                {article.tickers.filter((ticker, index, self) => ticker && self.indexOf(ticker) === index).map(ticker => (
                  <span key={ticker} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
                    ${ticker}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6">
            {/* Main Description */}
            {article.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Summary</h2>
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  {article.description}
                </p>
              </div>
            )}
            
            {/* Full Content */}
            {article.content && article.content !== article.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Full Article</h2>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
                  {article.content.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-3">
                        {paragraph}
                      </p>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Additional Article Info */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Article Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {article.sentiment && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Sentiment:</span>
                    <span className={`ml-2 font-medium ${
                      (typeof article.sentiment === 'string' ? article.sentiment : article.sentiment.label || '').toLowerCase().includes('bullish') ? 'text-green-600 dark:text-green-400' :
                      (typeof article.sentiment === 'string' ? article.sentiment : article.sentiment.label || '').toLowerCase().includes('bearish') ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {typeof article.sentiment === 'string' ? article.sentiment : article.sentiment.label || 'Neutral'}
                    </span>
                  </div>
                )}
                {article.market_type && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Market Type:</span>
                    <span className="ml-2 font-medium capitalize text-gray-700 dark:text-gray-300">
                      {article.market_type}
                    </span>
                  </div>
                )}
                {(article as any).impact_level && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Impact Level:</span>
                    <span className={`ml-2 font-medium capitalize ${
                      (article as any).impact_level === 'high' ? 'text-red-600 dark:text-red-400' :
                      (article as any).impact_level === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {(article as any).impact_level}
                    </span>
                  </div>
                )}
                {(article as any).primary_ticker && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Primary Ticker:</span>
                    <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                      ${(article as any).primary_ticker}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Fallback if no content */}
            {!article.description && !article.content && (
              <p className="text-gray-500 dark:text-gray-400 italic">
                No content available for this article
              </p>
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
                  <span className="font-medium text-gray-900 dark:text-white">
                    Live Market Data {article.tickers[0] && `(${article.tickers[0]})`}
                  </span>
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
          {showAnalysis && article.llm_analysis && (() => {
            const parsedAnalysis = getParsedAnalysis();
            
            return (
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
                  
                  {parsedAnalysis ? (
                    <>
                      {/* For structured data */}
                      {parsedAnalysis.trading_signals && (
                        <div className="space-y-4">
                          {parsedAnalysis.trading_signals.map((signal: any, idx: number) => (
                            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {signal.ticker || 'Trading Signal'}
                                </h3>
                                {signal.trading_signal?.recommendation && (
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    signal.trading_signal.recommendation === 'BUY' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                    signal.trading_signal.recommendation === 'SELL' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  }`}>
                                    {signal.trading_signal.recommendation}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {signal.trading_signal?.confidence_level && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                                    <span className="ml-2 font-medium">{signal.trading_signal.confidence_level}/10</span>
                                  </div>
                                )}
                                {signal.trading_signal?.time_horizon && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Time Horizon:</span>
                                    <span className="ml-2 font-medium capitalize">{signal.trading_signal.time_horizon}</span>
                                  </div>
                                )}
                                {signal.trading_signal?.position_sizing && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Position Size:</span>
                                    <span className="ml-2 font-medium">{signal.trading_signal.position_sizing}</span>
                                  </div>
                                )}
                                {signal.trading_signal?.risk_assessment?.level && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Risk Level:</span>
                                    <span className={`ml-2 font-medium capitalize ${
                                      signal.trading_signal.risk_assessment.level === 'high' ? 'text-red-600 dark:text-red-400' :
                                      signal.trading_signal.risk_assessment.level === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                      'text-green-600 dark:text-green-400'
                                    }`}>
                                      {signal.trading_signal.risk_assessment.level}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {signal.trading_signal?.risk_assessment?.explanation && (
                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Risk Analysis:</strong> {signal.trading_signal.risk_assessment.explanation}
                                  </p>
                                </div>
                              )}
                              
                              {signal.trading_signal?.catalyst_analysis && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <strong>Catalyst:</strong> {signal.trading_signal.catalyst_analysis}
                                  </p>
                                </div>
                              )}
                              
                              {signal.trading_signal?.alternative_plays && (
                                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <strong>Alternative Plays:</strong> {signal.trading_signal.alternative_plays}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* For formatted raw content */}
                      {parsedAnalysis.formatted && parsedAnalysis.rawContent && (
                        <div className="space-y-4">
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                              <Brain className="w-5 h-5 text-blue-500" />
                              AI Trading Analysis
                            </h3>
                            <div className="space-y-3">
                              {(() => {
                                // Try to extract the user presentation section first
                                const presentationMatch = parsedAnalysis.rawContent.match(/###?\s*Presentación para el usuario final:?([\s\S]*)/i);
                                let contentToDisplay = presentationMatch ? presentationMatch[1] : parsedAnalysis.rawContent;
                                
                                // Clean up the content
                                contentToDisplay = contentToDisplay
                                  .replace(/```json[\s\S]*?```/g, '') // Remove JSON blocks
                                  .replace(/```[\s\S]*?```/g, '') // Remove other code blocks
                                  .trim();
                                
                                // Parse lines
                                const lines = contentToDisplay.split('\n').filter((line: string) => line.trim());
                                
                                return lines.map((line: string, idx: number) => {
                                  // Remove markdown formatting
                                  line = line.replace(/```[^`]*```/g, '').trim();
                                  
                                  if (!line) return null; // Skip empty lines
                                  
                                  if (line.startsWith('- **') || line.startsWith('* **')) {
                                    // Parse formatted bullet points
                                    const match = line.match(/^[\-\*]\s*\*\*(.+?)\*\*:?\s*(.*)/);
                                    if (match) {
                                      const [, label, value] = match;
                                      return (
                                        <div key={`bullet-${idx}-${label}`} className="mb-3 pl-4 border-l-2 border-blue-500">
                                          <strong className="text-gray-700 dark:text-gray-300">
                                            {label}:
                                          </strong>
                                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                                            {value}
                                          </span>
                                        </div>
                                      );
                                    }
                                  } else if (line.startsWith('###')) {
                                    const headerText = line.replace(/^#+\s*/, '');
                                    return (
                                      <h4 key={`header-${idx}-${headerText.substring(0, 20)}`} className="font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2 text-lg">
                                        {headerText}
                                      </h4>
                                    );
                                  } else if (line.includes(':') && !line.startsWith('http')) {
                                    // Handle key-value pairs
                                    const colonIndex = line.indexOf(':');
                                    if (colonIndex > 0) {
                                      const key = line.substring(0, colonIndex);
                                      const value = line.substring(colonIndex + 1).trim();
                                      if (key && value) {
                                        return (
                                          <div key={`kv-${idx}-${key.substring(0, 20)}`} className="mb-2">
                                            <strong className="text-gray-700 dark:text-gray-300">
                                              {key.replace(/^\-\s*/, '').trim()}:
                                            </strong>
                                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                                              {value}
                                            </span>
                                          </div>
                                        );
                                      }
                                    }
                                  }
                                  
                                  // Default paragraph with unique key
                                  return (
                                    <p key={`p-${idx}-${line.substring(0, 20)}`} className="text-gray-600 dark:text-gray-400 mb-2">
                                      {line.replace(/^\-\s*/, '• ')}
                                    </p>
                                  );
                                }).filter(Boolean);
                              })()}
                            </div>
                            
                            {/* Add a summary section if we have the raw content */}
                            {parsedAnalysis.rawContent && parsedAnalysis.rawContent.includes('Recomendación') && (
                              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Summary</h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Analysis complete. Review the recommendations above for trading insights.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Legacy format support */}
                      {parsedAnalysis.technical_analysis && (
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Technical Analysis</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">Trend</span>
                              <p className="font-medium capitalize">{parsedAnalysis.technical_analysis.trend}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">Outlook</span>
                              <p className="font-medium">{parsedAnalysis.technical_analysis.outlook}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Fallback: show message */
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        AI analysis is available but needs formatting
                      </p>
                      <button
                        onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: true })}
                        disabled={generateAnalysisMutation.isPending}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {generateAnalysisMutation.isPending ? 'Regenerating...' : 'Regenerate Analysis'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}

          {/* Market Data Section */}
          {showMarketData && article.tickers && article.tickers[0] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              {article.llm_analysis?.polygon_data ? (
                <PolygonDataCardFixed 
                  polygonData={article.llm_analysis.polygon_data} 
                  ticker={article.tickers[0]} 
                />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    Market Data - {article.tickers[0]}
                  </h2>
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Real-time market data not available for this article
                    </p>
                    <button
                      onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: true })}
                      disabled={generateAnalysisMutation.isPending}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {generateAnalysisMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Generating...
                        </span>
                      ) : (
                        'Generate with Market Data'
                      )}
                    </button>
                  </div>
                </div>
              )}
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