import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
}

interface MarketOverviewCardProps {
  marketData: MarketData;
  index?: number;
  size?: 'small' | 'medium' | 'large';
}

const MarketOverviewCard: React.FC<MarketOverviewCardProps> = ({ 
  marketData, 
  index = 0,
  size = 'medium'
}) => {
  // Memoize expensive calculations
  const isPositive = useMemo(() => marketData.change >= 0, [marketData.change]);
  const isNeutral = useMemo(() => Math.abs(marketData.changePercent) < 0.1, [marketData.changePercent]);
  
  const changeColor = useMemo(() => {
    if (isNeutral) return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    return isPositive 
      ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' 
      : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
  }, [isPositive, isNeutral]);

  const trendIcon = useMemo(() => {
    if (isNeutral) return <Activity className="w-4 h-4" />;
    return isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  }, [isPositive, isNeutral]);

  const arrowIcon = useMemo(() => {
    return isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />;
  }, [isPositive]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(2)}K`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume?: number) => {
    if (!volume) return 'N/A';
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    }
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    return `${(volume / 1000).toFixed(1)}K`;
  };

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    },
    hover: {
      y: -4,
      scale: 1.02,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ duration: 0.4, delay: index * 0.1 }}
      layout
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700 overflow-hidden group transition-colors duration-300 ${sizeClasses[size]}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${changeColor} border transition-colors duration-300`}>
            {trendIcon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
              {marketData.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
              {marketData.symbol}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
            {formatPrice(marketData.price)}
          </p>
        </div>
      </div>

      {/* Change Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${changeColor} transition-colors duration-300`}>
          {arrowIcon}
          <span>{formatPrice(Math.abs(marketData.change))}</span>
          <span>({Math.abs(marketData.changePercent).toFixed(2)}%)</span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
          24h
        </div>
      </div>

      {/* Additional Data */}
      {(marketData.volume || marketData.marketCap) && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
          {marketData.volume && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">
                Volumen
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                {formatVolume(marketData.volume)}
              </p>
            </div>
          )}
          {marketData.marketCap && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">
                Cap. Mercado
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                {formatPrice(marketData.marketCap)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 52 Week Range */}
      {(marketData.high52Week && marketData.low52Week) && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
              Rango 52 semanas
            </span>
          </div>
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300">
            <div 
              className="absolute h-2 bg-gradient-to-r from-red-500 to-green-500 rounded-full"
              style={{
                width: '100%',
              }}
            />
            <div 
              className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full transform -translate-y-0.5"
              style={{
                left: `${((marketData.price - marketData.low52Week) / (marketData.high52Week - marketData.low52Week)) * 100}%`,
                transform: 'translateX(-50%) translateY(-2px)'
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
              {formatPrice(marketData.low52Week)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
              {formatPrice(marketData.high52Week)}
            </span>
          </div>
        </div>
      )}

      {/* Hover Effect Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default React.memo(MarketOverviewCard);