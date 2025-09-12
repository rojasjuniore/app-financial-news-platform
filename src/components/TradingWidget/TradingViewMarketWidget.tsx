import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  BarChart3,
  Monitor,
  Grid,
  List,
  Activity,
  TrendingUp,
  Maximize2,
  Minimize2,
  Eye,
  Settings
} from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';

interface TradingViewMarketWidgetProps {
  viewMode?: 'overview' | 'symbols' | 'compact';
  className?: string;
}

const TradingViewMarketWidget: React.FC<TradingViewMarketWidgetProps> = ({
  viewMode: initialViewMode = 'overview',
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'symbols' | 'compact'>(initialViewMode);
  const [isExpanded, setIsExpanded] = useState(false);

  const cycleViewMode = () => {
    if (viewMode === 'overview') setViewMode('symbols');
    else if (viewMode === 'symbols') setViewMode('compact');
    else setViewMode('overview');
  };

  const getViewModeIcon = () => {
    switch (viewMode) {
      case 'overview': return <Globe className="w-4 h-4" />;
      case 'symbols': return <BarChart3 className="w-4 h-4" />;
      case 'compact': return <Grid className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getViewModeTitle = () => {
    switch (viewMode) {
      case 'overview': return 'Resumen de Mercados';
      case 'symbols': return 'Principales Acciones';
      case 'compact': return 'Vista Compacta';
      default: return 'Índices del Mercado';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Índices del Mercado
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getViewModeTitle()}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={cycleViewMode}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Cambiar vista"
            >
              {getViewModeIcon()}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {viewMode === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <TradingViewWidget
                  symbol="NASDAQ:AAPL"
                  theme="Light"
                  style="candles"
                  locale="es"
                  width="100%"
                  height={isExpanded ? 500 : 350}
                  hideTopToolbar={false}
                  allowSymbolChange={true}
                />
              </div>
            </motion.div>
          )}

          {viewMode === 'symbols' && (
            <motion.div
              key="symbols"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <TradingViewWidget
                  symbol="NASDAQ:GOOGL"
                  theme="Light"
                  style="area"
                  locale="es"
                  width="100%"
                  height={isExpanded ? 500 : 350}
                  hideTopToolbar={false}
                  allowSymbolChange={true}
                  studies={['EMA', 'Volume']}
                />
              </div>
            </motion.div>
          )}

          {viewMode === 'compact' && (
            <motion.div
              key="compact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Índices Principales
                </h3>
                <TradingViewWidget
                  symbol="TVC:SPX"
                  theme="Light"
                  style="line"
                  locale="es"
                  width="100%"
                  height={250}
                  hideTopToolbar={true}
                  hideSideToolbar={true}
                  allowSymbolChange={false}
                />
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Top Acciones
                </h3>
                <TradingViewWidget
                  symbol="NASDAQ:AAPL"
                  theme="Light"
                  style="line"
                  locale="es"
                  width="100%"
                  height={250}
                  hideTopToolbar={true}
                  hideSideToolbar={true}
                  allowSymbolChange={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Datos en tiempo real por TradingView</span>
            <span>•</span>
            <span>NYSE, NASDAQ, FOREX</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Datos en vivo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewMarketWidget;