import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import apiClient from '../../services/news/api';

interface PreciousMetalsWidgetProps {
  symbol?: string;
  height?: number | string;
  theme?: 'Dark' | 'Light';
  locale?: 'es' | 'en';
  showAnalysis?: boolean;
}

interface MetalData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: string;
  trend: 'up' | 'down' | 'neutral';
}

const PreciousMetalsWidget: React.FC<PreciousMetalsWidgetProps> = ({
  symbol = 'TVC:GOLD',
  height = 400,
  theme = 'Dark',
  locale = 'es',
  showAnalysis = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [metalData, setMetalData] = useState<MetalData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mapeo de símbolos a nombres en español/inglés
  const metalNames = {
    'TVC:GOLD': { es: 'Oro', en: 'Gold' },
    'TVC:SILVER': { es: 'Plata', en: 'Silver' },
    'COMEX:GC1!': { es: 'Futuros del Oro', en: 'Gold Futures' },
    'COMEX:SI1!': { es: 'Futuros de la Plata', en: 'Silver Futures' },
    'NYMEX:PL1!': { es: 'Futuros del Platino', en: 'Platinum Futures' }
  };

  useEffect(() => {
    // Función para cargar el widget de TradingView
    const loadTradingViewWidget = () => {
      if (!containerRef.current) return;

      // Limpiar el contenedor
      containerRef.current.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: false,
        symbol: symbol,
        timezone: 'America/New_York',
        theme: theme,
        style: 'candles',
        locale: locale,
        toolbar_bg: theme === 'Dark' ? '#1f2937' : '#f1f3f6',
        enable_publishing: false,
        backgroundColor: theme === 'Dark' ? '#1f2937' : '#ffffff',
        gridColor: theme === 'Dark' ? '#374151' : '#e5e7eb',
        hide_side_toolbar: false,
        allow_symbol_change: false,
        details: true,
        hotlist: false,
        calendar: false,
        studies: [
          'RSI@tv-basicstudies',
          'MACD@tv-basicstudies',
          'BB@tv-basicstudies',
          'Volume@tv-basicstudies'
        ],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        no_referral_id: true,
        container_id: `tradingview_${symbol.replace(':', '_')}`,
        width: '100%',
        height: typeof height === 'number' ? height : 400
      });

      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container__widget';
      widgetContainer.appendChild(script);

      containerRef.current.appendChild(widgetContainer);
    };

    // Función para obtener datos del metal
    const fetchMetalData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/tradingview/data/${encodeURIComponent(symbol)}`);
        const data = response.data;
        
        if (data.current_price) {
          setMetalData({
            symbol: data.symbol,
            name: metalNames[symbol as keyof typeof metalNames]?.[locale] || data.name,
            price: data.current_price,
            change: data.change || 0,
            changePercent: data.change_percent || 0,
            lastUpdate: data.last_update,
            trend: data.change > 0 ? 'up' : data.change < 0 ? 'down' : 'neutral'
          });
        }
      } catch (error) {
        console.error('Error fetching metal data:', error);
        // Datos mock para desarrollo
        setMetalData({
          symbol: symbol,
          name: metalNames[symbol as keyof typeof metalNames]?.[locale] || 'Metal Precioso',
          price: symbol.includes('GOLD') ? 2045.30 : symbol.includes('SILVER') ? 24.85 : 1850.00,
          change: (Math.random() - 0.5) * 50,
          changePercent: (Math.random() - 0.5) * 3,
          lastUpdate: new Date().toISOString(),
          trend: Math.random() > 0.5 ? 'up' : 'down'
        });
      } finally {
        setLoading(false);
      }
    };

    loadTradingViewWidget();
    fetchMetalData();

    // Actualizar datos cada 30 segundos
    const interval = setInterval(fetchMetalData, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [symbol, height, theme, locale]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con información del metal */}
      {showAnalysis && metalData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 rounded-xl p-4 border border-yellow-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{metalData.name}</h3>
                <p className="text-yellow-300 text-sm">{metalData.symbol}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                ${metalData.price.toFixed(2)}
              </div>
              <div className={`flex items-center gap-1 justify-end ${getTrendColor(metalData.trend)}`}>
                {getTrendIcon(metalData.trend)}
                <span className="text-sm font-medium">
                  {metalData.change >= 0 ? '+' : ''}{metalData.change.toFixed(2)} 
                  ({metalData.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          {metalData.lastUpdate && (
            <div className="mt-3 pt-3 border-t border-yellow-500/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-300">
                  {locale === 'es' ? 'Última actualización:' : 'Last update:'}
                </span>
                <span className="text-gray-300">
                  {new Date(metalData.lastUpdate).toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US')}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* TradingView Widget Container */}
      <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-xl border border-yellow-500/20 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-yellow-500/20">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            {locale === 'es' ? 'Gráfico Profesional' : 'Professional Chart'}
          </h4>
          <div className="text-sm text-yellow-300">
            TradingView
          </div>
        </div>
        
        <div 
          ref={containerRef}
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
          className="relative"
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <div className="flex items-center gap-3 text-yellow-300">
                <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <span>{locale === 'es' ? 'Cargando gráfico...' : 'Loading chart...'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="text-center text-sm text-gray-400">
        {locale === 'es' 
          ? 'Datos proporcionados por TradingView. Los metales preciosos se cotizan 24/7.'
          : 'Data provided by TradingView. Precious metals are quoted 24/7.'
        }
      </div>
    </div>
  );
};

export default PreciousMetalsWidget;