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
  EyeOff,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bell,
  Share2,
  Bookmark,
  Target,
  Activity,
  Clock,
  Shield,
  Zap,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { Article, FirestoreTimestamp } from '../types';
import { feedService } from '../services/news/feedService';
import toast from 'react-hot-toast';

// Loading skeleton components
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
);

const TradingSignalCard = ({
  signal,
  onQuickTrade
}: {
  signal: any;
  onQuickTrade: (action: string, ticker: string) => void;
}) => {
  const isPositive = signal.action?.toLowerCase().includes('buy') || signal.action?.toLowerCase().includes('comprar');
  const isNegative = signal.action?.toLowerCase().includes('sell') || signal.action?.toLowerCase().includes('vender');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {signal.ticker}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Trading Signal</p>
          </div>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
            isPositive
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : isNegative
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}>
            {isPositive && <TrendingUp className="w-4 h-4 mr-1" />}
            {isNegative && <TrendingDown className="w-4 h-4 mr-1" />}
            {signal.action?.toUpperCase() || 'HOLD'}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">CONFIDENCE</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {signal.confidence || 'N/A'}/10
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ENTRY</span>
          </div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            ${signal.entry || 'N/A'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">STOP LOSS</span>
          </div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400">
            ${signal.stopLoss || 'N/A'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">TARGET</span>
          </div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            ${signal.takeProfit || 'N/A'}
          </div>
        </div>
      </div>

      {/* Risk & Time Info */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {signal.horizon || 'Short-term'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className={`text-sm font-medium ${
              signal.risk?.toLowerCase().includes('high') || signal.risk?.toLowerCase().includes('alto')
                ? 'text-red-600 dark:text-red-400'
                : signal.risk?.toLowerCase().includes('medium') || signal.risk?.toLowerCase().includes('medio')
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {signal.risk?.split('(')[0]?.trim() || 'Medium'} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Catalyst */}
      {signal.catalyst && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                Catalyst
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {typeof signal.catalyst === 'string'
                  ? signal.catalyst
                  : typeof signal.catalyst === 'object' && signal.catalyst.potential_drivers
                  ? signal.catalyst.potential_drivers
                  : typeof signal.catalyst === 'object'
                  ? JSON.stringify(signal.catalyst)
                  : signal.catalyst}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onQuickTrade(signal.action, signal.ticker)}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
            isPositive
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-200 dark:hover:shadow-green-900'
              : isNegative
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900'
              : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Quick {signal.action || 'Trade'}
          </div>
        </button>

        <button className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm transition-all duration-200">
          <Bell className="w-4 h-4" />
        </button>

        <button className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm transition-all duration-200">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const ArticleDetailClean: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const queryClient = useQueryClient();

  // State management
  const [selectedTab, setSelectedTab] = useState<'overview' | 'analysis' | 'signals' | 'market' | 'discussion'>('overview');
  const [selectedAI] = useState<'openai' | 'claude' | 'gemini' | 'grok'>('openai');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
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

  // Mutation for AI analysis generation
  const generateAnalysisMutation = useMutation({
    mutationFn: ({ aiModel, forceRegenerate }: { aiModel: 'openai' | 'claude' | 'gemini' | 'grok'; forceRegenerate?: boolean }) =>
      feedService.generateAnalysis(articleId!, aiModel, forceRegenerate || false),
    onSuccess: (response) => {
      console.log('Analysis generated:', response);

      // Handle standardized API response format
      const data = response.success ? response.data : (response.data || response);

      if (data && data.agents) {
        toast.success(`✨ Analysis generated with ${selectedAI.toUpperCase()}`);
      } else {
        toast.success('✨ Analysis generated successfully');
      }

      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      // Only switch to signals tab if we're not on market tab
      if (selectedTab !== 'market') {
        setSelectedTab('signals'); // Auto-switch to signals tab
      }
    },
    onError: (error: any) => {
      toast.error(`❌ ${error.response?.data?.error || error.message}`);
    }
  });

  // Quick trade handler
  const handleQuickTrade = (action: string, ticker: string) => {
    toast.success(`🚀 Quick ${action} order placed for ${ticker}`);
    // Here you would integrate with your trading platform
  };

  // Bookmark handler
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  useEffect(() => {
    if (article && articleId) {
      // Track view
      feedService.trackInteraction(articleId, 'view');

      // Auto-generate analysis if it doesn't exist
      if (!article.llm_analysis && !generateAnalysisMutation.isPending && !generateAnalysisMutation.isError) {
        console.log('🤖 Auto-generating AI analysis for article:', articleId);
        generateAnalysisMutation.mutate({
          aiModel: selectedAI,
          forceRegenerate: false
        });
      }
    }
  }, [article, articleId]);

  // Check if article is finance-related
  const isFinanceArticle = () => {
    if (!article) return false;

    // Check for real tickers - allow any valid ticker symbols
    const hasRealTickers = article.tickers && article.tickers.length > 0 &&
                          article.tickers.some(ticker => {
                            // Valid ticker pattern: 1-5 uppercase letters
                            return /^[A-Z]{1,5}$/.test(ticker) &&
                                   !['MOCK', 'TEST', 'DEMO', 'EXAMPLE'].includes(ticker);
                          });

    // Expanded finance keywords
    const hasFinanceKeywords = article.title?.toLowerCase().match(
      /stock|market|trading|investor|earning|finance|economy|nasdaq|nyse|crypto|bitcoin|dollar|fed|inflation|gdp|bond|treasury|commodity|oil|gold|forex|currency|bank|financial|investment|portfolio|dividend|ipo|merger|acquisition|revenue|profit|loss|bear|bull/
    );

    const hasMarketType = article.market_type &&
                         ['stocks', 'crypto', 'forex'].includes(article.market_type);

    // Check for trading_analysis in the article
    const hasTradingAnalysis = article.trading_analysis &&
                               article.trading_analysis.recommendations &&
                               article.trading_analysis.recommendations.length > 0;

    return hasRealTickers || hasFinanceKeywords || hasMarketType || hasTradingAnalysis;
  };

  // Enhanced analysis parser with better trading signal extraction
  const getParsedAnalysis = () => {
    if (!article?.llm_analysis) return null;

    console.log('🔍 Parsing AI analysis:', article.llm_analysis);
    console.log('📊 Article trading_analysis:', article.trading_analysis);

    const cleanJsonContent = (content: string) => {
      // First, try to extract JSON from markdown code blocks
      const codeBlockMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        return codeBlockMatch[1].trim();
      }

      // Otherwise clean up the content
      return content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^json\n?/g, '')
        .trim();
    };

    const tryParseJson = (content: string) => {
      try {
        const cleaned = cleanJsonContent(content);
        // Try to extract JSON from markdown code blocks
        const jsonMatch = cleaned.match(/^```(?:json)?\n?([\s\S]*?)\n?```$/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        return JSON.parse(cleaned);
      } catch (e) {
        // Try to find JSON within the content
        try {
          const jsonStart = content.indexOf('{');
          const jsonEnd = content.lastIndexOf('}') + 1;
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const jsonStr = content.substring(jsonStart, jsonEnd);
            return JSON.parse(jsonStr);
          }
        } catch (innerError) {
          console.log('Failed to parse as JSON:', e);
        }
        return null;
      }
    };

    // Enhanced parsing logic for better trading signal extraction
    if (typeof article.llm_analysis === 'object' && !Array.isArray(article.llm_analysis)) {
      const agentKeys = ['openai', 'claude', 'gemini', 'grok'];
      for (const key of agentKeys) {
        const agent = article.llm_analysis[key];
        if (agent && (agent.content || agent.analysis)) {
          const content = agent.content || agent.analysis;

          const parsed = tryParseJson(content);
          if (parsed) {
            console.log('✅ Successfully parsed agent content as JSON');
            // If we have trading_signals in the parsed data, return it
            if (parsed.trading_signals) {
              return parsed;
            }
          }

          // Enhanced text parsing for trading signals
          if (typeof content === 'string') {
            const presentationMatch = content.match(/(?:###?\s*)?(?:Presentación (?:para el usuario final|en Español):?)([\s\S]*?)(?=\n\n###|\n\n\d+\.|$)/i);
            let contentToDisplay = presentationMatch ? presentationMatch[1] : content;

            contentToDisplay = contentToDisplay
              .replace(/```json[\s\S]*?```/g, '')
              .replace(/```[\s\S]*?```/g, '')
              .trim();

            const tickerMatches = Array.from(contentToDisplay.matchAll(/(\d+)\.\s*\*\*([A-Z]+(?:\s*\([^)]+\))?)\*\*[\s\S]*?(?=\n\d+\.|$)/g));
            const recommendations = [];

            for (const match of tickerMatches) {
              const [fullMatch, , tickerInfo] = match;
              const tickerName = tickerInfo.trim();

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

            if (recommendations.length > 0) {
              return { trading_signals: recommendations, formatted: true };
            }
          }

          return { rawContent: content, formatted: true, agentModel: key };
        }
      }
    }

    // Handle other formats...
    if (typeof article.llm_analysis === 'object' && !Array.isArray(article.llm_analysis)) {
      const analysis = article.llm_analysis as any;
      if (analysis.trading_signals || analysis.technical_analysis || analysis.sentiment_analysis) {
        return article.llm_analysis;
      }
    }

    if (typeof article.llm_analysis === 'string') {
      const parsed = tryParseJson(article.llm_analysis);
      if (parsed) return parsed;
      return { rawContent: article.llm_analysis, formatted: true };
    }

    if (Array.isArray(article.llm_analysis) && article.llm_analysis.length > 0) {
      return { trading_signals: article.llm_analysis, formatted: false };
    }

    return { rawContent: JSON.stringify(article.llm_analysis, null, 2), formatted: true };
  };

  // Simplified date formatter
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

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'signals', label: 'Trading Signals', icon: TrendingUp },
    { id: 'analysis', label: 'AI Analysis', icon: Brain },
    { id: 'market', label: 'Market Data', icon: Activity },
    { id: 'discussion', label: 'AI Panel', icon: Users }
  ] as const;

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
                <LoadingSkeleton />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <LoadingSkeleton />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <LoadingSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Article not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/feed"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  const parsedAnalysis = getParsedAnalysis();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Modern Header with Navigation and Quick Actions */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Navigation */}
            <div className="flex items-center gap-4">
              <Link
                to="/feed"
                className="inline-flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Feed</span>
              </Link>

              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 dark:text-gray-400">Article</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">
                  {article.title.substring(0, 50)}...
                </span>
              </div>
            </div>

            {/* Right side - Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-all ${
                  isBookmarked
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
                <Share2 className="w-5 h-5" />
              </button>

              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
                <Bell className="w-5 h-5" />
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => setIsChatExpanded(!isChatExpanded)}
                className={`p-2 rounded-lg transition-all ${
                  isChatExpanded
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
          isChatExpanded ? 'lg:grid-cols-4' : 'lg:grid-cols-1'
        }`}>
          {/* Main Content Area */}
          <div className={`${isChatExpanded ? 'lg:col-span-3' : 'lg:col-span-1'}`}>

            {/* Article Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6"
            >
              <div className="p-6">
                {/* Article Title */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {article.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(article.publishedAt || article.published_at || article.createdAt)}</span>
                  </div>

                  {article.source && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <span>{typeof article.source === 'string' ? article.source : article.source.name}</span>
                    </div>
                  )}

                  {article.sentiment && (
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span className={`font-medium ${
                        (typeof article.sentiment === 'string' ? article.sentiment : article.sentiment.label || '').toLowerCase().includes('bullish')
                          ? 'text-green-600 dark:text-green-400'
                          : (typeof article.sentiment === 'string' ? article.sentiment : article.sentiment.label || '').toLowerCase().includes('bearish')
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {typeof article.sentiment === 'string' ? article.sentiment : article.sentiment.label || 'Neutral'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tickers */}
                {article.tickers && article.tickers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {article.tickers.filter((ticker, index, self) => ticker && self.indexOf(ticker) === index).map(ticker => (
                      <span key={ticker} className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-semibold">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {ticker}
                      </span>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {article.description && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Summary</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = selectedTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id as any)}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                          isActive
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {selectedTab === 'overview' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="space-y-6">
                      {/* Article Content */}
                      {(article.full_article || article.content) && article.content !== article.description && (
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Full Article</h2>
                          <div
                            className="prose prose-gray dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: article.full_article || article.content || ''
                            }}
                          />
                        </div>
                      )}

                      {/* Article Details */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Article Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {article.market_type && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Market Type:</span>
                              <span className="font-medium text-gray-900 dark:text-white capitalize">
                                {article.market_type}
                              </span>
                            </div>
                          )}
                          {(article as any).impact_level && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Impact Level:</span>
                              <span className={`font-medium capitalize ${
                                (article as any).impact_level === 'high'
                                  ? 'text-red-600 dark:text-red-400'
                                  : (article as any).impact_level === 'medium'
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {(article as any).impact_level}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Generate Analysis */}
                      {!article.llm_analysis && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                          <div className="text-center">
                            <Brain className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Generate AI Trading Analysis
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              Get comprehensive trading insights, signals, and market analysis powered by AI
                            </p>
                            <button
                              onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: false })}
                              disabled={generateAnalysisMutation.isPending}
                              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {generateAnalysisMutation.isPending ? (
                                <>
                                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                                  Generating Analysis...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  Generate AI Analysis
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'signals' && (
                  <div className="space-y-6">
                    {!isFinanceArticle() ? (
                      // Non-financial article message
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Not a Financial Article
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          This article doesn't appear to be about financial markets or trading.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Trading signals are only available for finance-related news articles.
                        </p>
                      </div>
                    ) : parsedAnalysis?.trading_signals ? (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Signals</h2>
                          <button
                            onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: true })}
                            disabled={generateAnalysisMutation.isPending}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Signals
                          </button>
                        </div>

                        {(() => {
                          // First check if we have trading_signals in parsed analysis
                          let signals = [];

                          if (parsedAnalysis.trading_signals) {
                            signals = Array.isArray(parsedAnalysis.trading_signals)
                              ? parsedAnalysis.trading_signals
                              : [parsedAnalysis.trading_signals];
                          }
                          // Also check for article.trading_analysis
                          else if (article.trading_analysis?.recommendations) {
                            signals = article.trading_analysis.recommendations;
                          }

                          const validSignals = signals.filter((signal: any) => {
                            // Filter out mock tickers but keep all real ones
                            const ticker = signal.ticker || signal.symbol || '';
                            const mockTickers = ['MOCK', 'TEST', 'EXAMPLE', 'DEMO'];

                            // Allow any ticker that matches stock pattern and isn't explicitly mock
                            return ticker && !mockTickers.includes(ticker.toUpperCase());
                          });

                          if (validSignals.length > 0) {
                            return (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {validSignals.map((signal: any, index: number) => {
                              // Transform the signal data to match the expected format
                              // Handle both nested (trading_signal) and flat structures
                              const formattedSignal = {
                                ticker: signal.ticker || signal.symbol || 'N/A',
                                action: signal.trading_signal?.action ||
                                       signal.trading_signal?.recommendation ||
                                       signal.action ||
                                       signal.recommendation ||
                                       'HOLD',
                                confidence: signal.trading_signal?.confidence_level ||
                                           signal.confidence_level ||
                                           signal.confidence ||
                                           '5',
                                entry: signal.trading_signal?.entry_points?.ideal ||
                                      signal.trading_signal?.entry_price ||
                                      signal.entry_points?.ideal ||
                                      signal.entry ||
                                      'Market',
                                stopLoss: signal.trading_signal?.stop_loss ||
                                         signal.stop_loss ||
                                         signal.stopLoss ||
                                         'N/A',
                                takeProfit: signal.trading_signal?.take_profit ||
                                           signal.take_profit ||
                                           signal.takeProfit ||
                                           'N/A',
                                horizon: signal.trading_signal?.time_horizon ||
                                        signal.time_horizon ||
                                        signal.horizon ||
                                        'Short-term',
                                risk: signal.trading_signal?.risk_assessment?.level ||
                                     signal.risk_assessment ||
                                     signal.risk ||
                                     'Medium',
                                catalyst: signal.trading_signal?.catalyst_analysis ||
                                         signal.catalyst_analysis ||
                                         signal.catalyst ||
                                         null
                              };
                              return (
                                <TradingSignalCard
                                  key={index}
                                  signal={formattedSignal}
                                  onQuickTrade={handleQuickTrade}
                                />
                                  );
                                })}
                              </div>
                            );
                          } else {
                            // No valid signals after filtering
                            return (
                              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                                <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                  No Real Trading Signals Available
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                  The analysis contains only demo or test data.
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  Please try with a real financial news article to get actual trading signals.
                                </p>
                              </div>
                            );
                          }
                        })()}
                      </>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          No Trading Signals Available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Generate AI analysis to get personalized trading signals and recommendations
                        </p>
                        <button
                          onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: false })}
                          disabled={generateAnalysisMutation.isPending}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {generateAnalysisMutation.isPending ? (
                            <>
                              <Loader className="w-5 h-5 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              Generate Trading Signals
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'analysis' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Brain className="w-6 h-6 text-blue-500" />
                          AI Analysis
                        </h2>
                        <button
                          onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: true })}
                          disabled={generateAnalysisMutation.isPending}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {parsedAnalysis ? (
                        <div>
                          {parsedAnalysis.trading_signals && Array.isArray(parsedAnalysis.trading_signals) ? (
                            // Show trading signals as cards in AI Analysis tab
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Trading Analysis Summary
                              </h3>
                              <div className="grid grid-cols-1 gap-4">
                                {parsedAnalysis.trading_signals
                                  .filter((signal: any) => {
                                    // Filter out mock tickers but allow all real ones
                                    const ticker = signal.ticker || signal.symbol || '';
                                    const mockTickers = ['MOCK', 'TEST', 'EXAMPLE', 'DEMO'];
                                    // Allow any ticker that exists and isn't explicitly mock
                                    return ticker && !mockTickers.includes(ticker.toUpperCase());
                                  })
                                  .map((signal: any, index: number) => (
                                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                          ${signal.ticker || signal.symbol || 'N/A'}
                                        </h4>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                          signal.trading_signal?.action === 'BUY' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                          signal.trading_signal?.action === 'SELL' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                        }`}>
                                          {signal.trading_signal?.action || 'HOLD'}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        {signal.trading_signal?.confidence_level && (
                                          <div>
                                            <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                                            <span className="ml-2 font-medium">{signal.trading_signal.confidence_level}/10</span>
                                          </div>
                                        )}
                                        {signal.trading_signal?.time_horizon && (
                                          <div>
                                            <span className="text-gray-500 dark:text-gray-400">Horizon:</span>
                                            <span className="ml-2 font-medium capitalize">{signal.trading_signal.time_horizon}</span>
                                          </div>
                                        )}
                                      </div>

                                      {signal.trading_signal?.catalyst_analysis && (
                                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                          <strong>Analysis:</strong> {
                                            typeof signal.trading_signal.catalyst_analysis === 'string'
                                              ? signal.trading_signal.catalyst_analysis
                                              : typeof signal.trading_signal.catalyst_analysis === 'object' && signal.trading_signal.catalyst_analysis.potential_drivers
                                              ? signal.trading_signal.catalyst_analysis.potential_drivers
                                              : JSON.stringify(signal.trading_signal.catalyst_analysis)
                                          }
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>

                              {/* Show warning only if ALL signals are explicitly mock/demo */}
                              {parsedAnalysis.trading_signals.length > 0 &&
                               parsedAnalysis.trading_signals.every((signal: any) => {
                                const ticker = signal.ticker || signal.symbol || '';
                                const mockTickers = ['MOCK', 'TEST', 'EXAMPLE', 'DEMO', 'CYBERSEC', 'TECHGROW'];
                                return mockTickers.includes(ticker.toUpperCase()) ||
                                       ticker.toLowerCase().includes('test') ||
                                       ticker.toLowerCase().includes('demo');
                              }) && (
                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                    <strong>Note:</strong> This analysis contains demo data. For real trading signals, please analyze actual financial news articles.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : parsedAnalysis.rawContent ? (
                            // Show raw content if no structured signals
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                              <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                {parsedAnalysis.rawContent}
                              </pre>
                            </div>
                          ) : (
                            // Show JSON as last resort
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                              <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                {JSON.stringify(parsedAnalysis, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No AI Analysis Available
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Generate comprehensive AI analysis for this article
                          </p>
                          <button
                            onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: false })}
                            disabled={generateAnalysisMutation.isPending}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {generateAnalysisMutation.isPending ? (
                              <>
                                <Loader className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Generate Analysis
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'market' && article.tickers && article.tickers.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-green-500" />
                        Market Data - {article.tickers[0]}
                      </h2>
                    </div>

                    <div className="p-6">
                      {(() => {
                        console.log('📈 Checking Polygon data:', {
                          hasLLMAnalysis: !!article.llm_analysis,
                          hasPolygonData: !!article.llm_analysis?.polygon_data,
                          polygonData: article.llm_analysis?.polygon_data
                        });
                        return article.llm_analysis?.polygon_data;
                      })() ? (
                        <PolygonDataCardFixed
                          polygonData={article.llm_analysis?.polygon_data!}
                          ticker={article.tickers[0]}
                        />
                      ) : article.llm_analysis?.technical_analysis || parsedAnalysis?.technical_analysis ? (
                        // Show technical analysis if available but no polygon data
                        <div className="space-y-6">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technical Analysis</h3>
                            {(article.llm_analysis?.technical_analysis || parsedAnalysis?.technical_analysis) && (
                              <div className="space-y-3">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Trend: </span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {article.llm_analysis?.technical_analysis?.trend || parsedAnalysis?.technical_analysis?.trend || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Outlook: </span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {article.llm_analysis?.technical_analysis?.outlook || parsedAnalysis?.technical_analysis?.outlook || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {!article.llm_analysis?.polygon_data && (
                            <div className="text-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Real-time market data not available. Generate fresh analysis to include live data.
                              </p>
                              <button
                                onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: true })}
                                disabled={generateAnalysisMutation.isPending}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                              >
                                {generateAnalysisMutation.isPending ? (
                                  <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                                    Refreshing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Refresh with Live Data
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No Market Data Available
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Generate analysis with real-time market data
                          </p>
                          <button
                            onClick={() => {
                              generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: true });
                            }}
                            disabled={generateAnalysisMutation.isPending}
                            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {generateAnalysisMutation.isPending ? (
                              <>
                                <Loader className="w-5 h-5 mr-2 animate-spin" />
                                Loading Data...
                              </>
                            ) : (
                              <>
                                <Activity className="w-5 h-5 mr-2" />
                                Load Market Data
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'discussion' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-500" />
                        AI Panel Discussion
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Multiple AI perspectives analyzing this article
                      </p>
                    </div>

                    <div className="p-6">
                      <LLMPanelDiscussionV2
                        articleId={articleId!}
                        articleTitle={article.title}
                        tickers={article.tickers}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Chat Sidebar */}
          {isChatExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-8rem)] sticky top-24">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-500" />
                      AI Assistant
                    </h3>
                    <button
                      onClick={() => setIsChatExpanded(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="h-[calc(100%-4rem)]">
                  <ChatWidget articleId={articleId!} integrated={true} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailClean;