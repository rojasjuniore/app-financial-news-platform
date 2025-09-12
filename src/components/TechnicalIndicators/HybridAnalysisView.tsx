import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain,
  Zap,
  Mic,
  Volume2,
  Maximize2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  AlertCircle,
  Target,
  Layers
} from 'lucide-react';
import TradingViewWidget from '../TradingWidget/TradingViewWidget';
import { IndicatorsWidget } from './';

interface MarketData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  rsi: number;
  sma20: number;
  sma50: number;
  volume: number;
  marketCap: number;
  signals: {
    overall: 'bullish' | 'bearish' | 'neutral';
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface HybridAnalysisViewProps {
  ticker: string;
  onTickerChange: (ticker: string) => void;
  onVoiceQuery?: (query: string) => void;
}

const HybridAnalysisView: React.FC<HybridAnalysisViewProps> = ({
  ticker,
  onTickerChange,
  onVoiceQuery
}) => {
  const [layout, setLayout] = useState<'split' | 'chart-focus' | 'indicators-focus'>('split');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [lastVoiceResult, setLastVoiceResult] = useState('');

  // Simulate voice integration
  const handleVoiceQuery = async (query: string) => {
    setIsVoiceActive(true);
    setVoiceQuery(query);
    
    // Simulate voice processing
    setTimeout(() => {
      const mockResults = {
        'rsi': `El RSI de ${ticker} es ${Math.round(Math.random() * 100)}, indica ${Math.random() > 0.5 ? 'sobrecompra' : 'sobreventa'}`,
        'precio': `${ticker} está cotizando a $${(Math.random() * 500 + 100).toFixed(2)}`,
        'macd': `El MACD de ${ticker} es ${Math.random() > 0.5 ? 'positivo - tendencia alcista' : 'negativo - tendencia bajista'}`,
        'indicadores': `${ticker}: RSI ${Math.round(Math.random() * 100)}, SMA20 $${(Math.random() * 300 + 150).toFixed(2)}, señal ${Math.random() > 0.5 ? 'alcista' : 'bajista'}`
      };
      
      const queryKey = Object.keys(mockResults).find(key => query.toLowerCase().includes(key)) || 'indicadores';
      setLastVoiceResult(mockResults[queryKey as keyof typeof mockResults]);
      setIsVoiceActive(false);
      onVoiceQuery?.(query);
    }, 2000);
  };

  const quickVoiceQueries = [
    { label: 'RSI', query: `¿Cuál es el RSI de ${ticker}?` },
    { label: 'Precio', query: `¿Cuál es el precio actual de ${ticker}?` },
    { label: 'MACD', query: `Analiza el MACD de ${ticker}` },
    { label: 'Señales', query: `¿Qué señales muestra ${ticker}?` }
  ];

  const getLayoutClasses = () => {
    switch (layout) {
      case 'chart-focus':
        return 'grid-cols-3 grid-rows-2';
      case 'indicators-focus':
        return 'grid-cols-3 grid-rows-2';
      default:
        return 'grid-cols-2 grid-rows-2';
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="bg-gradient-to-r from-slate-800/50 to-purple-900/20 rounded-xl p-4 border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Vista Híbrida - {ticker}</h3>
            </div>
            
            {/* Layout Selector */}
            <div className="flex bg-black/30 rounded-lg p-1">
              <button
                onClick={() => setLayout('split')}
                className={`px-3 py-1.5 rounded-md transition-all text-xs ${
                  layout === 'split' 
                    ? 'bg-purple-500/30 text-purple-300' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 inline mr-1" />
                Split
              </button>
              <button
                onClick={() => setLayout('chart-focus')}
                className={`px-3 py-1.5 rounded-md transition-all text-xs ${
                  layout === 'chart-focus' 
                    ? 'bg-purple-500/30 text-purple-300' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3 h-3 inline mr-1" />
                Gráfico
              </button>
              <button
                onClick={() => setLayout('indicators-focus')}
                className={`px-3 py-1.5 rounded-md transition-all text-xs ${
                  layout === 'indicators-focus' 
                    ? 'bg-purple-500/30 text-purple-300' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3 inline mr-1" />
                Indicadores
              </button>
            </div>
          </div>

          {/* Voice Controls */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {quickVoiceQueries.map((q, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVoiceQuery(q.query)}
                  disabled={isVoiceActive}
                  className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-md border border-purple-500/30 text-purple-300 text-xs transition-all"
                >
                  {q.label}
                </motion.button>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVoiceQuery(`Analiza ${ticker} completamente`)}
              disabled={isVoiceActive}
              className={`p-2 rounded-lg border transition-all ${
                isVoiceActive 
                  ? 'bg-red-500/20 border-red-500/30 text-red-300 animate-pulse' 
                  : 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30 text-purple-300'
              }`}
            >
              {isVoiceActive ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <Mic className="w-4 h-4" />
                </div>
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Voice Result Display */}
        {(voiceQuery || lastVoiceResult) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-black/30 rounded-lg border border-purple-500/10"
          >
            {isVoiceActive ? (
              <div className="flex items-center gap-2 text-purple-300">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-sm">Analizando: "{voiceQuery}"</span>
              </div>
            ) : lastVoiceResult ? (
              <div className="flex items-start gap-2">
                <Volume2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">{lastVoiceResult}</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className={`grid ${getLayoutClasses()} gap-4 h-[calc(100vh-300px)]`}>
        {/* TradingView Chart */}
        <div className={`${
          layout === 'chart-focus' ? 'col-span-2 row-span-2' : 
          layout === 'indicators-focus' ? 'col-span-1' : 'col-span-1 row-span-2'
        }`}>
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl p-4 border border-purple-500/20 shadow-xl backdrop-blur-sm h-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Gráfico Profesional</h4>
              <div className="flex items-center gap-2 text-sm text-purple-300">
                <Zap className="w-4 h-4" />
                TradingView
              </div>
            </div>
            <div className="h-[calc(100%-50px)]">
              <TradingViewWidget
                symbol={`NASDAQ:${ticker}`}
                height={400}
                width="100%"
                theme="Dark"
                style="candles"
                studies={['RSI', 'MACD', 'BB']}
                locale="es"
                hideTopToolbar={false}
                allowSymbolChange={false}
              />
            </div>
          </div>
        </div>

        {/* Technical Indicators */}
        <div className={`${
          layout === 'indicators-focus' ? 'col-span-2 row-span-2' : 
          layout === 'chart-focus' ? 'col-span-1' : 'col-span-1 row-span-2'
        }`}>
          <IndicatorsWidget 
            ticker={ticker}
            onTickerChange={onTickerChange}
          />
        </div>

        {/* Quick Stats Panel (only in split mode) */}
        {layout === 'split' && (
          <div className="col-span-2 row-span-1">
            <div className="bg-gradient-to-r from-slate-800/50 to-purple-900/20 rounded-xl p-4 border border-purple-500/20 backdrop-blur-sm h-full">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Resumen Rápido - {ticker}
                </h4>
                <div className="text-xs text-purple-300">Actualizado hace 1 min</div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">$230.03</div>
                  <div className="text-xs text-gray-400">Precio Actual</div>
                  <div className="text-sm text-green-400 flex items-center justify-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +1.43%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">84.1</div>
                  <div className="text-xs text-gray-400">RSI (14)</div>
                  <div className="text-xs text-red-300 mt-1">Sobrecompra</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">+14.8</div>
                  <div className="text-xs text-gray-400">MACD</div>
                  <div className="text-xs text-green-300 mt-1">Alcista</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">ALTO</div>
                  <div className="text-xs text-gray-400">Riesgo</div>
                  <div className="text-xs text-yellow-300 flex items-center justify-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    Precaución
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-purple-500/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Señal General:</span>
                  <div className="flex items-center gap-2 text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">BULLISH</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Recomendación:</span>
                  <span className="text-yellow-300">Considerar toma de ganancias</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HybridAnalysisView;