import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Brain,
  LineChart,
  PieChart,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Plus,
  X
} from 'lucide-react';
import { IndicatorsWidget } from '../components/TechnicalIndicators';
import TradingViewWidget from '../components/TradingWidget/TradingViewWidget';
import HybridAnalysisView from '../components/TechnicalIndicators/HybridAnalysisView';

interface WatchlistStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  rsi: number;
  signal: 'bullish' | 'bearish' | 'neutral';
}

const TechnicalAnalysis: React.FC = () => {
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<'indicators' | 'chart' | 'hybrid'>('hybrid'); // Híbrido por defecto
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([
    { ticker: 'AAPL', name: 'Apple Inc.', price: 230.03, change: 3.24, changePercent: 1.43, rsi: 84.1, signal: 'bullish' },
    { ticker: 'TSLA', name: 'Tesla Inc.', price: 368.81, change: 21.02, changePercent: 6.04, rsi: 72.3, signal: 'bullish' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 875.50, change: -12.30, changePercent: -1.39, rsi: 45.2, signal: 'neutral' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', price: 425.20, change: 8.50, changePercent: 2.04, rsi: 65.8, signal: 'bullish' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 168.90, change: -2.10, changePercent: -1.23, rsi: 38.5, signal: 'bearish' }
  ]);
  const [newTicker, setNewTicker] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      refreshWatchlist();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshWatchlist = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setWatchlist(prev => prev.map(stock => ({
        ...stock,
        price: stock.price + (Math.random() - 0.5) * 10,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 5,
        rsi: Math.max(0, Math.min(100, stock.rsi + (Math.random() - 0.5) * 10)),
        signal: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral'
      })));
      setIsLoading(false);
    }, 1000);
  };

  const addToWatchlist = () => {
    if (newTicker && !watchlist.find(s => s.ticker === newTicker.toUpperCase())) {
      const mockStock: WatchlistStock = {
        ticker: newTicker.toUpperCase(),
        name: `${newTicker.toUpperCase()} Corp.`,
        price: Math.random() * 500 + 50,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 5,
        rsi: Math.random() * 100,
        signal: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral'
      };
      setWatchlist(prev => [...prev, mockStock]);
      setNewTicker('');
    }
  };

  const removeFromWatchlist = (ticker: string) => {
    setWatchlist(prev => prev.filter(s => s.ticker !== ticker));
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'bearish': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-400';
    if (rsi < 30) return 'text-green-400';
    return 'text-blue-400';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Análisis Técnico Profesional</h1>
                <p className="text-purple-300">Dashboard completo de indicadores y gráficos en tiempo real</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Selector */}
              <div className="flex bg-black/30 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('indicators')}
                  className={`px-4 py-2 rounded-md transition-all text-sm ${
                    activeView === 'indicators' 
                      ? 'bg-purple-500/30 text-purple-300' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-2" />
                  Indicadores
                </button>
                <button
                  onClick={() => setActiveView('chart')}
                  className={`px-4 py-2 rounded-md transition-all text-sm ${
                    activeView === 'chart' 
                      ? 'bg-purple-500/30 text-purple-300' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LineChart className="w-4 h-4 inline mr-2" />
                  Gráfico
                </button>
                <button
                  onClick={() => setActiveView('hybrid')}
                  className={`px-4 py-2 rounded-md transition-all text-sm ${
                    activeView === 'hybrid' 
                      ? 'bg-purple-500/30 text-purple-300' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Brain className="w-4 h-4 inline mr-2" />
                  Híbrido
                </button>
              </div>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshWatchlist}
                disabled={isLoading}
                className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-purple-500/30 text-purple-300 transition-all"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>

              {/* Fullscreen Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-purple-500/30 text-purple-300 transition-all"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Watchlist Sidebar */}
          <div className="col-span-3">
            <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/20 rounded-xl p-4 border border-purple-500/20 backdrop-blur-sm h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Watchlist
                </h3>
                <span className="text-sm text-purple-300">{watchlist.length} stocks</span>
              </div>

              {/* Add New Stock */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                    placeholder="Agregar ticker..."
                    className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white text-sm placeholder-gray-400"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addToWatchlist}
                    className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-purple-500/30 text-purple-300 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Stock List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {watchlist.map((stock) => (
                  <motion.div
                    key={stock.ticker}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedTicker(stock.ticker)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTicker === stock.ticker
                        ? 'bg-purple-500/20 border-purple-500/40'
                        : 'bg-black/30 border-purple-500/10 hover:bg-purple-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{stock.ticker}</span>
                        <div className={`px-2 py-1 rounded-full text-xs border ${getSignalColor(stock.signal)}`}>
                          {stock.signal}
                        </div>
                      </div>
                      {watchlist.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(stock.ticker);
                          }}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 mb-2">{stock.name}</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-white">${stock.price.toFixed(2)}</div>
                        <div className={`text-sm flex items-center gap-1 ${
                          stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">RSI</div>
                        <div className={`text-sm font-semibold ${getRSIColor(stock.rsi)}`}>
                          {stock.rsi.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <AnimatePresence mode="wait">
              {activeView === 'indicators' && (
                <motion.div
                  key="indicators"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <IndicatorsWidget 
                    ticker={selectedTicker}
                    onTickerChange={setSelectedTicker}
                  />
                </motion.div>
              )}

              {activeView === 'chart' && (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-6 border border-purple-500/20 shadow-2xl backdrop-blur-sm h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{selectedTicker} - Gráfico Profesional</h3>
                      <div className="flex items-center gap-2 text-sm text-purple-300">
                        <Zap className="w-4 h-4" />
                        TradingView
                      </div>
                    </div>
                    <div className="h-96">
                      <TradingViewWidget
                        symbol={`NASDAQ:${selectedTicker}`}
                        height={400}
                        theme="Dark"
                        style="candles"
                        studies={['RSI', 'MACD', 'BB']}
                        locale="es"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'hybrid' && (
                <motion.div
                  key="hybrid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <HybridAnalysisView
                    ticker={selectedTicker}
                    onTickerChange={setSelectedTicker}
                    onVoiceQuery={(query) => console.log('Voice query:', query)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <button className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg text-white hover:shadow-xl transition-all">
          <Settings className="w-6 h-6" />
        </button>
      </motion.div>
    </div>
  );
};

export default TechnicalAnalysis;