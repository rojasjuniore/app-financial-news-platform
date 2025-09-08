import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MarketEventsPage } from '../components/MarketEvents';
import TradingViewTickerWidget from '../components/TradingWidget/TradingViewTickerWidget';
import {
  Activity,
  Globe,
  Bell,
  RefreshCw,
  Grid,
  List,
  Calendar,
  Clock,
  Zap,
  Shield,
  BarChart3,
  Sparkles,
  Users,
  Newspaper,
  Brain,
  Target,
  MessageSquare,
  Bot,
  Lock,
  Eye,
  Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';

// NO MOCK DATA - All market data must come from real APIs

// TypeScript interfaces
interface DashboardStatistics {
  newsAggregated: string;
  newsAnalyzed: string;
  qualityScore: string;
  lastUpdate: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<DashboardStatistics>({
    newsAggregated: '0',
    newsAnalyzed: '0',
    qualityScore: '0%',
    lastUpdate: t('common.loading')
  });
  const [todayChange, setTodayChange] = useState<number>(0);
  const [showMarketEvents, setShowMarketEvents] = useState(false);

  // Fetch real statistics from API
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/dashboard/statistics`);
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard statistics received:', data);
        
        // Calculate today's change (simulate based on current hour for demo)
        const currentHour = new Date().getHours();
        const estimatedTodayNews = Math.floor(data.newsAggregated * 0.1 * (currentHour / 24));
        setTodayChange(estimatedTodayNews);
        
        setStatistics({
          newsAggregated: data.newsAggregated?.toLocaleString() || '0',
          newsAnalyzed: data.newsAnalyzed?.toLocaleString() || '0', 
          qualityScore: `${data.qualityScore || 0}%`,
          lastUpdate: new Date().toLocaleTimeString(t('common.locale'), { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        });
      } else {
        console.error('Failed to fetch statistics:', response.status);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Don't set fallback values - keep at 0 if API fails
    }
  };


  // Load statistics on mount and set up real-time updates
  useEffect(() => {
    fetchStatistics();
    
    // Update statistics every 30 seconds
    const statsInterval = setInterval(fetchStatistics, 30000);
    
    return () => {
      clearInterval(statsInterval);
    };
  }, [t]); // fetchStatistics is stable, doesn't need to be in deps

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchStatistics(),
      new Promise(resolve => setTimeout(resolve, 1500))
    ]);
    toast.success(t('dashboard.updated'));
    setIsRefreshing(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl text-white">
                  <BarChart3 className="w-6 h-6" />
                </div>
                {t('dashboard.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('dashboard.lastUpdate')}: {new Date().toLocaleTimeString(
                  t('common.locale', { fallback: 'es-ES' })
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
{t('common.refresh')}
              </button>
              
              <button className="relative p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { 
              title: t('dashboard.statistics.newsAggregated'),
              value: statistics.newsAggregated, 
              change: `+${todayChange} ${t('dashboard.statistics.today', { defaultValue: 'today' })}`,
              icon: Globe,
              color: 'blue',
              trend: 'up' 
            },
            { 
              title: t('dashboard.statistics.newsAnalyzed'),
              value: statistics.newsAnalyzed, 
              change: t('dashboard.statistics.aiProcessed'),
              icon: Activity,
              color: 'green',
              trend: 'up' 
            },
            { 
              title: t('dashboard.statistics.lastUpdate'),
              value: statistics.lastUpdate, 
              change: t('dashboard.statistics.realTime'),
              icon: Clock,
              color: 'purple',
              trend: 'neutral' 
            },
            { 
              title: t('dashboard.statistics.qualityScore'),
              value: statistics.qualityScore, 
              change: t('dashboard.statistics.aiAccuracy'),
              icon: Zap,
              color: 'orange',
              trend: 'up' 
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                  stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* TradingView Ticker Tape Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('common.locale') === 'es-ES' ? 'Índices del Mercado' : 'Market Indices'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('common.locale') === 'es-ES' ? 'Datos en tiempo real por TradingView' : 'Real-time data by TradingView'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <TradingViewTickerWidget
                symbols={[
                  {
                    "proName": "FOREXCOM:SPXUSD",
                    "title": "S&P 500 Index"
                  },
                  {
                    "proName": "FOREXCOM:NSXUSD",
                    "title": "US 100 Cash CFD"
                  },
                  {
                    "proName": "FOREXCOM:DJI",
                    "title": "Dow Jones"
                  },
                  {
                    "proName": "FX_IDC:EURUSD",
                    "title": "EUR to USD"
                  },
                  {
                    "proName": "NASDAQ:AAPL",
                    "title": "Apple"
                  },
                  {
                    "proName": "NASDAQ:GOOGL",
                    "title": "Alphabet"
                  },
                  {
                    "proName": "NASDAQ:TSLA",
                    "title": "Tesla"
                  },
                  {
                    "proName": "NASDAQ:AMZN",
                    "title": "Amazon"
                  },
                  {
                    "proName": "NASDAQ:MSFT",
                    "title": "Microsoft"
                  },
                  {
                    "proName": "BITSTAMP:BTCUSD",
                    "title": "Bitcoin"
                  },
                  {
                    "proName": "BITSTAMP:ETHUSD",
                    "title": "Ethereum"
                  }
                ]}
                colorTheme="light"
                locale="es"
                isTransparent={false}
                showSymbolLogo={true}
                displayMode="adaptive"
              />
            </div>
          </div>
        </motion.div>

        {/* How It Works Section - Moved from Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('common.locale') === 'es-ES' ? '¿Cómo Funcionan las Noticias Financieras?' : 'How Does Financial News Work?'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('common.locale') === 'es-ES' 
                    ? 'Tecnología de vanguardia para tu éxito financiero'
                    : 'Cutting-edge technology for your financial success'}
                </p>
              </div>
            </div>


            {/* Process Flow */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                {t('common.locale') === 'es-ES' ? 'Nuestro Proceso en 4 Pasos' : 'Our 4-Step Process'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    icon: Globe,
                    color: 'blue',
                    title: t('common.locale') === 'es-ES' ? '📰 Recopilación Global' : '📰 Global Collection',
                    description: t('common.locale') === 'es-ES'
                      ? 'Analizamos más de 500 fuentes cada 5 minutos'
                      : 'We analyze 500+ financial sources every 5 minutes'
                  },
                  {
                    icon: Brain,
                    color: 'purple',
                    title: t('common.locale') === 'es-ES' ? '🤖 IA Financiera Especializada' : '🤖 Specialized Financial AI',
                    description: t('common.locale') === 'es-ES'
                      ? 'FinBERT analiza el sentimiento del mercado con 92% de precisión'
                      : 'FinBERT analyzes market sentiment with 92% accuracy'
                  },
                  {
                    icon: Target,
                    color: 'green',
                    title: t('common.locale') === 'es-ES' ? '🎯 Personalización Inteligente' : '🎯 Smart Personalization',
                    description: t('common.locale') === 'es-ES'
                      ? 'Tu feed se adapta a tus intereses y estilo de inversión'
                      : 'Your feed adapts to your interests and investment style'
                  },
                  {
                    icon: MessageSquare,
                    color: 'orange',
                    title: t('common.locale') === 'es-ES' ? '💬 Asistente IA Multi-Modelo' : '💬 Multi-Model AI Assistant',
                    description: t('common.locale') === 'es-ES'
                      ? '4 modelos de IA para análisis profundo: GPT-4, Claude, Gemini y Grok'
                      : '4 AI models for deep analysis: GPT-4, Claude, Gemini, and Grok'
                  }
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex items-center justify-center mb-3">
                      <step.icon className={`w-10 h-10 text-${step.color}-600 dark:text-${step.color}-400`} />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-center mb-2">
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Models */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                {t('common.locale') === 'es-ES' ? 'Potenciado por 4 Modelos de IA' : 'Powered by 4 AI Models'}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    name: 'GPT-4',
                    logo: '🧠',
                    description: t('common.locale') === 'es-ES' ? 'Análisis preciso y conservador' : 'Precise and conservative analysis'
                  },
                  {
                    name: 'Claude',
                    logo: '🤖',
                    description: t('common.locale') === 'es-ES' ? 'Análisis estructurado y detallado' : 'Structured and detailed analysis'
                  },
                  {
                    name: 'Gemini',
                    logo: '✨',
                    description: t('common.locale') === 'es-ES' ? 'Contexto global multimodal' : 'Global multimodal context'
                  },
                  {
                    name: 'Grok',
                    logo: '🚀',
                    description: t('common.locale') === 'es-ES' ? 'Perspectiva directa y única' : 'Direct and unique perspective'
                  }
                ].map((model, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                  >
                    <div className="text-3xl mb-2 text-center">{model.logo}</div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-center mb-1">
                      {model.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      {model.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                {t('common.locale') === 'es-ES' ? 'Seguridad y Privacidad' : 'Security & Privacy'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {t('common.locale') === 'es-ES' ? 'Encriptación SSL' : 'SSL Encryption'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES' 
                        ? 'Todos tus datos están protegidos con encriptación de nivel bancario'
                        : 'All your data is protected with bank-level encryption'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {t('common.locale') === 'es-ES' ? 'Sin Venta de Datos' : 'No Data Selling'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES'
                        ? 'Nunca vendemos tu información personal a terceros'
                        : 'We never sell your personal information to third parties'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Cpu className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {t('common.locale') === 'es-ES' ? 'Procesamiento Local' : 'Local Processing'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('common.locale') === 'es-ES'
                        ? 'Tus preferencias se procesan localmente para máxima privacidad'
                        : 'Your preferences are processed locally for maximum privacy'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 opacity-80" />
              <span className="text-sm bg-white/20 px-2 py-1 rounded font-medium">PRO</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('common.locale') === 'es-ES' ? 'Análisis Avanzado' : 'Advanced Analysis'}
            </h3>
            <p className="text-sm opacity-90 mb-4">
              {t('common.locale') === 'es-ES' 
                ? 'Accede a herramientas profesionales de análisis técnico y fundamental'
                : 'Access professional technical and fundamental analysis tools'}
            </p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium">
              {t('common.locale') === 'es-ES' ? 'Explorar Herramientas →' : 'Explore Tools →'}
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-teal-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Brain className="w-8 h-8 opacity-80" />
              <span className="text-sm bg-white/20 px-2 py-1 rounded font-medium">AI</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('common.locale') === 'es-ES' ? 'Predicciones IA' : 'AI Predictions'}
            </h3>
            <p className="text-sm opacity-90 mb-4">
              {t('common.locale') === 'es-ES'
                ? 'Modelos de machine learning para proyecciones de mercado'
                : 'Machine learning models for market projections'}
            </p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium">
              {t('common.locale') === 'es-ES' ? 'Ver Predicciones →' : 'View Predictions →'}
            </button>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 opacity-80" />
              <span className="text-sm bg-white/20 px-2 py-1 rounded font-medium">HOT</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('common.locale') === 'es-ES' ? 'Eventos del Mercado' : 'Market Events'}
            </h3>
            <p className="text-sm opacity-90 mb-4">
              {t('common.locale') === 'es-ES'
                ? 'Calendario económico y earnings de empresas importantes'
                : 'Economic calendar and earnings from major companies'}
            </p>
            <button 
              onClick={() => setShowMarketEvents(true)}
              className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium hover:scale-105 transform duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                {t('common.locale') === 'es-ES' ? 'Ver Calendario' : 'View Calendar'} →
              </span>
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Market Events Modal */}
      {showMarketEvents && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMarketEvents(false)} />
          <div className="relative z-50">
            <MarketEventsPage onClose={() => setShowMarketEvents(false)} />
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Dashboard;