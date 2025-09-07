// Tipos principales para la aplicación

export type MarketType = 'stocks' | 'crypto' | 'forex';
export type Sentiment = 'very_bullish' | 'bullish' | 'positive' | 'neutral' | 'negative' | 'bearish' | 'very_bearish';
export type Interaction = 'view' | 'like' | 'save' | 'share' | 'read_complete';

// Firestore timestamp type
export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface Article {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string | FirestoreTimestamp;
  published_at?: string | FirestoreTimestamp;
  createdAt?: string | FirestoreTimestamp;
  created_at?: string | FirestoreTimestamp;
  source?: string | { name: string; id?: string };
  tickers?: string[];
  market_type?: MarketType;
  sentiment?: Sentiment;
  llm_analysis?: LLMAnalysis;
  quality_classification?: QualityClassification;
  userInteraction?: {
    viewed: boolean;
    liked: boolean;
    saved: boolean;
  };
  personalization?: {
    score: number;
    reason: string;
    matchedInterests: {
      tickers: string[];
      sectors: string[];
      topics: string[];
    };
  };
}

export interface LLMAnalysis {
  technical_analysis?: {
    trend: string;
    key_levels: Record<string, any>;
    indicators: Record<string, any>;
    price_action?: string;
    outlook?: string;
  };
  sentiment_analysis?: {
    overall_sentiment: string;
    confidence: number;
    key_factors: string[];
    market_impact: string;
  };
  trading_plan?: {
    entry_points: string[];
    stop_loss: string;
    take_profit: string[];
    risk_reward: number;
    strategy: string;
    time_horizon?: string;
  };
  polygon_data?: {
    price: {
      current: number;
      change: number;
      changePercent: number;
    };
    volume: number;
    technicals: {
      rsi?: string;
      sma20?: string;
      sma50?: string;
      volume?: {
        trend: string;
        recent: number;
        average: number;
      };
    };
    levels: {
      support?: string[];
      resistance?: string[];
      pivot?: number;
    };
    signals: {
      recommendation: string;
      bullish_signals: number;
      bearish_signals: number;
      signals: string[];
    };
  };
  // 🤖 Metadata del análisis generado por IA
  generated_at?: string;
  model_used?: 'openai' | 'claude' | 'gemini' | 'grok';
  version?: string;
  ai_personality?: string;
  no_ticker_message?: string;
}

export interface FeedResponse {
  success: boolean;
  articles: Article[];
  totalCount: number;
  hasMore: boolean;
  feedMetadata?: {
    generatedAt: string;
    userInterests: UserInterests;
    scoringFactors: Record<string, number>;
  };
}

export interface UserProfile {
  userId: string;
  interests: UserInterests;
  preferences: UserPreferences;
  behavior: UserBehavior;
  scoring: {
    engagementScore: number;
    expertiseLevel: string;
    preferredComplexity: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserInterests {
  tickers: string[];
  sectors: string[];
  topics: string[];
  marketTypes: MarketType[];
}

export interface UserPreferences {
  sentimentBias: 'bullish' | 'bearish' | 'balanced';
  riskTolerance: 'low' | 'medium' | 'high';
  timeHorizon: 'day_trading' | 'short_term' | 'medium_term' | 'long_term';
  newsFrequency: 'high' | 'moderate' | 'low';
}

export interface UserBehavior {
  viewedArticles: string[];
  likedArticles: string[];
  savedArticles: string[];
  searchHistory: string[];
  tickerClicks: Record<string, number>;
  categoryViews: Record<string, number>;
  avgReadTime: number;
  lastActive: string;
}

export interface ChatSession {
  id?: string;
  sessionId?: string;
  userId: string;
  articleId: string;
  articleTitle?: string;
  articleTickers?: string[];
  messages: ChatMessage[] | any[];
  context?: {
    article: Article;
    userQuery?: string;
  };
  metadata?: {
    startedAt: string;
    lastMessageAt: string;
    messageCount: number;
  };
  createdAt?: string;
  lastActivity?: string;
  totalMessages?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  findings?: any;
}

export interface TrendingItem {
  ticker: string;
  interactions: number;
  change?: number;
}

export type QualityLevel = 'HIGH_QUALITY' | 'MEDIUM_QUALITY' | 'LOW_QUALITY' | 'SPAM_OR_JUNK';

export interface QualityClassification {
  score: number;
  label: QualityLevel;
  quality_level: number;
  should_save: boolean;
  reasons: string[];
  breakdown?: {
    basic_features?: number;
    content_quality?: number;
    source_reliability?: number;
    finbert_sentiment?: number;
  };
  metadata?: {
    classified_at?: string;
    classifier_version?: string;
    method?: string;
  };
}