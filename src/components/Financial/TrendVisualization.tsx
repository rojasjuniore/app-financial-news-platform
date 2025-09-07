import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity,
  Calendar,
  Filter
} from 'lucide-react';

interface TrendData {
  timestamp: string;
  value: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}

interface TrendVisualizationProps {
  data: TrendData[];
  title: string;
  symbol?: string;
  timeframe?: '1D' | '1W' | '1M' | '3M' | '1Y';
  chartType?: 'line' | 'area' | 'candlestick' | 'bar';
  showVolume?: boolean;
  height?: number;
}

const TrendVisualization: React.FC<TrendVisualizationProps> = ({
  data,
  title,
  symbol,
  timeframe = '1D',
  chartType = 'line',
  showVolume = false,
  height = 300
}) => {
  const [activeChart, setActiveChart] = useState<'price' | 'volume'>('price');
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [hoveredData, setHoveredData] = useState<TrendData | null>(null);

  // Calculate trend indicators
  const trendIndicators = useMemo(() => {
    if (data.length < 2) return { trend: 'neutral', change: 0, changePercent: 0 };
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = last - first;
    const changePercent = (change / first) * 100;
    
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      change,
      changePercent,
      high: Math.max(...data.map(d => d.value)),
      low: Math.min(...data.map(d => d.value)),
      current: last
    };
  }, [data]);

  // Color scheme based on trend
  const getColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10b981'; // Green
      case 'down': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const gradientColor = getColor(trendIndicators.trend);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {new Date(label).toLocaleDateString()}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ${payload[0].value.toFixed(2)}
          </p>
          {data.volume && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vol: {(data.volume / 1000000).toFixed(1)}M
            </p>
          )}
        </motion.div>
      );
    }
    return null;
  };

  // Timeframe buttons
  const timeframes = ['1D', '1W', '1M', '3M', '1Y'] as const;

  // Chart type buttons
  const chartTypes = [
    { type: 'line', icon: Activity, label: 'Línea' },
    { type: 'area', icon: TrendingUp, label: 'Área' },
    { type: 'bar', icon: BarChart3, label: 'Barras' }
  ] as const;

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={gradientColor}
              strokeWidth={2}
              fill="url(#colorValue)"
              dot={false}
              activeDot={{ r: 6, fill: gradientColor }}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={gradientColor} radius={[2, 2, 0, 0]} />
          </BarChart>
        );

      default: // line
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={gradientColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: gradientColor }}
            />
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
              {title}
            </h3>
            {symbol && (
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                {symbol}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${
              trendIndicators.trend === 'up' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
              trendIndicators.trend === 'down' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            } transition-colors duration-300`}>
              {trendIndicators.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
               trendIndicators.trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
               <Activity className="w-4 h-4" />}
            </div>
            <span className={`text-sm font-medium ${
              trendIndicators.trend === 'up' ? 'text-green-600 dark:text-green-400' :
              trendIndicators.trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-gray-600 dark:text-gray-400'
            } transition-colors duration-300`}>
              {trendIndicators.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Timeframe selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 transition-colors duration-300">
            {timeframes.map((tf) => (
              <motion.button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-300 ${
                  selectedTimeframe === tf
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tf}
              </motion.button>
            ))}
          </div>

          {/* Chart type selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 transition-colors duration-300">
            {chartTypes.map(({ type, icon: Icon, label }) => (
              <motion.button
                key={type}
                onClick={() => setActiveChart(type as any)}
                className={`p-2 rounded-md transition-all duration-300 ${
                  chartType === type
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">
            Actual
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
            ${trendIndicators.current?.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">
            Cambio
          </p>
          <p className={`text-lg font-semibold ${
            trendIndicators.trend === 'up' ? 'text-green-600 dark:text-green-400' :
            trendIndicators.trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-gray-600 dark:text-gray-400'
          } transition-colors duration-300`}>
            {trendIndicators.change >= 0 ? '+' : ''}${trendIndicators.change.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">
            Máximo
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
            ${trendIndicators.high?.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">
            Mínimo
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
            ${trendIndicators.low?.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
        
        {/* Loading overlay for real-time updates */}
        <AnimatePresence>
          {false && ( // This would be controlled by a loading state
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center"
            >
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Actualizando...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Volume Chart (if enabled) */}
      {showVolume && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">
            Volumen
          </h4>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={data}>
              <XAxis dataKey="timestamp" hide />
              <YAxis hide />
              <Tooltip 
                formatter={(value: any) => [`${(value / 1000000).toFixed(1)}M`, 'Volumen']}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Bar dataKey="volume" fill="#9ca3af" radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(TrendVisualization);