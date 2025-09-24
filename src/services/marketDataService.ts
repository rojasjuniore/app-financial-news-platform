import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface MarketDataItem {
  value: string;
  label: string;
  description?: string;
  category?: string;
}

class MarketDataService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_URL}/api/market-data`;
  }

  // Search tickers with optional filters
  async searchTickers(query: string, limit: number = 20, category?: string): Promise<MarketDataItem[]> {
    try {
      const params: any = { query, limit };
      if (category) params.category = category;

      const response = await axios.get(`${this.baseURL}/tickers/search`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching tickers:', error);
      return [];
    }
  }

  // Get all available sectors
  async getSectors(query?: string): Promise<MarketDataItem[]> {
    try {
      const params: any = {};
      if (query) params.query = query;

      const response = await axios.get(`${this.baseURL}/sectors`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching sectors:', error);
      return [];
    }
  }

  // Get trading topics
  async getTopics(query?: string, category?: string): Promise<MarketDataItem[]> {
    try {
      const params: any = {};
      if (query) params.query = query;
      if (category) params.category = category;

      const response = await axios.get(`${this.baseURL}/topics`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      return [];
    }
  }

  // Get popular keywords
  async getKeywords(query?: string): Promise<MarketDataItem[]> {
    try {
      const params: any = {};
      if (query) params.query = query;

      const response = await axios.get(`${this.baseURL}/keywords`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching keywords:', error);
      return [];
    }
  }

  // Batch search for multiple types
  async searchAll(query: string): Promise<{
    tickers: MarketDataItem[];
    sectors: MarketDataItem[];
    topics: MarketDataItem[];
    keywords: MarketDataItem[];
  }> {
    try {
      const [tickers, sectors, topics, keywords] = await Promise.all([
        this.searchTickers(query, 10),
        this.getSectors(query),
        this.getTopics(query),
        this.getKeywords(query)
      ]);

      return { tickers, sectors, topics, keywords };
    } catch (error) {
      console.error('Error in batch search:', error);
      return {
        tickers: [],
        sectors: [],
        topics: [],
        keywords: []
      };
    }
  }
}

export default new MarketDataService();