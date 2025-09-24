// API Configuration
export const API_CONFIG = {
  // Backend API URL
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',

  // API Endpoints
  ENDPOINTS: {
    // News endpoints
    NEWS: '/api/news',
    FEED: '/api/news/feed',
    ARTICLES: '/api/articles',

    // User endpoints
    USER_PREFERENCES: '/api/users/preferences',
    USER_ACTIVITY: '/api/tracking/activity',

    // Analysis endpoints
    SENTIMENT: '/api/sentiment',
    ANALYSIS: '/api/analysis',

    // Market data endpoints
    MARKET_DATA: '/api/market-data',
    TRADINGVIEW: '/api/tradingview',
  },

  // Request configuration
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },

  // Timeout settings (in milliseconds)
  TIMEOUT: 30000,

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
};