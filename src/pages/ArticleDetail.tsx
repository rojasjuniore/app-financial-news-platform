import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import ChatWidget from '../components/Chat/ChatWidget';
import Navbar from '../components/Layout/Navbar';
import PolygonDataCardFixed from '../components/Analysis/PolygonDataCardFixed';
import LLMPanelDiscussionV2 from '../components/Analysis/LLMPanelDiscussionV2';
import { Calendar, TrendingUp, AlertCircle, Loader, ArrowLeft, Bot, Sparkles, RefreshCw, MessageCircle, X, Users } from 'lucide-react';
import { Article, FirestoreTimestamp } from '../types';
import { feedService } from '../services/feedService';
import toast from 'react-hot-toast';

const ArticleDetail: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Get default LLM model from user preferences (stored in localStorage for now)
  const defaultLLM = localStorage.getItem('userDefaultLLM') || 'openai';
  const [selectedAI, setSelectedAI] = useState<'openai' | 'claude' | 'gemini' | 'grok'>(defaultLLM as any);
  const [showAnalysisGenerator, setShowAnalysisGenerator] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [chatWidth, setChatWidth] = useState(480); // Ancho inicial del chat
  
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/articles/${articleId}`);
      return data;
    },
    enabled: !!articleId
  });

  // 🤖 Mutation para generar análisis con IA
  const generateAnalysisMutation = useMutation({
    mutationFn: ({ aiModel, forceRegenerate }: { aiModel: 'openai' | 'claude' | 'gemini' | 'grok'; forceRegenerate?: boolean }) => 
      feedService.generateAnalysis(articleId!, aiModel, forceRegenerate || false),
    onSuccess: (data) => {
      toast.success(`✨ ${t('analysis.generatedWith')} ${data.aiModel?.toUpperCase()}`);
      // Refrescar el artículo para mostrar el nuevo análisis
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      setShowAnalysisGenerator(false);
    },
    onError: (error: any) => {
      toast.error(`❌ ${t('errors.generic')}: ${error.response?.data?.error || error.message}`);
    }
  });

  useEffect(() => {
    if (article && articleId) {
      // Trackear vista
      feedService.trackInteraction(articleId, 'view');
      
      // 🤖 Auto-generar análisis si no existe (usando modelo por defecto del usuario)
      if (!article.llm_analysis) {
        // Auto-generate analysis with user's default model
        generateAnalysisMutation.mutate({ 
          aiModel: selectedAI, 
          forceRegenerate: false 
        });
      }
    }
  }, [article, articleId]);

  // 🎯 Función para generar análisis
  const handleGenerateAnalysis = (forceRegenerate = false) => {
    generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate });
  };

  // 📊 Modelos de IA disponibles
  const aiModels = [
    { id: 'openai', name: t('analysis.models.openai.name'), icon: '🤖', color: 'bg-green-500', description: t('analysis.models.openai.description') },
    { id: 'claude', name: t('analysis.models.claude.name'), icon: '🧠', color: 'bg-purple-500', description: t('analysis.models.claude.description') },
    { id: 'gemini', name: t('analysis.models.gemini.name'), icon: '✨', color: 'bg-blue-500', description: t('analysis.models.gemini.description') },
    { id: 'grok', name: t('analysis.models.grok.name'), icon: '⚡', color: 'bg-orange-500', description: t('analysis.models.grok.description') }
  ] as const;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center glass-dark rounded-xl p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {t('article.errorLoading')}
          </h2>
          <p className="text-gray-400 mb-4">
            {(error as any)?.message || t('article.notFound')}
          </p>
          <Link
            to="/feed"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {t('article.backToFeed')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      
      {/* Layout responsivo con chat mejorado */}
      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] relative">
        {/* Panel principal: Artículo con ancho dinámico */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isChatExpanded ? 'lg:mr-0' : 'lg:mr-0'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Back button */}
            <Link
              to="/feed"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 sm:mb-6 group transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm sm:text-base">{t('article.backToFeed')}</span>
            </Link>

            <article className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 transition-colors">
                  {article.title}
                </h1>
                
                {/* Fecha y fuente */}
                <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 dark:text-gray-400 space-y-2 sm:space-y-0 sm:space-x-4 text-sm sm:text-base transition-colors">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-blue-400 flex-shrink-0" />
                    {(() => {
                      // Handle different date formats
                      let date: Date | null = null;
                      
                      const parseDate = (dateValue: string | FirestoreTimestamp | undefined): Date | null => {
                        if (!dateValue) return null;
                        
                        if (typeof dateValue === 'string') {
                          return new Date(dateValue);
                        } else if ((dateValue as FirestoreTimestamp)._seconds) {
                          return new Date((dateValue as FirestoreTimestamp)._seconds * 1000);
                        }
                        return null;
                      };
                      
                      // Try different date fields in order of preference
                      date = parseDate(article.publishedAt) || 
                             parseDate(article.published_at) || 
                             parseDate(article.createdAt) || 
                             parseDate(article.created_at);
                      
                      if (date && !isNaN(date.getTime())) {
                        return date.toLocaleString(t('common.locale'), {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });
                      }
                      
                      return t('common.dateNotAvailable');
                    })()}
                  </span>
                  {article.source && (
                    <span className="text-gray-500">
                      {t('article.source')}: {typeof article.source === 'string' 
                        ? article.source 
                        : (article.source as any).name || 'Unknown Source'}
                    </span>
                  )}
                </div>
                
                {/* Market Type Badge y Link Original */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                  {/* Market Type Badge */}
                  {article.market_type && (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                      article.market_type === 'stocks' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      article.market_type === 'crypto' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                      article.market_type === 'forex' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                      article.market_type === 'commodities' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                    }`}>
                      {article.market_type === 'stocks' ? `📈 ${t('markets.stocks')}` :
                       article.market_type === 'crypto' ? `🪙 ${t('markets.crypto')}` :
                       article.market_type === 'forex' ? `💱 ${t('markets.forex')}` :
                       article.market_type === 'commodities' ? `🥇 ${t('markets.commodities')}` :
                       `🌍 ${t('markets.global')}`}
                    </span>
                  )}
                  
                  {/* Link al artículo original */}
                  {article.url && (
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      {t('article.readOriginal')} →
                    </a>
                  )}
                </div>
                
                {/* Tickers */}
                {article.tickers && article.tickers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                    {article.tickers.map(ticker => ticker && (
                      <span key={ticker} className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                        ${ticker}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none mb-6 sm:mb-8 text-gray-700 dark:text-gray-300 transition-colors">
                {article.description && (
                  <p className="text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                    {article.description}
                  </p>
                )}
                {article.content && (
                  <div className="text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: article.content }} />
                )}
              </div>

              {/* 🤖 INDICADOR DE GENERACIÓN AUTOMÁTICA */}
              {generateAnalysisMutation.isPending && !article.llm_analysis && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8 mb-6 sm:mb-8 transition-colors">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 sm:p-6 transition-colors animate-pulse">
                    <div className="flex items-center justify-center">
                      <Loader className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {t('analysis.generatingAutomatically')}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {t('analysis.usingModel')} {aiModels.find(m => m.id === selectedAI)?.name}...
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🤖 GENERADOR DE ANÁLISIS CON IA (Manual) */}
              {showAnalysisGenerator && !article.llm_analysis && !generateAnalysisMutation.isPending && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8 mb-6 sm:mb-8 transition-colors">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 sm:p-6 transition-colors">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <Bot className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 dark:text-blue-400 mr-2 sm:mr-3 transition-colors" />
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white transition-colors">{t('analysis.generateAnalysis')}</h2>
                    </div>
                    
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 transition-colors">
                      {t('analysis.generateAnalysis')}
                    </p>

                    {/* Selector de Modelo de IA - Responsive Grid */}
                    <div className="mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 transition-colors">{t('analysis.chooseModel')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        {aiModels.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => setSelectedAI(model.id as any)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                              selectedAI === model.id
                                ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center mb-1 sm:mb-2">
                              <span className="text-lg sm:text-xl mr-2">{model.icon}</span>
                              <span className="font-medium text-xs sm:text-sm">{model.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{model.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <button
                        onClick={() => setShowAnalysisGenerator(false)}
                        className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm sm:text-base"
                      >
                        {t('common.cancel')}
                      </button>
                      
                      <button
                        onClick={() => handleGenerateAnalysis(false)}
                        disabled={generateAnalysisMutation.isPending}
                        className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        {generateAnalysisMutation.isPending ? (
                          <Loader className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        {generateAnalysisMutation.isPending 
                          ? t('analysis.generating') 
                          : t('analysis.generateAnalysis')
                        }
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel de Expertos IA - Sección Premium Separada */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8 mt-8">
                <LLMPanelDiscussionV2
                  articleId={articleId!}
                  articleTitle={article.title}
                  tickers={article.tickers}
                  existingAnalysis={article.llm_analysis}
                />
              </div>

              {/* Datos en tiempo real de Polygon.io */}
              {article.llm_analysis?.polygon_data && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
                  <PolygonDataCardFixed 
                    polygonData={article.llm_analysis.polygon_data}
                    ticker={article.tickers?.[0]}
                  />
                </div>
              )}

              {/* Análisis Existente */}
              {article.llm_analysis && (
                <div className={`${article.llm_analysis.polygon_data ? '' : 'border-t border-gray-200 dark:border-gray-700'} pt-6 sm:pt-8 transition-colors`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white transition-colors">{t('analysis.title')}</h2>
                    
                    {/* Badge del modelo usado */}
                    {article.llm_analysis.model_used && (
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <span className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium transition-colors">
                          {t('analysis.generatedWith')} {article.llm_analysis.model_used.toUpperCase()}
                        </span>
                        
                        <button
                          onClick={() => handleGenerateAnalysis(true)}
                          disabled={generateAnalysisMutation.isPending}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('analysis.regenerate')}
                        >
                          {generateAnalysisMutation.isPending ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Mensaje de No Ticker */}
                  {article.llm_analysis.no_ticker_message && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 transition-colors">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold mb-2 text-amber-900 dark:text-amber-200">
                            {t('analysis.noAnalysis')}
                          </h3>
                          <p className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm leading-relaxed">
                            {article.llm_analysis.no_ticker_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Análisis Técnico */}
                  {article.llm_analysis.technical_analysis && !article.llm_analysis.no_ticker_message && (
                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 transition-colors">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center text-gray-900 dark:text-white transition-colors">
                        <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-blue-600 dark:text-blue-400 transition-colors" />
                        {t('analysis.technicalAnalysis')}
                      </h3>
                      <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.trend')}:</span>{' '}
                          <span className="text-gray-600 dark:text-gray-400 transition-colors">{article.llm_analysis.technical_analysis.trend}</span>
                        </div>
                        {article.llm_analysis.technical_analysis.key_levels && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.keyLevels')}:</span>
                            <ul className="mt-2 space-y-1">
                              {Object.entries(article.llm_analysis.technical_analysis.key_levels).map(([key, value]) => (
                                <li key={key} className="text-gray-600 dark:text-gray-400 transition-colors">
                                  {key}: {value}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}


                  {/* Análisis de Sentimiento */}
                  {article.llm_analysis.sentiment_analysis && (
                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 transition-colors">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white transition-colors">{t('analysis.sentimentAnalysis')}</h3>
                      <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.overallSentiment')}:</span>{' '}
                          <span className={`px-2 py-1 rounded text-xs sm:text-sm ${
                            article.llm_analysis.sentiment_analysis.overall_sentiment.includes('bullish') 
                              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                              : article.llm_analysis.sentiment_analysis.overall_sentiment.includes('bearish')
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400'
                          } transition-colors`}>
                            {article.llm_analysis.sentiment_analysis.overall_sentiment}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.confidence')}:</span>{' '}
                          <span className="text-gray-600 dark:text-gray-400 transition-colors">
                            {Math.round(article.llm_analysis.sentiment_analysis.confidence * 100)}%
                          </span>
                        </div>
                        {article.llm_analysis.sentiment_analysis.key_factors && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.keyFactors')}:</span>
                            <ul className="mt-2 list-disc list-inside space-y-1">
                              {article.llm_analysis.sentiment_analysis.key_factors.map((factor, idx) => (
                                <li key={idx} className="text-gray-600 dark:text-gray-400 transition-colors">{factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Plan de Trading - Responsive Grid */}
                  {article.llm_analysis.trading_plan && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4 sm:p-6 transition-colors">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white transition-colors">{t('analysis.tradingPlan')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.entryPoints')}:</span>
                          <div className="text-gray-600 dark:text-gray-400 transition-colors">
                            {article.llm_analysis.trading_plan.entry_points.join(', ')}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.stopLoss')}:</span>
                          <div className="text-red-600 dark:text-red-400 font-medium transition-colors">
                            {article.llm_analysis.trading_plan.stop_loss}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.takeProfit')}:</span>
                          <div className="text-green-600 dark:text-green-400 font-medium transition-colors">
                            {article.llm_analysis.trading_plan.take_profit.join(', ')}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.riskReward')}:</span>
                          <div className="text-gray-600 dark:text-gray-400 transition-colors">
                            1:{article.llm_analysis.trading_plan.risk_reward}
                          </div>
                        </div>
                      </div>
                      {article.llm_analysis.trading_plan.strategy && (
                        <div className="mt-3 sm:mt-4">
                          <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('analysis.strategy')}:</span>
                          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base transition-colors">
                            {article.llm_analysis.trading_plan.strategy}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sentimiento */}
              {article.sentiment && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('article.marketSentiment')}:</span>
                    <span className={`font-bold text-sm sm:text-base ${
                      article.sentiment.includes('bullish') || article.sentiment === 'positive' 
                        ? 'text-green-600 dark:text-green-400'
                        : article.sentiment.includes('bearish') || article.sentiment === 'negative'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {article.sentiment.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}
            </article>
          </div>
        </div>

        {/* Panel derecho: Chat mejorado estilo Claude */}
        <div 
          className={`hidden lg:flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ${isChatExpanded ? 'w-[480px]' : 'w-16'}`}
          style={{ minWidth: isChatExpanded ? '400px' : '64px', maxWidth: isChatExpanded ? '600px' : '64px' }}
        >
          {/* Botón para expandir/colapsar chat */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            {isChatExpanded ? (
              <>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('chat.aiAssistant')}</h3>
                </div>
                <button
                  onClick={() => setIsChatExpanded(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t('chat.minimize')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsChatExpanded(true)}
                className="w-full p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={t('chat.expand')}
              >
                <MessageCircle className="w-5 h-5 mx-auto" />
              </button>
            )}
          </div>
          
          {/* Contenido del chat */}
          {isChatExpanded && articleId && (
            <div className="flex-1 overflow-hidden">
              <ChatWidget articleId={articleId} integrated={true} />
            </div>
          )}
        </div>

        {/* Botón flotante de chat para móvil */}
        <button
          onClick={() => setShowMobileChat(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        {/* Chat modal para móvil */}
        {showMobileChat && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div 
              className="absolute inset-x-0 bottom-0 top-16 bg-white dark:bg-gray-800 rounded-t-2xl transition-transform duration-300 ease-out"
              style={{
                animation: 'slideUp 0.3s ease-out'
              }}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('chat.title')}</h3>
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="h-[calc(100%-60px)]">
                {articleId && <ChatWidget articleId={articleId} integrated={true} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;