import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
  marketCap?: string;
  pe?: number;
  sparkline?: number[];
}

interface MarketCardProps {
  data: MarketData;
  variant?: 'compact' | 'detailed';
  onClick?: () => void;
}

const MarketCard: React.FC<MarketCardProps> = ({ data, variant = 'compact', onClick }) => {
  const isPositive = data.change > 0;
  const isNeutral = data.change === 0;

  const getTrendIcon = () => {
    if (isNeutral) return <Minus className="w-5 h-5" />;
    return isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />;
  };

  const getColorClasses = () => {
    if (isNeutral) return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    return isPositive 
      ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' 
      : 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
  };

  const getArrowIcon = () => {
    if (isNeutral) return null;
    return isPositive 
      ? <ArrowUpRight className="w-4 h-4" />
      : <ArrowDownRight className="w-4 h-4" />;
  };

  // Generate mini sparkline chart
  const renderSparkline = () => {
    if (!data.sparkline || data.sparkline.length === 0) return null;
    
    const max = Math.max(...data.sparkline);
    const min = Math.min(...data.sparkline);
    const range = max - min;
    const width = 100;
    const height = 30;
    
    const points = data.sparkline.map((value, index) => {
      const x = (index / (data.sparkline!.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="opacity-60">
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  if (variant === 'detailed') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{data.symbol}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{data.name}</p>
          </div>
          <div className={`p-2 rounded-lg ${getColorClasses()}`}>
            {getTrendIcon()}
          </div>
        </div>

        {/* Price and Change */}
        <div className="mb-4">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ${data.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600 dark:text-green-400' : isNeutral ? 'text-gray-600' : 'text-red-600 dark:text-red-400'}`}>
              {getArrowIcon()}
              <span className="font-medium">
                {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}
              </span>
              <span className="text-sm">
                ({data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Sparkline */}
        {data.sparkline && (
          <div className="mb-4 flex justify-center">
            {renderSparkline()}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Volumen</span>
            <p className="font-medium text-gray-900 dark:text-white">{data.volume}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Rango día</span>
            <p className="font-medium text-gray-900 dark:text-white">
              ${data.low.toFixed(2)} - ${data.high.toFixed(2)}
            </p>
          </div>
          {data.marketCap && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Cap. Mercado</span>
              <p className="font-medium text-gray-900 dark:text-white">{data.marketCap}</p>
            </div>
          )}
          {data.pe && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">P/E</span>
              <p className="font-medium text-gray-900 dark:text-white">{data.pe.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Activity Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Activity className="w-3 h-3" />
              <span>Actualizado hace 2 min</span>
            </div>
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Ver detalles →
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Compact variant
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 dark:text-white">{data.symbol}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{data.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              ${data.price.toFixed(2)}
            </span>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : isNeutral ? 'text-gray-600' : 'text-red-600 dark:text-red-400'}`}>
              {getArrowIcon()}
              <span>{data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
            </div>
          </div>
        </div>
        {data.sparkline && (
          <div className="ml-4">
            {renderSparkline()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MarketCard;