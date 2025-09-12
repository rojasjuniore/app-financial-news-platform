import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface TechnicalIndicators {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  rsi: number;
  sma20: number;
  sma50: number;
  macd: {
    macd: number;
    signal: number | null;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  signals: {
    overall: 'bullish' | 'bearish' | 'neutral';
    strength: 'weak' | 'medium' | 'strong';
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  timestamp: string;
}

interface IndicatorsWidgetProps {
  ticker?: string;
  data?: TechnicalIndicators;
  onTickerChange?: (ticker: string) => void;
}

const IndicatorsWidget: React.FC<IndicatorsWidgetProps> = ({
  ticker = 'AAPL',
  data,
  onTickerChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTicker, setCurrentTicker] = useState(ticker);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(data || null);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicators = async (symbol: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // En una implementación real, esto vendría de tu API
      const mockData: TechnicalIndicators = {
        ticker: symbol.toUpperCase(),
        currentPrice: Math.random() * 300 + 100,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        rsi: Math.random() * 100,
        sma20: Math.random() * 250 + 150,
        sma50: Math.random() * 230 + 140,
        macd: {
          macd: (Math.random() - 0.5) * 20,
          signal: (Math.random() - 0.5) * 15,
          histogram: (Math.random() - 0.5) * 5
        },
        bollingerBands: {
          upper: Math.random() * 280 + 180,
          middle: Math.random() * 250 + 160,
          lower: Math.random() * 220 + 140
        },
        signals: {
          overall: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral',
          strength: Math.random() > 0.6 ? 'strong' : Math.random() > 0.3 ? 'medium' : 'weak',
          recommendations: [
            'RSI indica condición de sobrecompra',
            'MACD muestra momentum positivo',
            'Precio cerca de media móvil de 20 días'
          ],
          riskLevel: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'
        },
        timestamp: new Date().toISOString()
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIndicators(mockData);
    } catch (err) {
      setError('Error al cargar indicadores técnicos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentTicker) {
      fetchIndicators(currentTicker);
    }
  }, [currentTicker]);

  const handleTickerChange = (newTicker: string) => {
    setCurrentTicker(newTicker);
    onTickerChange?.(newTicker);
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'bullish': return <TrendingUp className="w-5 h-5" />;
      case 'bearish': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-400';
    if (rsi < 30) return 'text-green-400';
    return 'text-blue-400';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-6 border border-purple-500/20 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Indicadores Técnicos</h3>
            <p className="text-purple-300 text-sm">Análisis técnico en tiempo real</p>
          </div>
        </div>
        
        {/* Ticker Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentTicker}
            onChange={(e) => setCurrentTicker(e.target.value.toUpperCase())}
            onBlur={() => handleTickerChange(currentTicker)}
            onKeyPress={(e) => e.key === 'Enter' && handleTickerChange(currentTicker)}
            className="px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white text-center font-mono uppercase w-20"
            placeholder="TICKER"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchIndicators(currentTicker)}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition-all"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Analizar'
            )}
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8"
          >
            <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-purple-300">Calculando indicadores técnicos...</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8"
          >
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {indicators && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Price Info */}
            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-white">{indicators.ticker}</h4>
                <div className={`flex items-center gap-2 ${getSignalColor(indicators.signals.overall)}`}>
                  {getSignalIcon(indicators.signals.overall)}
                  <span className="font-medium capitalize">{indicators.signals.overall}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-bold text-white">${indicators.currentPrice.toFixed(2)}</p>
                  <div className={`flex items-center gap-1 text-sm ${indicators.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {indicators.change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    <span>{indicators.change >= 0 ? '+' : ''}{indicators.change.toFixed(2)} ({indicators.changePercent.toFixed(2)}%)</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(indicators.signals.riskLevel)} bg-black/20 border border-current/20`}>
                    <AlertTriangle className="w-3 h-3" />
                    Riesgo {indicators.signals.riskLevel.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Indicators Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* RSI */}
              <div className="bg-black/30 rounded-lg p-4 border border-purple-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-300">RSI (14)</span>
                </div>
                <div className={`text-2xl font-bold ${getRSIColor(indicators.rsi)}`}>
                  {indicators.rsi.toFixed(1)}
                </div>
                <div className={`text-xs mt-1 ${getRSIColor(indicators.rsi)}`}>
                  {indicators.rsi > 70 ? 'Sobrecompra' : indicators.rsi < 30 ? 'Sobreventa' : 'Neutral'}
                </div>
              </div>

              {/* SMA 20 */}
              <div className="bg-black/30 rounded-lg p-4 border border-purple-500/10">
                <div className="text-sm text-purple-300 mb-2">SMA 20</div>
                <div className="text-2xl font-bold text-blue-400">${indicators.sma20.toFixed(2)}</div>
                <div className={`text-xs mt-1 ${indicators.currentPrice > indicators.sma20 ? 'text-green-400' : 'text-red-400'}`}>
                  {indicators.currentPrice > indicators.sma20 ? 'Por encima' : 'Por debajo'}
                </div>
              </div>

              {/* SMA 50 */}
              <div className="bg-black/30 rounded-lg p-4 border border-purple-500/10">
                <div className="text-sm text-purple-300 mb-2">SMA 50</div>
                <div className="text-2xl font-bold text-cyan-400">${indicators.sma50.toFixed(2)}</div>
                <div className={`text-xs mt-1 ${indicators.currentPrice > indicators.sma50 ? 'text-green-400' : 'text-red-400'}`}>
                  {indicators.currentPrice > indicators.sma50 ? 'Por encima' : 'Por debajo'}
                </div>
              </div>

              {/* MACD */}
              <div className="bg-black/30 rounded-lg p-4 border border-purple-500/10">
                <div className="text-sm text-purple-300 mb-2">MACD</div>
                <div className={`text-2xl font-bold ${indicators.macd.macd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {indicators.macd.macd.toFixed(2)}
                </div>
                <div className={`text-xs mt-1 ${indicators.macd.macd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {indicators.macd.macd >= 0 ? 'Alcista' : 'Bajista'}
                </div>
              </div>
            </div>

            {/* Bollinger Bands */}
            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/10">
              <h5 className="text-sm text-purple-300 mb-3">Bandas de Bollinger</h5>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-red-300 text-sm">Superior</div>
                  <div className="text-lg font-semibold text-white">${indicators.bollingerBands.upper.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-blue-300 text-sm">Media</div>
                  <div className="text-lg font-semibold text-white">${indicators.bollingerBands.middle.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-green-300 text-sm">Inferior</div>
                  <div className="text-lg font-semibold text-white">${indicators.bollingerBands.lower.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/10">
              <h5 className="text-sm text-purple-300 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Recomendaciones
              </h5>
              <div className="space-y-2">
                {indicators.signals.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-purple-400 text-center">
              Última actualización: {new Date(indicators.timestamp).toLocaleString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IndicatorsWidget;