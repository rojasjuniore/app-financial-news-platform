import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface MarketDataItem {
  value: string;
  label: string;
  description?: string;
  category?: string;
  sector?: string;
  country?: string;
  exchange?: string;
  marketCap?: string;
  type?: string;
  focus?: string;
  rating?: string;
  expense?: string;
  yield?: string;
  spread?: string;
  contract?: string;
  unit?: string;
  rank?: number;
}

export interface MarketStats {
  categories: any;
  totalInstruments: number;
  lastUpdated: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  country?: string;
  exchange?: string;
  sector?: string;
  marketCap?: string;
  limit?: number;
  offset?: number;
}

class MarketDataServiceExpanded {
  private baseURL: string;
  private expandedURL: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseURL = `${API_URL}/api/market-data`;
    this.expandedURL = `${API_URL}/api/market-data-expanded/expanded`;
    this.cache = new Map();
  }

  // Cache management
  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Get market statistics
  async getMarketStats(): Promise<MarketStats | null> {
    const cacheKey = 'market-stats';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.expandedURL}/stats`);
      const data = response.data.data;
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching market stats:', error);
      return null;
    }
  }

  // Enhanced search with multiple filters
  async searchExpanded(filters: SearchFilters): Promise<MarketDataItem[]> {
    const cacheKey = `search-${JSON.stringify(filters)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.expandedURL}/search`, { params: filters });
      const data = response.data.data || [];
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error in expanded search:', error);
      return [];
    }
  }

  // Get all instruments paginated
  async getAllInstruments(offset: number = 0, limit: number = 100): Promise<{
    data: MarketDataItem[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await axios.get(`${this.expandedURL}/all`, {
        params: { offset, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all instruments:', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  // Search by specific category
  async searchByCategory(category: string, query?: string, limit: number = 50): Promise<MarketDataItem[]> {
    return this.searchExpanded({ category, query, limit });
  }

  // Get stocks by region
  async getStocksByRegion(region: 'us' | 'europe' | 'asia' | 'canada', limit: number = 50): Promise<MarketDataItem[]> {
    const regionMap: Record<string, string[]> = {
      us: ['USA', 'NYSE', 'NASDAQ'],
      europe: ['UK', 'Germany', 'France', 'Switzerland', 'Netherlands', 'Spain', 'Italy'],
      asia: ['Japan', 'China', 'Hong Kong', 'South Korea', 'India', 'Taiwan', 'Singapore'],
      canada: ['Canada', 'TSX']
    };

    const countries = regionMap[region] || [];
    const results: MarketDataItem[] = [];

    for (const country of countries) {
      const items = await this.searchExpanded({
        category: 'stocks',
        country,
        limit: Math.floor(limit / countries.length)
      });
      results.push(...items);
    }

    return results;
  }

  // Get trending/popular items
  async getPopular(category?: string): Promise<MarketDataItem[]> {
    try {
      const params: any = {};
      if (category) params.type = category;

      const response = await axios.get(`${this.baseURL}/popular`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching popular items:', error);
      return [];
    }
  }

  // Smart search with autocomplete
  async smartSearch(query: string, options?: {
    categories?: string[];
    limit?: number;
    includeMetadata?: boolean;
  }): Promise<{
    exact: MarketDataItem[];
    partial: MarketDataItem[];
    suggestions: string[];
  }> {
    const searchQuery = query.toLowerCase();
    const results = await this.searchExpanded({
      query: searchQuery,
      limit: options?.limit || 20
    });

    // Categorize results
    const exact = results.filter(item =>
      item.value.toLowerCase() === searchQuery ||
      item.label.toLowerCase() === searchQuery
    );

    const partial = results.filter(item =>
      !exact.includes(item) && (
        item.value.toLowerCase().includes(searchQuery) ||
        item.label.toLowerCase().includes(searchQuery) ||
        item.description?.toLowerCase().includes(searchQuery)
      )
    );

    // Generate suggestions
    const suggestions = [...new Set([
      ...results.map(item => item.value),
      ...results.map(item => item.label)
    ])].slice(0, 5);

    return { exact, partial, suggestions };
  }

  // Get categories with counts
  async getCategoriesWithCounts(): Promise<Array<{
    id: string;
    name: string;
    count: number;
    icon?: string;
  }>> {
    try {
      const response = await axios.get(`${this.baseURL}/categories`);
      const categories = response.data.data || [];

      // Add icons
      const iconMap: Record<string, string> = {
        stocks: '📈',
        crypto: '₿',
        forex: '💱',
        commodities: '🛢️',
        etfs: '📊',
        indices: '📉',
        bonds: '📜',
        reits: '🏢',
        options: '⚙️',
        mutualfunds: '💼'
      };

      return categories.map((cat: any) => ({
        ...cat,
        icon: iconMap[cat.id] || '📊'
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Batch search multiple queries
  async batchSearch(queries: string[], limit: number = 10): Promise<Map<string, MarketDataItem[]>> {
    const results = new Map<string, MarketDataItem[]>();

    const searchPromises = queries.map(async query => {
      const items = await this.searchExpanded({ query, limit });
      return { query, items };
    });

    const searchResults = await Promise.all(searchPromises);
    searchResults.forEach(({ query, items }) => {
      results.set(query, items);
    });

    return results;
  }

  // Get real-time quotes (mock for now)
  async getRealTimeQuotes(symbols: string[]): Promise<Map<string, {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: string;
  }>> {
    const quotes = new Map();

    // Mock data - in production, this would connect to real-time data feed
    symbols.forEach(symbol => {
      quotes.set(symbol, {
        symbol,
        price: Math.random() * 1000,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 1000000),
        timestamp: new Date().toISOString()
      });
    });

    return quotes;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get sectors (legacy compatibility)
  async getSectors(query?: string): Promise<MarketDataItem[]> {
    try {
      const response = await axios.get(`${this.baseURL}/sectors`, {
        params: query ? { query } : {}
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching sectors:', error);
      return [];
    }
  }

  // Get topics (legacy compatibility)
  async getTopics(query?: string): Promise<MarketDataItem[]> {
    try {
      const response = await axios.get(`${this.baseURL}/topics`, {
        params: query ? { query } : {}
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      return [];
    }
  }

  // Get keywords (legacy compatibility)
  async getKeywords(query?: string): Promise<MarketDataItem[]> {
    try {
      const response = await axios.get(`${this.baseURL}/keywords`, {
        params: query ? { query } : {}
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching keywords:', error);
      return [];
    }
  }
}

export default new MarketDataServiceExpanded();