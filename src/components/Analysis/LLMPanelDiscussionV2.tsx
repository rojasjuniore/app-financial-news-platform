import React, { useState } from 'react';
import { 
  Users, Brain, RefreshCw, ChevronDown, ChevronUp, Loader, 
  TrendingUp, Target, Shield, Clock, BarChart, CheckCircle,
  Info, ChevronRight, Zap, DollarSign, Activity, Volume2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { panelDiscussionService } from '../../services/panel';
import { panelCacheService } from '../../services/panel/panelCacheService';
import toast from 'react-hot-toast';

interface LLMOpinion {
  model: string;
  icon: string;
  color: string;
  role: string;
  message: string;
  timestamp: Date;
  type: 'analysis' | 'response' | 'synthesis';
  agreesWithPoints?: string[];
  disagreesWithPoints?: string[];
  newInsights?: string[];
  consensus?: any;
  sentiment?: string;
  confidence?: number;
  keyPoints?: string[];
  isAiGenerated?: boolean;
}

interface MarketData {
  ticker: string;
  price: {
    current: number;
    changePercent: number;
    volume: number;
  };
  technicals?: {
    rsi: string;
    sma20: string;
    sma50: string;
  };
  levels?: {
    support: string[];
    resistance: string[];
  };
  signals?: {
    recommendation: string;
  };
}


interface LLMPanelDiscussionV2Props {
  articleId: string;
  articleTitle: string;
  tickers?: string[];
  onGenerateDiscussion?: (models: string[]) => Promise<any>;
  existingAnalysis?: any;
}

const LLMPanelDiscussionV2: React.FC<LLMPanelDiscussionV2Props> = ({
  articleId,
  articleTitle,
  tickers,
  existingAnalysis
}) => {
  const { t, i18n } = useTranslation();
  const [discussion, setDiscussion] = useState<LLMOpinion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [consensusReached, setConsensusReached] = useState(false);
  const [finalSynthesis, setFinalSynthesis] = useState<any>(null);
  const [expandedExpert, setExpandedExpert] = useState<string | null>(null);
  const [showFullPanel, setShowFullPanel] = useState(false);
  const [lastGeneratedLanguage, setLastGeneratedLanguage] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<{[key: string]: MarketData}>({});
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [isPanelLoaded, setIsPanelLoaded] = useState(false);

  // Cargar panel desde caché al montar el componente
  React.useEffect(() => {
    const cachedPanel = panelCacheService.getPanel(articleId);
    if (cachedPanel) {
      console.log('📦 Panel cargado desde caché para artículo:', articleId);
      setDiscussion(cachedPanel.discussion.map(d => ({
        ...d,
        timestamp: new Date(d.timestamp)
      })));
      setFinalSynthesis(cachedPanel.consensus);
      setMarketData(cachedPanel.marketData || {});
      setConsensusReached(!!cachedPanel.consensus);
      setHasGeneratedOnce(true);
      setIsPanelLoaded(true);
      setLastGeneratedLanguage(cachedPanel.language);
      setShowFullPanel(false); // Mantener colapsado inicialmente
    }
  }, [articleId]);

  const llmExperts = [
    {
      id: 'openai',
      name: 'GPT-4',
      icon: '🤖',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      role: t('analysis.panel.roles.mainAnalyst'),
      expertise: t('analysis.panel.expertise.technicalFundamental')
    },
    {
      id: 'claude',
      name: 'Claude',
      icon: '🧠',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      role: t('analysis.panel.roles.criticalReviewer'),
      expertise: t('analysis.panel.expertise.riskEvaluation')
    },
    {
      id: 'gemini',
      name: 'Gemini',
      icon: '✨',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      role: t('analysis.panel.roles.dataAnalyst'),
      expertise: t('analysis.panel.expertise.metricsPatterns')
    },
    {
      id: 'grok',
      name: 'Grok',
      icon: '⚡',
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      role: t('analysis.panel.roles.synthesizer'),
      expertise: t('analysis.panel.expertise.finalConsensus')
    }
  ];

  const startPanelDiscussion = async (regenerate: boolean = false) => {
    // Prevenir múltiples llamadas mientras se está generando
    if (isGenerating) return;
    
    // Si se está regenerando, limpiar el caché
    if (regenerate) {
      panelCacheService.removePanel(articleId);
    }
    
    setIsGenerating(true);
    setDiscussion([]);
    setConsensusReached(false);
    setCurrentSpeaker('loading');
    setShowFullPanel(true);
    setLastGeneratedLanguage(i18n.language);
    setHasGeneratedOnce(true);

    try {
      const response = await panelDiscussionService.generatePanelDiscussion(articleId, regenerate);
      
      // La respuesta puede venir en diferentes formatos
      const discussionResponse = response as any;
      const discussionList = discussionResponse.discussion?.opinions || discussionResponse.discussion || [];
      const consensusData = discussionResponse.discussion?.consensus || discussionResponse.consensus;
      
      // Extract market data from response if available
      if (response.marketData) {
        setMarketData(response.marketData);
      }
      
      const discussionData = discussionList.map((d: any) => ({
        model: d.panelistName || d.model,
        icon: d.panelistAvatar || d.icon || '🤖',
        color: d.color || 'from-blue-500 to-purple-600',
        role: d.panelistRole || d.role || 'AI Expert',
        message: d.content || d.message || '',
        timestamp: new Date(d.timestamp),
        type: d.type || 'analysis',
        sentiment: d.sentiment,
        confidence: d.confidence,
        keyPoints: d.keyPoints,
        isAiGenerated: d.isAiGenerated
      }));

      if (response.cached) {
        setDiscussion(discussionData);
        if (consensusData) {
          setFinalSynthesis(consensusData);
          setConsensusReached(true);
        }
        setCurrentSpeaker(null);
      } else {
        for (let i = 0; i < discussionList.length; i++) {
          const opinion = discussionList[i];
          const expertInfo = llmExperts.find(e => 
            e.name === opinion.model || e.id === opinion.model.toLowerCase()
          );
          
          if (expertInfo) {
            setCurrentSpeaker(expertInfo.id);
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setDiscussion(prev => [...prev, {
            ...opinion,
            timestamp: new Date(opinion.timestamp)
          } as LLMOpinion]);
        }
        
        if (consensusData) {
          setFinalSynthesis(consensusData);
          setConsensusReached(true);
        }
      }
      
      // Guardar en caché local
      panelCacheService.savePanel(
        articleId,
        discussionData,
        consensusData,
        response.marketData
      );
      
      setIsPanelLoaded(true);
      toast.success(`✨ ${t('analysis.panel.panelCompleted')}`);
    } catch (error: any) {
      console.error('Error en panel de discusión:', error);
      toast.error(error.message || t('errors.panelDiscussion'));
    } finally {
      setIsGenerating(false);
      setCurrentSpeaker(null);
    }
  };

  const toggleExpert = (expertId: string) => {
    setExpandedExpert(expandedExpert === expertId ? null : expertId);
  };

  const getExpertInfo = (model: string) => {
    return llmExperts.find(e => 
      e.name === model || e.id === model.toLowerCase()
    ) || llmExperts[0];
  };

  // Calcular métricas del consenso
  const calculateMetrics = () => {
    if (!discussion.length) return null;
    
    let totalAgreements = 0;
    let totalDisagreements = 0;
    let totalInsights = 0;
    
    discussion.forEach(d => {
      totalAgreements += (d.agreesWithPoints?.length || 0);
      totalDisagreements += (d.disagreesWithPoints?.length || 0);
      totalInsights += (d.newInsights?.length || 0);
    });
    
    const consensusLevel = totalAgreements + totalDisagreements > 0
      ? Math.round((totalAgreements / (totalAgreements + totalDisagreements)) * 100)
      : 100;
    
    return {
      consensusLevel,
      totalInsights,
      totalPoints: totalAgreements + totalDisagreements
    };
  };

  const metrics = calculateMetrics();

  // Format market data for display  
  const marketDataFormatted = Object.values(marketData);


  return (
    <div className="space-y-4">
      {/* Header Premium con indicador especial */}
      <div className="relative">
        {/* Badge Premium */}
        <div className="absolute -top-3 left-4 z-10">
          <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {t('analysis.panel.premiumBadge')}
          </span>
        </div>
        
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px] rounded-xl shadow-xl">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 pt-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {t('analysis.panel.title')}
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      {t('analysis.panel.multiLLM')}
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('analysis.panel.subtitle')}
                  </p>
                </div>
              </div>

            <div className="flex items-center gap-2">
              {!isGenerating && discussion.length === 0 && (
                <button
                  onClick={() => startPanelDiscussion(false)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                >
                  <Brain className="w-4 h-4" />
                  {t('analysis.panel.startAnalysis')}
                </button>
              )}
              
              {!isGenerating && discussion.length > 0 && (
                <>
                  {/* Indicador de análisis completado */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                      {isPanelLoaded ? '📦 ' : ''}{t('analysis.panel.analysisComplete')}
                    </span>
                  </div>
                  
                  {/* Language mismatch indicator */}
                  {lastGeneratedLanguage && lastGeneratedLanguage !== i18n.language && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Info className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-xs text-yellow-700 dark:text-yellow-300">
                        {i18n.language === 'es' ? 'Análisis en inglés' : 'Analysis in Spanish'}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowFullPanel(!showFullPanel)}
                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title={showFullPanel ? t('common.collapse') : t('common.expand')}
                  >
                    {showFullPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startPanelDiscussion(true)}
                    disabled={isGenerating}
                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('analysis.regenerate')}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {isGenerating && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Loader className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    {t('analysis.panel.analyzing')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Mini avatares de expertos */}
          {(discussion.length > 0 || isGenerating) && (
            <div className="flex items-center gap-2 mt-3">
              {llmExperts.map((expert) => {
                const hasSpoken = discussion.some(d => 
                  d.model === expert.name || d.model.toLowerCase() === expert.id
                );
                const isSpeaking = currentSpeaker === expert.id;
                
                return (
                  <div
                    key={expert.id}
                    className={`relative transition-all duration-300 ${
                      isSpeaking ? 'scale-110' : ''
                    } ${hasSpoken ? 'opacity-100' : 'opacity-40'}`}
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${expert.color} flex items-center justify-center text-lg shadow-lg`}>
                      {expert.icon}
                    </div>
                    {isSpeaking && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Market Data Section */}
      {marketDataFormatted.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-[1px] rounded-xl animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  {t('analysis.panel.realTimeData')}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('analysis.panel.marketDataSubtitle')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {marketDataFormatted.map((ticker) => (
                <div key={ticker.ticker} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {ticker.ticker}
                    </span>
                    {ticker.signals?.recommendation && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ticker.signals.recommendation === 'BUY' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : ticker.signals.recommendation === 'SELL'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {ticker.signals.recommendation}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Price:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          ${ticker.price.current.toFixed(2)}
                        </span>
                        <span className={`text-xs ${
                          ticker.price.changePercent >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {ticker.price.changePercent >= 0 ? '+' : ''}{ticker.price.changePercent}%
                        </span>
                      </div>
                    </div>
                    
                    {ticker.technicals?.rsi && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">RSI:</span>
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {ticker.technicals.rsi}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Volume:</span>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {ticker.price.volume?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    
                    {ticker.levels?.support?.[0] && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Support:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          ${parseFloat(ticker.levels.support[0]).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {ticker.levels?.resistance?.[0] && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Resistance:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          ${parseFloat(ticker.levels.resistance[0]).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Resumen Ejecutivo (siempre visible si hay consenso) */}
      {consensusReached && finalSynthesis && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-[1px] rounded-xl animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  {t('analysis.panel.executiveSummary')}
                </h3>
                
                {/* Métricas principales en grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{t('analysis.panel.recommendation')}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {finalSynthesis.recommendation || 'HOLD'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <BarChart className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{t('analysis.panel.confidence')}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {finalSynthesis.confidence || metrics?.consensusLevel || 70}%
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{t('analysis.panel.timeframe')}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {finalSynthesis.timeframe || '3-6 meses'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{t('analysis.panel.risk')}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {finalSynthesis.riskLevel || 'Medio'}
                    </span>
                  </div>
                </div>

                {/* Puntos clave */}
                {finalSynthesis.keyPoints && (
                  <div className="space-y-1">
                    {finalSynthesis.keyPoints.slice(0, 3).map((point: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Discusión Expandible */}
      {showFullPanel && discussion.length > 0 && (
        <div className="space-y-3 animate-fadeIn">
          {/* Estadísticas del panel */}
          {metrics && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {metrics.consensusLevel}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('analysis.panel.consensus')}</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {discussion.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('analysis.panel.analysisCount')}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {metrics.totalInsights}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('analysis.panel.insights')}</div>
              </div>
            </div>
          )}

          {/* Opiniones de expertos en acordeón */}
          <div className="space-y-2">
            {discussion.map((opinion, index) => {
              const expert = getExpertInfo(opinion.model);
              const isExpanded = expandedExpert === `${expert.id}-${index}`;
              
              return (
                <div
                  key={index}
                  className={`${expert.bgColor} border ${expert.borderColor} rounded-xl overflow-hidden transition-all duration-300`}
                >
                  <button
                    onClick={() => toggleExpert(`${expert.id}-${index}`)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${expert.color} flex items-center justify-center text-lg shadow`}>
                        {expert.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {expert.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {expert.role}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Mini badges de sentimiento y confianza */}
                      {opinion.sentiment && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          opinion.sentiment === 'positive' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : opinion.sentiment === 'negative'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                        }`}>
                          {opinion.sentiment === 'positive' ? '↑' : opinion.sentiment === 'negative' ? '↓' : '—'}
                          {opinion.confidence ? ` ${Math.round(opinion.confidence * 100)}%` : ''}
                        </span>
                      )}
                      {opinion.keyPoints && opinion.keyPoints.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                          💡 {opinion.keyPoints.length}
                        </span>
                      )}
                      {opinion.isAiGenerated && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs">
                          AI
                        </span>
                      )}
                      
                      <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Contenido expandible - Sin animación de opacidad para evitar confusión */}
                  <div className={`transition-[max-height] duration-300 accordion-scroll ${
                    isExpanded ? 'max-h-[600px]' : 'max-h-0'
                  } ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                    <div className="px-4 pb-4">
                      {/* Puntos clave del análisis */}
                      {opinion.keyPoints && opinion.keyPoints.length > 0 && (
                        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {t('analysis.panel.keyPoints')}
                            </span>
                          </div>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {opinion.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Contenido del análisis */}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            h2: ({children}) => <h3 className="text-base font-semibold mt-3 mb-2">{children}</h3>,
                            h3: ({children}) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
                            ul: ({children}) => <ul className="text-xs space-y-1 ml-4">{children}</ul>,
                            li: ({children}) => <li className="list-disc">{children}</li>,
                            p: ({children}) => <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{children}</p>
                          }}
                        >
                          {opinion.message}
                        </ReactMarkdown>
                      </div>

                      {/* Información adicional del análisis */}
                      {opinion.isAiGenerated && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <span>{t('analysis.panel.generatedByAI')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado de carga mejorado */}
      {isGenerating && (
        <div className="space-y-3">
          {llmExperts.map((expert) => {
            const isSpeaking = currentSpeaker === expert.id;
            
            return (
              <div
                key={expert.id}
                className={`${expert.bgColor} border ${expert.borderColor} rounded-xl p-4 transition-all duration-300 ${
                  isSpeaking ? 'scale-[1.02] shadow-lg' : 'opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${expert.color} flex items-center justify-center text-lg shadow-lg ${
                    isSpeaking ? 'animate-pulse' : ''
                  }`}>
                    {expert.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {expert.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {isSpeaking ? t('analysis.panel.analyzing') : t('analysis.panel.waitingTurn')}
                    </div>
                  </div>
                  {isSpeaking && (
                    <Loader className="w-4 h-4 animate-spin text-gray-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LLMPanelDiscussionV2;