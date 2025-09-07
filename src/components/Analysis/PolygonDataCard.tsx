import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target, AlertCircle, Activity } from 'lucide-react';

interface PolygonData {
  price: {
    current: number;
    change: number;
    changePercent: number;
  };
  volume: number;
  technicals: {
    rsi?: string;
    sma20?: string;
    sma50?: string;
    volume?: {
      trend: string;
      recent: number;
      average: number;
    };
  };
  levels: {
    support?: string[];
    resistance?: string[];
    pivot?: number;
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

const PolygonDataCard: React.FC<PolygonDataCardProps> = ({ polygonData, ticker }) => {
  // Ensure numeric values
  const changePercent = typeof polygonData.price.changePercent === 'string' 
    ? parseFloat(polygonData.price.changePercent) 
    : (polygonData.price.changePercent || 0);
  
  const change = typeof polygonData.price.change === 'string'
    ? parseFloat(polygonData.price.change)
    : (polygonData.price.change || 0);
    
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Market Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time data from Polygon.io
            </p>
          </div>
        </div>
        {ticker && (
          <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
            ${ticker}
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
                ${polygonData.price.current.toFixed(2)}
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
                  {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Change ($)</span>
              <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}${change.toFixed(2)}
              </span>
            </div>
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
                {rsiValue > 70 && <span className="ml-1 text-xs">(Overbought)</span>}
                {rsiValue < 30 && <span className="ml-1 text-xs">(Oversold)</span>}
              </span>
            </div>
            {polygonData.technicals.sma20 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">SMA20</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${parseFloat(polygonData.technicals.sma20).toFixed(2)}
                </span>
              </div>
            )}
            {polygonData.technicals.sma50 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">SMA50</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${parseFloat(polygonData.technicals.sma50).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Volume Trend</span>
              <span className={`text-sm font-semibold capitalize ${
                polygonData.technicals.volume?.trend === 'increasing' ? 'text-green-600' : 
                polygonData.technicals.volume?.trend === 'decreasing' ? 'text-red-600' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                {polygonData.technicals.volume?.trend || 'Stable'}
              </span>
            </div>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Key Levels
          </h4>
          <div className="space-y-2">
            {polygonData.levels.resistance && polygonData.levels.resistance.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Resistance</span>
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  ${polygonData.levels.resistance.slice(0, 2).map(r => parseFloat(r).toFixed(2)).join(', $')}
                </div>
              </div>
            )}
            {polygonData.levels.support && polygonData.levels.support.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-3 h-3 text-green-500 rotate-180" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Support</span>
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  ${polygonData.levels.support.slice(0, 2).map(s => parseFloat(s).toFixed(2)).join(', $')}
                </div>
              </div>
            )}
            {polygonData.levels.pivot && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pivot Point</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${polygonData.levels.pivot.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trading Signals */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Trading Signals
          </h4>
          <div className={`px-3 py-1 rounded-lg border text-sm font-semibold ${getRecommendationColor(polygonData.signals.recommendation)}`}>
            <div className="flex items-center space-x-2">
              <Activity className="w-3 h-3" />
              <span>{polygonData.signals.recommendation}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {polygonData.signals.bullish_signals}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Bullish Signals</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {polygonData.signals.bearish_signals}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Bearish Signals</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {polygonData.volume ? (polygonData.volume / 1000000).toFixed(1) + 'M' : '—'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Volume</div>
          </div>
        </div>

        {polygonData.signals.signals && polygonData.signals.signals.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Active Signals</h5>
            <div className="flex flex-wrap gap-2">
              {polygonData.signals.signals.slice(0, 4).map((signal, index) => (
                <div key={index} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">
                  {signal}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-3 h-3 mr-1" />
        Data provided by Polygon.io - Not investment advice
      </div>
    </div>
  );
};

export default PolygonDataCard;