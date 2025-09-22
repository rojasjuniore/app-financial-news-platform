import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/news/api';
import ChatWidget from '../components/Chat/ChatWidget';
import PolygonDataCardFixed from '../components/Analysis/PolygonDataCardFixed';
import LLMPanelDiscussionV2 from '../components/Analysis/LLMPanelDiscussionV2';
import {
  Calendar,
  AlertCircle,
  Loader,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  MessageCircle,
  X,
  Users,
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
  const queryClient = useQueryClient();

  // Estado para controlar visibilidad individual de cada sección
  const [showMarketData, setShowMarketData] = useState(false);
  const [selectedAI] = useState<'openai' | 'claude' | 'gemini' | 'grok'>('openai');
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [showAIAnalysis, setShowAIAnalysis] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(true);
  
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
      setShowAIAnalysis(true);
    },
    onError: (error: any) => {
      toast.error(`❌ ${error.response?.data?.error || error.message}`);
    }
  });

  useEffect(() => {
    if (article && articleId) {
      // Track view
      feedService.trackInteraction(articleId, 'view');

      // Auto-generar análisis si no existe
      if (!article.llm_analysis && !generateAnalysisMutation.isPending && !generateAnalysisMutation.isError) {
        console.log('🤖 Auto-generating AI analysis for article:', articleId);
        generateAnalysisMutation.mutate({
          aiModel: selectedAI,
          forceRegenerate: false
        });
      }

      // Si ya hay análisis, asegurar que se muestre
      if (article.llm_analysis) {
        setShowAIAnalysis(true);
      }
    }
  }, [article, articleId]);

  const handleGenerateAnalysis = () => {
    if (!article?.llm_analysis) {
      generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: false });
      setShowAIAnalysis(true); // Asegurar que se muestre después de generar
    } else {
      // Toggle visibility
      setShowAIAnalysis(!showAIAnalysis);
    }
  };

  // Helper para parsear el análisis de IA mejorado
  const getParsedAnalysis = () => {
    if (!article?.llm_analysis) return null;

    console.log('🔍 Parsing AI analysis:', article.llm_analysis);

    // Función helper para limpiar contenido JSON
    const cleanJsonContent = (content: string) => {
      return content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^json\n?/g, '')
        .trim();
    };

    // Función helper para intentar parsear JSON
    const tryParseJson = (content: string) => {
      try {
        const cleaned = cleanJsonContent(content);
        return JSON.parse(cleaned);
      } catch (e) {
        console.log('Failed to parse as JSON:', e);
        return null;
      }
    };

    // Caso 1: llm_analysis es un objeto con agentes específicos (openai, claude, etc.)
    if (typeof article.llm_analysis === 'object' && !Array.isArray(article.llm_analysis)) {
      const agentKeys = ['openai', 'claude', 'gemini', 'grok'];
      for (const key of agentKeys) {
        const agent = article.llm_analysis[key];
        if (agent && (agent.content || agent.analysis)) {
          const content = agent.content || agent.analysis;

          // Intentar parsear como JSON primero
          const parsed = tryParseJson(content);
          if (parsed) {
            console.log('✅ Successfully parsed agent content as JSON');
            return parsed;
          }

          // Si no se puede parsear como JSON, devolver como contenido formateado
          console.log('📝 Returning agent content as formatted text');
          return { rawContent: content, formatted: true, agentModel: key };
        }
      }
    }

    // Caso 2: llm_analysis ya es un objeto estructurado
    if (typeof article.llm_analysis === 'object' && !Array.isArray(article.llm_analysis)) {
      const analysis = article.llm_analysis as any;
      if (analysis.trading_signals || analysis.technical_analysis || analysis.sentiment_analysis) {
        console.log('✅ Found structured analysis data');
        return article.llm_analysis;
      }
    }

    // Caso 3: llm_analysis es directamente un string
    if (typeof article.llm_analysis === 'string') {
      const parsed = tryParseJson(article.llm_analysis);
      if (parsed) {
        console.log('✅ Successfully parsed string analysis as JSON');
        return parsed;
      }
      console.log('📝 Returning string analysis as formatted text');
      return { rawContent: article.llm_analysis, formatted: true };
    }

    // Caso 4: llm_analysis es un array (múltiples análisis)
    if (Array.isArray(article.llm_analysis) && article.llm_analysis.length > 0) {
      console.log('📊 Found array of analyses');
      return { trading_signals: article.llm_analysis, formatted: false };
    }

    // Caso 5: Fallback para cualquier otro contenido
    if (article.llm_analysis && typeof article.llm_analysis === 'object' && Object.keys(article.llm_analysis).length > 0) {
      console.log('🔧 Using fallback formatting for analysis');
      return { rawContent: JSON.stringify(article.llm_analysis, null, 2), formatted: true };
    }

    console.log('❌ No parseable analysis content found');
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
            {(article.full_article || article.content) && article.content !== article.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Full Article</h2>
                <div
                  className="prose prose-gray dark:prose-invert max-w-none
                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_h2]:mt-6 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-gray-200 [&_h2]:dark:border-gray-700 [&_h2]:pb-2
                    [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:dark:text-white [&_h3]:mt-4 [&_h3]:mb-3
                    [&_p]:mb-4 [&_p]:text-gray-700 [&_p]:dark:text-gray-300 [&_p]:leading-relaxed
                    [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:hover:text-blue-700 [&_a]:dark:hover:text-blue-300
                    [&_ul]:my-4 [&_ul]:ml-6 [&_ul]:space-y-2 [&_ul]:list-disc
                    [&_ol]:my-4 [&_ol]:ml-6 [&_ol]:space-y-2 [&_ol]:list-decimal
                    [&_li]:text-gray-700 [&_li]:dark:text-gray-300
                    [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:dark:text-gray-400
                    [&_strong]:font-bold [&_strong]:text-gray-900 [&_strong]:dark:text-white
                    [&_em]:italic
                    [&_figure]:my-4
                    [&_img]:rounded-lg [&_img]:shadow-md [&_img]:my-4 [&_img]:max-w-full [&_img]:h-auto"
                  dangerouslySetInnerHTML={{
                    __html: article.full_article || article.content || ''
                  }}
                />
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

            {/* Quick AI Actions Bar */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Analysis Tools</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!article.llm_analysis ? (
                    <button
                      onClick={handleGenerateAnalysis}
                      disabled={generateAnalysisMutation.isPending}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {generateAnalysisMutation.isPending ? (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain className="w-3 h-3" />
                          Generate AI Analysis
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          showAIAnalysis
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Brain className="w-3 h-3" />
                        {showAIAnalysis ? 'Hide' : 'Show'} Analysis
                      </button>
                      <button
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          showAIPanel
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        {showAIPanel ? 'Hide' : 'Show'} Panel
                      </button>
                      {article.tickers && article.tickers.length > 0 && (
                        <button
                          onClick={() => setShowMarketData(!showMarketData)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            showMarketData
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <BarChart3 className="w-3 h-3" />
                          {showMarketData ? 'Hide' : 'Show'} Market Data
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info message while generating */}
          {!article.llm_analysis && generateAnalysisMutation.isPending && (
            <div className="px-6 pb-6">
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 text-sm">
                  <Loader className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <p className="text-gray-700 dark:text-gray-300">
                    Generando análisis de IA para este artículo...
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Always Visible AI Sections */}
        <div className="space-y-6">
          {/* AI Analysis Section */}
          {article && (() => {
            const parsedAnalysis = getParsedAnalysis();

            // Always show the section - it will have a generate button if no data
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-500" />
                      AI Analysis
                      {generateAnalysisMutation.isPending && (
                        <Loader className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                    </h2>
                    <div className="flex items-center gap-2">
                      {!generateAnalysisMutation.isPending && (
                        <button
                          onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: true })}
                          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Regenerate Analysis"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {showAIAnalysis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showAIAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-6"
                      >
                  
                  {parsedAnalysis ? (
                    <>
                      {/* For structured data */}
                      {parsedAnalysis.trading_signals ? (
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
                      ) : parsedAnalysis.formatted && parsedAnalysis.rawContent ? (
                        <div className="space-y-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Brain className="w-5 h-5 text-blue-500" />
                                AI Trading Analysis
                              </h3>
                            </div>
                            <div className="p-4 space-y-4">
                              {(() => {
                                // Extract presentation section for Spanish users
                                const presentationMatch = parsedAnalysis.rawContent.match(/(?:###?\s*)?(?:Presentación (?:para el usuario final|en Español):?)([\s\S]*?)(?=\n\n###|\n\n\d+\.|$)/i);
                                let contentToDisplay = presentationMatch ? presentationMatch[1] : parsedAnalysis.rawContent;

                                // Clean up content
                                contentToDisplay = contentToDisplay
                                  .replace(/```json[\s\S]*?```/g, '')
                                  .replace(/```[\s\S]*?```/g, '')
                                  .trim();

                                // Parse ticker recommendations
                                const tickerMatches = contentToDisplay.matchAll(/(\d+)\.\s*\*\*([A-Z]+(?:\s*\([^)]+\))?)\*\*[\s\S]*?(?=\n\d+\.|$)/g);
                                const recommendations = [];

                                for (const match of tickerMatches) {
                                  const [fullMatch, , tickerInfo] = match;
                                  const tickerName = tickerInfo.trim();

                                  // Extract trading details
                                  const actionMatch = fullMatch.match(/Acción:\s*(\w+)/i);
                                  const confidenceMatch = fullMatch.match(/(?:Nivel de )?Confianza:\s*(\d+)/i);
                                  const entryMatch = fullMatch.match(/Entrada (?:Ideal|ideal):\s*([\d.,]+)/i);
                                  const stopLossMatch = fullMatch.match(/Stop Loss:\s*([\d.,]+)/i);
                                  const takeProfitMatch = fullMatch.match(/Take Profit:\s*([\d.,]+)/i);
                                  const horizonMatch = fullMatch.match(/Horizonte de Tiempo:\s*(\w+)/i);
                                  const riskMatch = fullMatch.match(/Evaluación de Riesgo:\s*([^(\n]+)/i);
                                  const catalystMatch = fullMatch.match(/(?:Análisis de )?Catalizadores?:\s*([^\n]+)/i);

                                  recommendations.push({
                                    ticker: tickerName,
                                    action: actionMatch?.[1] || 'N/A',
                                    confidence: confidenceMatch?.[1] || 'N/A',
                                    entry: entryMatch?.[1] || 'N/A',
                                    stopLoss: stopLossMatch?.[1] || 'N/A',
                                    takeProfit: takeProfitMatch?.[1] || 'N/A',
                                    horizon: horizonMatch?.[1] || 'N/A',
                                    risk: riskMatch?.[1]?.trim() || 'N/A',
                                    catalyst: catalystMatch?.[1]?.trim() || null
                                  });
                                }

                                // If we found structured recommendations, display them nicely
                                if (recommendations.length > 0) {
                                  return recommendations.map((rec, idx) => (
                                    <div key={`rec-${idx}`} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                          {rec.ticker}
                                        </h4>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                          rec.action.toLowerCase().includes('comprar') || rec.action.toLowerCase() === 'buy'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                            : rec.action.toLowerCase().includes('vender') || rec.action.toLowerCase() === 'sell'
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                        }`}>
                                          {rec.action.toUpperCase()}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400 block">Confianza</span>
                                          <span className="font-semibold text-gray-900 dark:text-white">{rec.confidence}/10</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400 block">Entrada</span>
                                          <span className="font-semibold text-blue-600 dark:text-blue-400">${rec.entry}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400 block">Stop Loss</span>
                                          <span className="font-semibold text-red-600 dark:text-red-400">${rec.stopLoss}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400 block">Take Profit</span>
                                          <span className="font-semibold text-green-600 dark:text-green-400">${rec.takeProfit}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400 block">Horizonte</span>
                                          <span className="font-semibold text-gray-900 dark:text-white capitalize">{rec.horizon}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400 block">Riesgo</span>
                                          <span className={`font-semibold capitalize ${
                                            rec.risk.toLowerCase().includes('alto') || rec.risk.toLowerCase().includes('high')
                                              ? 'text-red-600 dark:text-red-400'
                                              : rec.risk.toLowerCase().includes('medio') || rec.risk.toLowerCase().includes('medium')
                                              ? 'text-yellow-600 dark:text-yellow-400'
                                              : 'text-green-600 dark:text-green-400'
                                          }`}>
                                            {rec.risk.split('(')[0].trim()}
                                          </span>
                                        </div>
                                      </div>

                                      {rec.catalyst && (
                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">CATALIZADOR:</span>
                                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{rec.catalyst}</p>
                                        </div>
                                      )}
                                    </div>
                                  ));
                                }

                                // Fallback to line-by-line parsing
                                const lines = contentToDisplay.split('\n').filter((line: string) => line.trim());
                                return lines.map((line: string, idx: number) => {
                                  line = line.trim();
                                  if (!line) return null;

                                  // Headers
                                  if (line.match(/^\d+\.\s*\*\*/)) {
                                    const headerMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*/);
                                    if (headerMatch) {
                                      return (
                                        <h4 key={`h-${idx}`} className="font-bold text-lg text-gray-900 dark:text-white mt-4 mb-2">
                                          {headerMatch[1]}
                                        </h4>
                                      );
                                    }
                                  }

                                  // Key-value pairs
                                  if (line.includes(':') && !line.startsWith('http')) {
                                    const colonIndex = line.indexOf(':');
                                    const key = line.substring(0, colonIndex).replace(/^\W+/, '');
                                    const value = line.substring(colonIndex + 1).trim();

                                    if (key && value) {
                                      return (
                                        <div key={`kv-${idx}`} className="mb-2">
                                          <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                                          <span className="ml-2 text-gray-600 dark:text-gray-400">{value}</span>
                                        </div>
                                      );
                                    }
                                  }

                                  return (
                                    <p key={`p-${idx}`} className="text-gray-600 dark:text-gray-400 mb-2">
                                      {line}
                                    </p>
                                  );
                                }).filter(Boolean);
                              })()}
                            </div>
                          </div>
                        </div>
                      ) : parsedAnalysis.technical_analysis ? (
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
                      ) : (
                        /* Default display for any other content */
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                              {parsedAnalysis.rawContent || JSON.stringify(parsedAnalysis, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  ) : article.llm_analysis ? (
                    /* Show raw analysis if it exists but couldn't be parsed */
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                          {typeof article.llm_analysis === 'string'
                            ? article.llm_analysis
                            : JSON.stringify(article.llm_analysis, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : !article.llm_analysis ? (
                    /* No analysis available - show generate button */
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                          No AI analysis available for this article
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Generate comprehensive trading insights with AI
                        </p>
                      </div>
                      <button
                        onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: false })}
                        disabled={generateAnalysisMutation.isPending}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                      >
                        {generateAnalysisMutation.isPending ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Generating Analysis...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate AI Analysis
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Fallback: show message for unformattable data */
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                          AI analysis data needs formatting
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          The analysis exists but couldn't be properly displayed
                        </p>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: true })}
                          disabled={generateAnalysisMutation.isPending}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 mr-2"
                        >
                          {generateAnalysisMutation.isPending ? 'Regenerating...' : 'Regenerate Analysis'}
                        </button>
                        <details className="mt-4">
                          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">Show raw data</summary>
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded text-xs text-left">
                            <pre className="whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(article.llm_analysis, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })()}

          {/* Market Data Section */}
          {article.tickers && article.tickers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    Market Data - {article.tickers[0]}
                  </h2>
                  <button
                    onClick={() => setShowMarketData(!showMarketData)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {showMarketData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <AnimatePresence>
                  {showMarketData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-6"
                    >
                      {article.llm_analysis?.polygon_data ? (
                        <PolygonDataCardFixed
                          polygonData={article.llm_analysis.polygon_data}
                          ticker={article.tickers[0]}
                        />
                      ) : (
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
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* AI Panel Discussion Section - Always Visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  AI Panel Discussion
                </h2>
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {showAIPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {showAIPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
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
          </motion.div>
        </div>
      </article>
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