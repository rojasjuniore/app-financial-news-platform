import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Coins,
  Globe,
  Zap,
  RefreshCw,
  Maximize2,
  Minimize2,
  Target,
  Plus,
  X
} from 'lucide-react';
import PreciousMetalsWidget from '../components/TradingWidget/PreciousMetalsWidget';
import TradingViewWidget from '../components/TradingWidget/TradingViewWidget';

interface ForexPair {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

interface MetalPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
}

const ForexMetals: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('TVC:GOLD');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<'metals' | 'forex' | 'combined'>('metals');
  
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([
    { symbol: 'EURUSD', name: 'Euro / Dólar', price: 1.0856, change: 0.0023, changePercent: 0.21, trend: 'bullish' },
    { symbol: 'GBPUSD', name: 'Libra / Dólar', price: 1.2634, change: -0.0045, changePercent: -0.35, trend: 'bearish' },
    { symbol: 'USDJPY', name: 'Dólar / Yen', price: 149.82, change: 0.67, changePercent: 0.45, trend: 'bullish' },
    { symbol: 'USDMXN', name: 'Dólar / Peso MX', price: 17.45, change: -0.12, changePercent: -0.68, trend: 'bearish' },
    { symbol: 'USDEUR', name: 'Dólar / Euro', price: 0.9211, change: -0.0019, changePercent: -0.21, trend: 'bearish' }
  ]);

  const [metalPrices, setMetalPrices] = useState<MetalPrice[]>([
    { symbol: 'TVC:GOLD', name: 'Oro', price: 2045.30, change: 12.40, changePercent: 0.61, unit: 'USD/oz' },
    { symbol: 'TVC:SILVER', name: 'Plata', price: 24.85, change: -0.23, changePercent: -0.92, unit: 'USD/oz' },
    { symbol: 'NYMEX:PL1!', name: 'Platino', price: 895.50, change: 4.20, changePercent: 0.47, unit: 'USD/oz' },
    { symbol: 'COMEX:HG1!', name: 'Cobre', price: 3.756, change: -0.034, changePercent: -0.89, unit: 'USD/lb' }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Simular actualización de datos
      setTimeout(() => {
        setForexPairs(prev => prev.map(pair => ({
          ...pair,
          price: pair.price + (Math.random() - 0.5) * 0.01,
          change: (Math.random() - 0.5) * 0.02,
          changePercent: (Math.random() - 0.5) * 1,
          trend: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral'
        })));

        setMetalPrices(prev => prev.map(metal => ({
          ...metal,
          price: metal.price + (Math.random() - 0.5) * 20,
          change: (Math.random() - 0.5) * 30,
          changePercent: (Math.random() - 0.5) * 2
        })));
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setIsLoading(false);
    }
  };

  const getSignalColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'bearish': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  const addToWatchlist = () => {
    if (newSymbol) {
      // Lógica para agregar nuevo símbolo
      console.log('Adding symbol:', newSymbol);
      setNewSymbol('');
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="border-b border-yellow-500/20 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Coins className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Forex & Metales Preciosos</h1>
                <p className="text-yellow-300">Trading profesional de divisas y materias primas</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Selector */}
              <div className="flex bg-black/30 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('metals')}
                  className={`px-4 py-2 rounded-md transition-all text-sm ${
                    activeView === 'metals' 
                      ? 'bg-yellow-500/30 text-yellow-300' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Coins className="w-4 h-4 inline mr-2" />
                  Metales
                </button>
                <button
                  onClick={() => setActiveView('forex')}
                  className={`px-4 py-2 rounded-md transition-all text-sm ${
                    activeView === 'forex' 
                      ? 'bg-yellow-500/30 text-yellow-300' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4 inline mr-2" />
                  Forex
                </button>
                <button
                  onClick={() => setActiveView('combined')}
                  className={`px-4 py-2 rounded-md transition-all text-sm ${
                    activeView === 'combined' 
                      ? 'bg-yellow-500/30 text-yellow-300' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Combinado
                </button>
              </div>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshData}
                disabled={isLoading}
                className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg border border-yellow-500/30 text-yellow-300 transition-all"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>

              {/* Fullscreen Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg border border-yellow-500/30 text-yellow-300 transition-all"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Sidebar - Metales Preciosos */}
          <div className="col-span-3">
            <div className="bg-gradient-to-br from-slate-800/50 to-yellow-900/20 rounded-xl p-4 border border-yellow-500/20 backdrop-blur-sm h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-400" />
                  Metales Preciosos
                </h3>
                <span className="text-sm text-yellow-300">{metalPrices.length} instrumentos</span>
              </div>

              {/* Metal Prices List */}
              <div className="space-y-2 mb-6">
                {metalPrices.map((metal) => (
                  <motion.div
                    key={metal.symbol}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedSymbol(metal.symbol)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSymbol === metal.symbol
                        ? 'bg-yellow-500/20 border-yellow-500/40'
                        : 'bg-black/30 border-yellow-500/10 hover:bg-yellow-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{metal.name}</span>
                      <div className="text-xs text-gray-400">{metal.unit}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-white">
                          ${metal.price.toFixed(2)}
                        </div>
                        <div className={`text-sm flex items-center gap-1 ${
                          metal.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {metal.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {metal.change >= 0 ? '+' : ''}{metal.change.toFixed(2)} ({metal.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Forex Pairs Section */}
              <div className="border-t border-yellow-500/20 pt-4">
                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-yellow-400" />
                  Pares de Divisas
                </h4>
                
                <div className="space-y-2">
                  {forexPairs.slice(0, 3).map((pair) => (
                    <div
                      key={pair.symbol}
                      className="p-2 bg-black/30 rounded-lg border border-yellow-500/10"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white font-medium">{pair.name}</span>
                        <div className={`px-2 py-1 rounded-full text-xs border ${getSignalColor(pair.trend)}`}>
                          {pair.trend}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-white font-bold">{pair.price.toFixed(4)}</span>
                        <span className={`text-xs ${pair.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pair.change >= 0 ? '+' : ''}{pair.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <AnimatePresence mode="wait">
              {activeView === 'metals' && (
                <motion.div
                  key="metals"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <PreciousMetalsWidget
                    symbol={selectedSymbol}
                    height={600}
                    theme="Dark"
                    locale="es"
                    showAnalysis={true}
                  />
                </motion.div>
              )}

              {activeView === 'forex' && (
                <motion.div
                  key="forex"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-6 border border-blue-500/20 shadow-2xl backdrop-blur-sm h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">EUR/USD - Par Principal</h3>
                      <div className="flex items-center gap-2 text-sm text-blue-300">
                        <Zap className="w-4 h-4" />
                        TradingView Forex
                      </div>
                    </div>
                    <div className="h-96">
                      <TradingViewWidget
                        symbol="FX_IDC:EURUSD"
                        height={500}
                        theme="Dark"
                        style="candles"
                        studies={['RSI', 'MACD', 'EMA']}
                        locale="es"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'combined' && (
                <motion.div
                  key="combined"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Top - Metals Widget */}
                  <div className="h-80">
                    <PreciousMetalsWidget
                      symbol={selectedSymbol}
                      height={300}
                      theme="Dark"
                      locale="es"
                      showAnalysis={true}
                    />
                  </div>

                  {/* Bottom - Forex Widget */}
                  <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-6 border border-blue-500/20 shadow-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">EUR/USD - Análisis Forex</h3>
                      <div className="flex items-center gap-2 text-sm text-blue-300">
                        <Globe className="w-4 h-4" />
                        Vista Combinada
                      </div>
                    </div>
                    <div className="h-64">
                      <TradingViewWidget
                        symbol="FX_IDC:EURUSD"
                        height={256}
                        theme="Dark"
                        style="candles"
                        studies={['RSI', 'MACD']}
                        locale="es"
                        hideTopToolbar={false}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForexMetals;