/**
 * @component MarketDataExplorer
 * @tags MARKET_EXPLORER, DATA_BROWSER, FINANCIAL_SEARCH
 * @search MARKET_DATA_EXPLORER, INSTRUMENT_BROWSER, TICKER_EXPLORER
 * @description Advanced market data explorer with categories, filters, and real-time search
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, TrendingUp, Star, Filter, Grid, List, X, ChevronRight,
  Globe, DollarSign, BarChart3, Coins, LineChart, Building,
  Briefcase, PieChart, Settings, RefreshCw, Download, Heart
} from 'lucide-react';
import marketDataService, { MarketDataItem, MarketStats } from '../../services/marketDataServiceExpanded';
import debounce from 'lodash/debounce';

interface MarketDataExplorerProps {
  onSelectItem: (item: MarketDataItem) => void;
  selectedItems: string[];
  favorites?: string[];
  onToggleFavorite?: (symbol: string) => void;
  allowMultiSelect?: boolean;
  showRealTimeQuotes?: boolean;
}

const MarketDataExplorer: React.FC<MarketDataExplorerProps> = ({
  onSelectItem,
  selectedItems = [],
  favorites = [],
  onToggleFavorite,
  allowMultiSelect = true,
  showRealTimeQuotes = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [items, setItems] = useState<MarketDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [quotes, setQuotes] = useState<Map<string, any>>(new Map());

  // Categories with icons
  const categories = [
    { id: 'all', name: 'All Markets', icon: Globe, color: 'gray' },
    { id: 'stocks', name: 'Stocks', icon: TrendingUp, color: 'blue' },
    { id: 'crypto', name: 'Crypto', icon: Coins, color: 'orange' },
    { id: 'forex', name: 'Forex', icon: DollarSign, color: 'green' },
    { id: 'commodities', name: 'Commodities', icon: BarChart3, color: 'yellow' },
    { id: 'etfs', name: 'ETFs', icon: PieChart, color: 'purple' },
    { id: 'indices', name: 'Indices', icon: LineChart, color: 'indigo' },
    { id: 'bonds', name: 'Bonds', icon: Briefcase, color: 'pink' },
    { id: 'reits', name: 'REITs', icon: Building, color: 'teal' }
  ];

  // Regions
  const regions = [
    { id: 'all', name: 'Global', flag: '🌍' },
    { id: 'us', name: 'United States', flag: '🇺🇸' },
    { id: 'europe', name: 'Europe', flag: '🇪🇺' },
    { id: 'asia', name: 'Asia', flag: '🌏' },
    { id: 'canada', name: 'Canada', flag: '🇨🇦' }
  ];

  // Fetch market stats on mount
  useEffect(() => {
    marketDataService.getMarketStats().then(setStats);
  }, []);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(async (query: string, category: string, region: string) => {
      setLoading(true);
      try {
        let results: MarketDataItem[] = [];

        if (region !== 'all' && category === 'stocks') {
          results = await marketDataService.getStocksByRegion(region as any, 100);
        } else if (category === 'all' && !query) {
          const { data } = await marketDataService.getAllInstruments(0, 100);
          results = data;
        } else {
          results = await marketDataService.searchExpanded({
            query,
            category: category === 'all' ? undefined : category,
            limit: 100
          });
        }

        setItems(results);
        setHasMore(results.length === 100);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Handle search changes
  useEffect(() => {
    debouncedSearch(searchQuery, selectedCategory, selectedRegion);
  }, [searchQuery, selectedCategory, selectedRegion, debouncedSearch]);

  // Fetch real-time quotes
  useEffect(() => {
    if (showRealTimeQuotes && items.length > 0) {
      const symbols = items.slice(0, 20).map(item => item.value);
      const interval = setInterval(async () => {
        const newQuotes = await marketDataService.getRealTimeQuotes(symbols);
        setQuotes(newQuotes);
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [items, showRealTimeQuotes]);

  // Load more items
  const loadMore = async () => {
    if (!hasMore || loading) return;
    setLoading(true);

    const { data, hasMore: more } = await marketDataService.getAllInstruments(
      (currentPage + 1) * 100,
      100
    );

    setItems(prev => [...prev, ...data]);
    setHasMore(more);
    setCurrentPage(prev => prev + 1);
    setLoading(false);
  };

  // Get category icon
  const getCategoryIcon = (category?: string) => {
    const cat = categories.find(c => c.id === category?.toLowerCase());
    return cat ? <cat.icon className="w-4 h-4" /> : null;
  };

  // Format market cap
  const formatMarketCap = (marketCap?: string) => {
    if (!marketCap) return '';
    const capMap: Record<string, string> = {
      'Mega': '> $200B',
      'Large': '$10B - $200B',
      'Medium': '$2B - $10B',
      'Small': '< $2B'
    };
    return capMap[marketCap] || marketCap;
  };

  // Render item card
  const renderItemCard = (item: MarketDataItem) => {
    const isSelected = selectedItems.includes(item.value);
    const isFavorite = favorites.includes(item.value);
    const quote = quotes.get(item.value);

    return (
      <motion.div
        key={item.value}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        className={`
          relative p-4 rounded-xl border-2 cursor-pointer transition-all
          ${isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          }
          ${viewMode === 'grid' ? 'h-40' : 'h-auto'}
        `}
        onClick={() => onSelectItem(item)}
      >
        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.value);
            }}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
        )}

        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div className={`p-2 rounded-lg bg-${categories.find(c => c.id === item.category?.toLowerCase())?.color || 'gray'}-100`}>
            {getCategoryIcon(item.category)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg">{item.value}</span>
              <span className="text-sm text-gray-500">{item.label}</span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {item.description}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 mt-2">
              {item.country && (
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {item.country}
                </span>
              )}
              {item.exchange && (
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-700 dark:text-blue-300">
                  {item.exchange}
                </span>
              )}
              {item.marketCap && (
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-green-700 dark:text-green-300">
                  {formatMarketCap(item.marketCap)}
                </span>
              )}
              {item.sector && (
                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded text-purple-700 dark:text-purple-300">
                  {item.sector}
                </span>
              )}
            </div>

            {/* Real-time quote */}
            {quote && (
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="font-semibold">${quote.price.toFixed(2)}</span>
                <span className={quote.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)}
                  ({quote.changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Market Data Explorer</h2>
            {stats && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.totalInstruments.toLocaleString()} instruments available
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-700' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter toggle */}
            <button
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => {
                marketDataService.clearCache();
                debouncedSearch(searchQuery, selectedCategory, selectedRegion);
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ticker, name, or description..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            {/* Categories */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                        ${selectedCategory === category.id
                          ? `border-${category.color}-500 bg-${category.color}-50 dark:bg-${category.color}-900/20`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{category.name}</span>
                      {stats && category.id !== 'all' && (
                        <span className="text-xs text-gray-500">
                          ({stats.categories[category.id] || 0})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Regions (for stocks) */}
            {selectedCategory === 'stocks' && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Regions</h3>
                <div className="flex flex-wrap gap-2">
                  {regions.map(region => (
                    <button
                      key={region.id}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                        ${selectedRegion === region.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                      onClick={() => setSelectedRegion(region.id)}
                    >
                      <span className="text-lg">{region.flag}</span>
                      <span className="font-medium">{region.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected items count */}
            {selectedItems.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedItems.length} items selected
                </span>
                <button
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => {
                    selectedItems.forEach(item => onSelectItem({ value: item, label: item }));
                  }}
                >
                  Clear selection
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className={`
        ${viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
        }
      `}>
        <AnimatePresence>
          {items.map(item => renderItemCard(item))}
        </AnimatePresence>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading market data...</span>
          </div>
        </div>
      )}

      {/* Load more button */}
      {hasMore && !loading && items.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            onClick={loadMore}
          >
            Load More
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            No results found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketDataExplorer;