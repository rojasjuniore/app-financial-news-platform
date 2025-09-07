import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity, AlertCircle, DollarSign } from 'lucide-react';
import { toNumber, formatCurrency, formatPercent, formatChange, formatPrice } from '../../utils/numberHelpers';

interface PolygonData {
  ticker?: string;
  price: {
    current: number | string;
    change: number | string;
    changePercent: number | string;
    low?: number | string;
    high?: number | string;
    vwap?: number | string;
    volume?: number | string;
  };
  technicals: {
    rsi?: string;
    sma20?: number | string;
    sma50?: number | string;
    sma200?: number | string;
  };
  levels: {
    support?: string[];
    resistance?: string[];
    pivot?: number | string;
  };
  signals: {
    recommendation: string;
    bullish_signals: number;
    bearish_signals: number;
    signals: string[];
  };
}

interface PolygonDataCardProps {
  polygonData: PolygonData;
  ticker?: string;
}

const PolygonDataCardFixed: React.FC<PolygonDataCardProps> = ({ polygonData, ticker }) => {
  // Safely convert all values to numbers
  const changePercent = toNumber(polygonData.price.changePercent);
  const change = toNumber(polygonData.price.change);
  const currentPrice = toNumber(polygonData.price.current);
  const lowPrice = toNumber(polygonData.price.low);
  const highPrice = toNumber(polygonData.price.high);
  const vwap = polygonData.price.vwap ? toNumber(polygonData.price.vwap) : null;
  const volume = polygonData.price.volume ? toNumber(polygonData.price.volume) : null;
  
  const isPositive = change >= 0;
  const rsiValue = parseFloat(polygonData.technicals.rsi || '50');
  
  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-600 dark:text-red-400';
    if (rsi < 30) return 'text-green-600 dark:text-green-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getRecommendationColor = (rec: string) => {
    switch(rec) {
      case 'BUY': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'SELL': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'HOLD': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toFixed(0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Market Data {ticker || polygonData.ticker ? `- ${ticker || polygonData.ticker}` : ''}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time data from Polygon.io
            </p>
          </div>
        </div>
        {(ticker || polygonData.ticker) && (
          <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
            ${ticker || polygonData.ticker}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Price Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Price Action
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(currentPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Daily Change</span>
              <div className="flex items-center space-x-2">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(changePercent)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Change ($)</span>
              <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatChange(change)}
              </span>
            </div>
            {(polygonData.price.low !== undefined || polygonData.price.high !== undefined) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Day Range</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {polygonData.price.low !== undefined && formatCurrency(lowPrice)} 
                  {polygonData.price.low !== undefined && polygonData.price.high !== undefined && ' - '}
                  {polygonData.price.high !== undefined && formatCurrency(highPrice)}
                </span>
              </div>
            )}
            {vwap !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">VWAP</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatCurrency(vwap)}
                </span>
              </div>
            )}
            {volume !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Volume</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatVolume(volume)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Technical Indicators
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">RSI (14)</span>
              <span className={`text-sm font-semibold ${getRSIColor(rsiValue)}`}>
                {rsiValue.toFixed(1)}
              </span>
            </div>
            {polygonData.technicals.sma20 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">SMA 20</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatCurrency(toNumber(polygonData.technicals.sma20))}
                </span>
              </div>
            )}
            {polygonData.technicals.sma50 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">SMA 50</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatCurrency(toNumber(polygonData.technicals.sma50))}
                </span>
              </div>
            )}
            {polygonData.technicals.sma200 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">SMA 200</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatCurrency(toNumber(polygonData.technicals.sma200))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Key Levels & Signals */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Key Levels
          </h4>
          <div className="space-y-2">
            {polygonData.levels.support && polygonData.levels.support.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Support</span>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {polygonData.levels.support[0]}
                </span>
              </div>
            )}
            {polygonData.levels.resistance && polygonData.levels.resistance.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Resistance</span>
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {polygonData.levels.resistance[0]}
                </span>
              </div>
            )}
            {polygonData.levels.pivot && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pivot</span>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {formatCurrency(toNumber(polygonData.levels.pivot))}
                </span>
              </div>
            )}
          </div>

          {/* Signal Summary */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Signal
              </span>
              <span className={`px-2 py-1 rounded text-xs font-semibold border ${getRecommendationColor(polygonData.signals.recommendation)}`}>
                {polygonData.signals.recommendation}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600 dark:text-green-400">
                ↑ {polygonData.signals.bullish_signals} Bullish
              </span>
              <span className="text-red-600 dark:text-red-400">
                ↓ {polygonData.signals.bearish_signals} Bearish
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Signals */}
      {polygonData.signals.signals && polygonData.signals.signals.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Active Signals
          </h4>
          <div className="flex flex-wrap gap-2">
            {polygonData.signals.signals.map((signal, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PolygonDataCardFixed;