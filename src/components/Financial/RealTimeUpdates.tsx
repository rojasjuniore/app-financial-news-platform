import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Radio,
  Pause,
  Play,
  Settings
} from 'lucide-react';
import { useDebounce } from '../../hooks/usePerformance';

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

interface MarketEvent {
  type: 'price_alert' | 'news_alert' | 'technical_signal' | 'volume_spike';
  symbol: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface RealTimeUpdatesProps {
  symbols: string[];
  onPriceUpdate?: (update: PriceUpdate) => void;
  onMarketEvent?: (event: MarketEvent) => void;
  updateInterval?: number;
  maxEvents?: number;
}

// Mock WebSocket service for demonstration
class MockWebSocketService {
  private listeners: ((data: any) => void)[] = [];
  private interval: NodeJS.Timeout | null = null;
  private isConnected = false;

  connect() {
    this.isConnected = true;
    this.interval = setInterval(() => {
      this.simulateUpdate();
    }, 2000);
  }

  disconnect() {
    this.isConnected = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private simulateUpdate() {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const basePrice = 150 + Math.random() * 100;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;

    const update: PriceUpdate = {
      symbol,
      price: basePrice + change,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString()
    };

    this.listeners.forEach(listener => {
      listener({ type: 'price_update', data: update });
    });

    // Occasionally send market events
    if (Math.random() < 0.3) {
      const events: MarketEvent[] = [
        {
          type: 'price_alert',
          symbol,
          message: `${symbol} ha cruzado el nivel de resistencia de $${(basePrice + 5).toFixed(2)}`,
          severity: 'medium',
          timestamp: new Date().toISOString()
        },
        {
          type: 'volume_spike',
          symbol,
          message: `Pico de volumen inusual detectado en ${symbol}`,
          severity: 'high',
          timestamp: new Date().toISOString()
        },
        {
          type: 'technical_signal',
          symbol,
          message: `Señal alcista en ${symbol} - RSI oversold`,
          severity: 'low',
          timestamp: new Date().toISOString()
        }
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      this.listeners.forEach(listener => {
        listener({ type: 'market_event', data: event });
      });
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

const wsService = new MockWebSocketService();

const RealTimeUpdates: React.FC<RealTimeUpdatesProps> = ({
  symbols,
  onPriceUpdate,
  onMarketEvent,
  updateInterval = 2000,
  maxEvents = 10
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<PriceUpdate[]>([]);
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Debounced handlers
  const debouncedPriceUpdate = useDebounce(onPriceUpdate || (() => {}), 100);
  const debouncedEventUpdate = useDebounce(onMarketEvent || (() => {}), 200);

  const handleWebSocketMessage = useCallback((message: any) => {
    if (isPaused) return;

    setLastUpdateTime(new Date());
    setConnectionError(null);

    if (message.type === 'price_update') {
      const update = message.data as PriceUpdate;
      setRecentUpdates(prev => [update, ...prev].slice(0, 5));
      debouncedPriceUpdate(update);
    } else if (message.type === 'market_event') {
      const event = message.data as MarketEvent;
      setMarketEvents(prev => [event, ...prev].slice(0, maxEvents));
      debouncedEventUpdate(event);
    }
  }, [isPaused, debouncedPriceUpdate, debouncedEventUpdate, maxEvents]);

  // Connection management
  useEffect(() => {
    if (symbols.length === 0) return;

    try {
      wsService.connect();
      setIsConnected(true);
      
      const unsubscribe = wsService.subscribe(handleWebSocketMessage);

      const statusInterval = setInterval(() => {
        setIsConnected(wsService.getConnectionStatus());
      }, 1000);

      return () => {
        unsubscribe();
        clearInterval(statusInterval);
        wsService.disconnect();
        setIsConnected(false);
      };
    } catch (error) {
      setConnectionError('Error conectando con el servicio de datos en tiempo real');
      setIsConnected(false);
    }
  }, [symbols, handleWebSocketMessage]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const clearEvents = useCallback(() => {
    setMarketEvents([]);
    setRecentUpdates([]);
  }, []);

  const getEventIcon = (type: MarketEvent['type']) => {
    switch (type) {
      case 'price_alert': return <TrendingUp className="w-4 h-4" />;
      case 'volume_spike': return <Activity className="w-4 h-4" />;
      case 'technical_signal': return <TrendingDown className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: MarketEvent['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const timeSinceLastUpdate = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - lastUpdateTime.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }, [lastUpdateTime]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            isConnected && !isPaused 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          } transition-colors duration-300`}>
            {isConnected ? (
              isPaused ? <Pause className="w-4 h-4" /> : <Radio className="w-4 h-4 animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
              Actualizaciones en Tiempo Real
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
              <Clock className="w-3 h-3" />
              <span>Última actualización: hace {timeSinceLastUpdate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            onClick={togglePause}
            className={`p-2 rounded-lg transition-all duration-300 ${
              isPaused
                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isPaused ? 'Reanudar' : 'Pausar'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </motion.button>

          <motion.button
            onClick={clearEvents}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Limpiar eventos"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Connection Status */}
      <AnimatePresence>
        {connectionError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 transition-colors duration-300"
          >
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{connectionError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Recent Price Updates */}
        {recentUpdates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">
              Actualizaciones de Precio
            </h4>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {recentUpdates.map((update, index) => (
                  <motion.div
                    key={`${update.symbol}-${update.timestamp}`}
                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    layout
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">
                        {update.symbol}
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                        ${update.price.toFixed(2)}
                      </span>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded text-sm font-medium ${
                        update.change >= 0
                          ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
                          : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
                      } transition-colors duration-300`}>
                        {update.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{Math.abs(update.changePercent).toFixed(2)}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                      {formatTime(update.timestamp)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Market Events */}
        {marketEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">
              Eventos del Mercado
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {marketEvents.map((event, index) => (
                  <motion.div
                    key={`${event.symbol}-${event.timestamp}-${index}`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    layout
                    className={`p-3 rounded-lg border transition-colors duration-300 ${getSeverityColor(event.severity)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {event.symbol}
                          </span>
                          <span className="text-xs opacity-75">
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm opacity-90">
                          {event.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentUpdates.length === 0 && marketEvents.length === 0 && isConnected && !isPaused && (
          <div className="text-center py-8">
            <Radio className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
              Esperando actualizaciones del mercado...
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(RealTimeUpdates);