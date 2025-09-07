import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, PieChartIcon, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChartData {
  name: string;
  value: number;
  value2?: number;
  change?: number;
  volume?: number;
}

interface FinancialChartProps {
  data: ChartData[];
  type?: 'line' | 'area' | 'bar' | 'pie' | 'radial';
  title?: string;
  height?: number;
  showLegend?: boolean;
  colors?: string[];
}

const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FinancialChart: React.FC<FinancialChartProps> = ({
  data,
  type = 'line',
  title,
  height = 300,
  showLegend = true,
  colors = defaultColors,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name}: 
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                ${entry.value.toLocaleString('es-ES')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[1]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors[1]} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={colors[0]} 
                fill="url(#colorGradient1)"
                strokeWidth={2}
                name="Precio"
              />
              {data[0]?.value2 !== undefined && (
                <Area 
                  type="monotone" 
                  dataKey="value2" 
                  stroke={colors[1]} 
                  fill="url(#colorGradient2)"
                  strokeWidth={2}
                  name="Volumen"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Bar 
                dataKey="value" 
                fill={colors[0]} 
                radius={[8, 8, 0, 0]}
                name="Valor"
              />
              {data[0]?.volume !== undefined && (
                <Bar 
                  dataKey="volume" 
                  fill={colors[1]} 
                  radius={[8, 8, 0, 0]}
                  name="Volumen"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    style={{
                      filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radial':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={data}>
              <RadialBar
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </RadialBar>
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      default: // line
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Precio"
              />
              {data[0]?.value2 !== undefined && (
                <Line 
                  type="monotone" 
                  dataKey="value2" 
                  stroke={colors[1]} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="MA 50"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const getChartIcon = () => {
    switch (type) {
      case 'pie': return <PieChartIcon className="w-5 h-5" />;
      case 'bar': return <BarChart3 className="w-5 h-5" />;
      case 'area': return <Activity className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getTotalValue = () => {
    return data.reduce((sum, item) => sum + item.value, 0);
  };

  const getChangePercent = () => {
    if (data.length < 2) return '0';
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    return ((lastValue - firstValue) / firstValue * 100).toFixed(2);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      {title && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              {getChartIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total: ${getTotalValue().toLocaleString('es-ES')}
                </span>
                {type === 'line' || type === 'area' ? (
                  <span className={`text-sm font-medium flex items-center gap-1 ${
                    parseFloat(getChangePercent()) > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {parseFloat(getChangePercent()) > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {getChangePercent()}%
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              1D
            </button>
            <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg">
              1W
            </button>
            <button className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              1M
            </button>
            <button className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              1Y
            </button>
          </div>
        </div>
      )}
      <div className="mt-4">
        {renderChart()}
      </div>
    </motion.div>
  );
};

export default FinancialChart;