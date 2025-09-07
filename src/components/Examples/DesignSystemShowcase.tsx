/**
 * Design System Showcase Component
 * Demonstrates the usage of the financial news app design system
 * This component can be used for development and testing
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  BarChart3,
  Clock,
  Check,
  X
} from 'lucide-react';
import { 
  getFinancialClass,
  getSentimentBadgeClass,
  formatPercentageChange,
  formatPrice,
  getMarketStatusClass,
  getButtonClass,
  getInputClass,
  getTickerBadgeClass,
  cn
} from '../../theme/utils';

const DesignSystemShowcase: React.FC = () => {
  const [inputState, setInputState] = useState<'default' | 'error' | 'success'>('default');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sample financial data
  const stockData = [
    { symbol: 'AAPL', price: 178.25, change: 2.45, changePercent: 1.39 },
    { symbol: 'GOOGL', price: 2847.63, change: -15.23, changePercent: -0.53 },
    { symbol: 'MSFT', price: 338.92, change: 0.00, changePercent: 0.00 },
    { symbol: 'TSLA', price: 891.45, change: 45.67, changePercent: 5.4 }
  ];

  const sentiments = ['bullish', 'bearish', 'neutral', 'positive', 'negative'];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
  };

  return (
    <div className={cn('min-h-screen p-8', isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50')}>
      <div className="container-lg mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">
            Financial Design System
          </h1>
          <p className="text-lg text-theme-secondary max-w-2xl mx-auto">
            A comprehensive showcase of components, utilities, and design tokens 
            optimized for financial applications.
          </p>
          
          <button
            onClick={toggleDarkMode}
            className={getButtonClass('secondary', 'md')}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Color System */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Color System</h2>
          
          <div className="grid-responsive">
            {/* Financial Colors */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-xl font-semibold">Financial Colors</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-lg"></div>
                  <div>
                    <div className="font-medium">Bullish</div>
                    <div className="text-sm text-gray-500">#22c55e</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-red-500 rounded-lg"></div>
                  <div>
                    <div className="font-medium">Bearish</div>
                    <div className="text-sm text-gray-500">#ef4444</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-500 rounded-lg"></div>
                  <div>
                    <div className="font-medium">Neutral</div>
                    <div className="text-sm text-gray-500">#64748b</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Colors */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-xl font-semibold">Primary Colors</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                  <div>
                    <div className="font-medium">Primary Blue</div>
                    <div className="text-sm text-gray-500">#3b82f6</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg"></div>
                  <div>
                    <div className="font-medium">Secondary Purple</div>
                    <div className="text-sm text-gray-500">#a855f7</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stock Data Cards */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Financial Data Display</h2>
          
          <div className="grid-responsive">
            {stockData.map((stock) => {
              const changeData = formatPercentageChange(stock.changePercent);
              
              return (
                <div key={stock.symbol} className="financial-card p-6 space-y-4 hover-lift">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className={getTickerBadgeClass('default', 'md')}>
                      ${stock.symbol}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Real-time
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="space-y-2">
                    <div className={cn('price-display text-2xl', getFinancialClass(stock.change))}>
                      {formatPrice(stock.price)}
                    </div>
                    
                    {/* Change */}
                    <div className={cn('flex items-center gap-2', changeData.className)}>
                      {stock.change !== 0 && (
                        stock.change > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )
                      )}
                      <span className="font-medium">
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                      </span>
                      <span>({changeData.formatted})</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button className={getButtonClass('bullish', 'sm')}>
                      Buy
                    </button>
                    <button className={getButtonClass('bearish', 'sm')}>
                      Sell
                    </button>
                    <button className={getButtonClass('secondary', 'sm')}>
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Badges and Labels */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Badges & Labels</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sentiment Badges */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Sentiment Badges</h3>
              <div className="flex flex-wrap gap-2">
                {sentiments.map((sentiment) => (
                  <span 
                    key={sentiment}
                    className={getSentimentBadgeClass(sentiment)}
                  >
                    {sentiment}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Market Status */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Market Status</h3>
              <div className="space-y-3">
                <div className={getMarketStatusClass(true)}>
                  <div className="status-dot"></div>
                  Market Open
                </div>
                <div className={getMarketStatusClass(false)}>
                  <div className="status-dot"></div>
                  Market Closed
                </div>
              </div>
            </div>
            
            {/* Ticker Badges */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Ticker Badges</h3>
              <div className="flex flex-wrap gap-2">
                <span className={getTickerBadgeClass('default')}>$AAPL</span>
                <span className={getTickerBadgeClass('bullish')}>$TSLA</span>
                <span className={getTickerBadgeClass('bearish')}>$NFLX</span>
                <span className={getTickerBadgeClass('default', 'sm')}>$MSFT</span>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Buttons</h2>
          
          <div className="grid-responsive">
            {/* Button Variants */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Button Variants</h3>
              <div className="flex flex-wrap gap-3">
                <button className={getButtonClass('primary')}>Primary</button>
                <button className={getButtonClass('secondary')}>Secondary</button>
                <button className={getButtonClass('ghost')}>Ghost</button>
                <button className={getButtonClass('bullish')}>Buy</button>
                <button className={getButtonClass('bearish')}>Sell</button>
              </div>
            </div>
            
            {/* Button Sizes */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <button className={getButtonClass('primary', 'xs')}>Extra Small</button>
                <button className={getButtonClass('primary', 'sm')}>Small</button>
                <button className={getButtonClass('primary', 'md')}>Medium</button>
                <button className={getButtonClass('primary', 'lg')}>Large</button>
                <button className={getButtonClass('primary', 'xl')}>Extra Large</button>
              </div>
            </div>
            
            {/* Button States */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Button States</h3>
              <div className="flex flex-wrap gap-3">
                <button className={getButtonClass('primary')}>Normal</button>
                <button className={getButtonClass('primary', 'md', true)}>Disabled</button>
                <button className={getButtonClass('primary', 'md', false, true)}>Full Width</button>
              </div>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Form Elements</h2>
          
          <div className="grid-responsive">
            {/* Input States */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Input States</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Default input"
                  className={getInputClass('default')}
                />
                <input
                  type="text"
                  placeholder="Error input"
                  className={getInputClass('error')}
                />
                <input
                  type="text"
                  placeholder="Success input"
                  className={getInputClass('success')}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setInputState('default')}
                  className={getButtonClass('ghost', 'sm')}
                >
                  Default
                </button>
                <button
                  onClick={() => setInputState('error')}
                  className={getButtonClass('ghost', 'sm')}
                >
                  Error
                </button>
                <button
                  onClick={() => setInputState('success')}
                  className={getButtonClass('ghost', 'sm')}
                >
                  Success
                </button>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Search Input</h3>
              <div className="search-input">
                <input
                  type="text"
                  placeholder="Search stocks..."
                  className={getInputClass()}
                />
                <DollarSign className="search-icon w-5 h-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Loading States</h2>
          
          <div className="grid-responsive">
            {/* Skeleton Loaders */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Skeleton Loaders</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="skeleton-loader w-10 h-10 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="skeleton-loader h-4 w-3/4 rounded"></div>
                    <div className="skeleton-loader h-3 w-1/2 rounded"></div>
                  </div>
                </div>
                
                <div className="skeleton-loader h-32 w-full rounded-lg"></div>
                
                <div className="space-y-2">
                  <div className="skeleton-loader h-4 w-full rounded"></div>
                  <div className="skeleton-loader h-4 w-5/6 rounded"></div>
                  <div className="skeleton-loader h-4 w-4/6 rounded"></div>
                </div>
              </div>
            </div>
            
            {/* Spinners */}
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Spinners</h3>
              <div className="flex items-center gap-6">
                <div className="spinner"></div>
                <div className="spinner-lg"></div>
                <div className="flex items-center gap-2">
                  <div className="spinner"></div>
                  <span>Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Glass Effects */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Glass Effects</h2>
          
          <div className="relative bg-gradient-to-br from-blue-400 to-purple-600 p-8 rounded-2xl">
            <div className="grid-responsive">
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-lg font-semibold">Glass Card</h3>
                <p className="text-gray-600">
                  This card demonstrates the glass morphism effect with backdrop blur.
                </p>
                <button className={getButtonClass('primary', 'sm')}>
                  Glass Action
                </button>
              </div>
              
              <div className="glass-light p-6 space-y-4 rounded-xl">
                <h3 className="text-lg font-semibold">Glass Light</h3>
                <p className="text-gray-600">
                  A lighter version of the glass effect for subtle overlays.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Animation Examples */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Animations</h2>
          
          <div className="grid-responsive">
            {/* Hover Effects */}
            <div className="financial-card p-6 space-y-4 hover-lift">
              <h3 className="text-lg font-semibold">Hover Lift</h3>
              <p className="text-gray-600">This card lifts on hover</p>
            </div>
            
            <div className="financial-card p-6 space-y-4 hover-glow">
              <h3 className="text-lg font-semibold">Hover Glow</h3>
              <p className="text-gray-600">This card glows on hover</p>
            </div>
            
            <div className="financial-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Floating Animation</h3>
              <div className="animate-float w-12 h-12 bg-blue-500 rounded-full mx-auto"></div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-500">
            Financial News App Design System - Built with modern web technologies
          </p>
        </footer>
        
      </div>
    </div>
  );
};

export default DesignSystemShowcase;