import { Article, UserInterests, UserPreferences, UserBehavior } from '../types';
import { getSentimentString } from './sentimentHelpers';

/**
 * Advanced Personalization Algorithm
 * Calculates personalization scores for articles based on user interests, preferences, and behavior
 */

export interface PersonalizationScore {
  score: number;
  reason: string;
  matchedInterests: {
    tickers: string[];
    sectors: string[];
    topics: string[];
  };
  factors: {
    interestMatch: number;
    behaviorMatch: number;
    sentimentMatch: number;
    timeRelevance: number;
    qualityScore: number;
    trendingBoost: number;
  };
}

export class PersonalizationAlgorithm {
  // Configuration weights for different scoring factors
  private static readonly WEIGHTS = {
    INTEREST_MATCH: 0.35,     // How well article matches user interests
    BEHAVIOR_MATCH: 0.25,     // Based on past interactions
    SENTIMENT_MATCH: 0.15,    // Sentiment preference alignment  
    TIME_RELEVANCE: 0.10,     // Recency of the article
    QUALITY_SCORE: 0.10,      // Article quality rating
    TRENDING_BOOST: 0.05      // Trending popularity boost
  };

  /**
   * Calculate personalization score for an article
   */
  static calculateScore(
    article: Article,
    interests: UserInterests,
    preferences: UserPreferences,
    behavior?: UserBehavior,
    trendingTickers?: string[]
  ): PersonalizationScore {
    
    const factors = {
      interestMatch: this.calculateInterestMatch(article, interests),
      behaviorMatch: this.calculateBehaviorMatch(article, behavior),
      sentimentMatch: this.calculateSentimentMatch(article, preferences),
      timeRelevance: this.calculateTimeRelevance(article, preferences),
      qualityScore: this.calculateQualityScore(article),
      trendingBoost: this.calculateTrendingBoost(article, trendingTickers)
    };

    // Calculate weighted final score
    const score = Math.round(
      factors.interestMatch * this.WEIGHTS.INTEREST_MATCH +
      factors.behaviorMatch * this.WEIGHTS.BEHAVIOR_MATCH +
      factors.sentimentMatch * this.WEIGHTS.SENTIMENT_MATCH +
      factors.timeRelevance * this.WEIGHTS.TIME_RELEVANCE +
      factors.qualityScore * this.WEIGHTS.QUALITY_SCORE +
      factors.trendingBoost * this.WEIGHTS.TRENDING_BOOST
    );

    const matchedInterests = this.getMatchedInterests(article, interests);
    const reason = this.generateReason(factors, matchedInterests);

    return {
      score: Math.max(0, Math.min(100, score)),
      reason,
      matchedInterests,
      factors
    };
  }

  /**
   * Calculate how well article matches user's explicit interests
   */
  private static calculateInterestMatch(article: Article, interests: UserInterests): number {
    let score = 0;
    let maxPossibleScore = 0;

    // Ticker matching (highest weight)
    if (interests.tickers?.length > 0) {
      maxPossibleScore += 40;
      const articleTickers = article.tickers || [];
      const matchedTickers = articleTickers.filter(ticker => 
        interests.tickers.some(userTicker => 
          userTicker.toLowerCase() === ticker.toLowerCase()
        )
      );

      if (matchedTickers.length > 0) {
        // Apply weights if available
        if (interests.weights?.tickers) {
          score += matchedTickers.reduce((sum, ticker) => {
            const weight = interests.weights!.tickers[ticker] || 50;
            return sum + (weight / 100) * 40;
          }, 0) / matchedTickers.length;
        } else {
          score += (matchedTickers.length / Math.max(articleTickers.length, 1)) * 40;
        }
      }
    }

    // Sector matching (medium weight)
    if (interests.sectors?.length > 0) {
      maxPossibleScore += 25;
      const articleSector = this.extractSectorFromArticle(article);
      if (articleSector) {
        const matchedSectors = interests.sectors.filter(sector =>
          sector.toLowerCase() === articleSector.toLowerCase() ||
          articleSector.toLowerCase().includes(sector.toLowerCase())
        );

        if (matchedSectors.length > 0) {
          if (interests.weights?.sectors) {
            score += matchedSectors.reduce((sum, sector) => {
              const weight = interests.weights!.sectors[sector] || 50;
              return sum + (weight / 100) * 25;
            }, 0) / matchedSectors.length;
          } else {
            score += 25;
          }
        }
      }
    }

    // Topic matching (medium weight)  
    if (interests.topics?.length > 0) {
      maxPossibleScore += 25;
      const matchedTopics = this.findMatchedTopics(article, interests.topics);
      
      if (matchedTopics.length > 0) {
        if (interests.weights?.topics) {
          score += matchedTopics.reduce((sum, topic) => {
            const weight = interests.weights!.topics[topic] || 50;
            return sum + (weight / 100) * 25;
          }, 0) / matchedTopics.length;
        } else {
          score += (matchedTopics.length / interests.topics.length) * 25;
        }
      }
    }

    // Market type matching (low weight)
    if (interests.marketTypes?.length > 0) {
      maxPossibleScore += 10;
      if (article.market_type && interests.marketTypes.includes(article.market_type)) {
        score += 10;
      }
    }

    // Normalize to 0-100 scale
    return maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;
  }

  /**
   * Calculate score based on user's past behavior
   */
  private static calculateBehaviorMatch(article: Article, behavior?: UserBehavior): number {
    if (!behavior) return 50; // Neutral score for new users

    let score = 0;
    let factors = 0;

    // Check ticker interaction history
    if (article.tickers && behavior.tickerClicks) {
      const tickerInteractions = article.tickers.reduce((sum, ticker) => {
        return sum + (behavior.tickerClicks[ticker] || 0);
      }, 0);

      if (tickerInteractions > 0) {
        score += Math.min(40, tickerInteractions * 5); // Cap at 40 points
        factors++;
      }
    }

    // Check category preferences
    if (article.market_type && behavior.categoryViews) {
      const categoryViews = behavior.categoryViews[article.market_type] || 0;
      if (categoryViews > 0) {
        score += Math.min(30, categoryViews * 3); // Cap at 30 points
        factors++;
      }
    }

    // Check if similar articles were liked/saved
    const articleSentiment = article.sentiment;
    if (articleSentiment && behavior.likedArticles?.length > 0) {
      // This would require fetching liked articles to compare - simplified for now
      score += 20; // Boost for users with engagement history
      factors++;
    }

    return factors > 0 ? Math.min(100, score / factors) : 50;
  }

  /**
   * Calculate sentiment preference match
   */
  private static calculateSentimentMatch(article: Article, preferences: UserPreferences): number {
    if (!article.sentiment || preferences.sentimentBias === 'balanced') {
      return 50; // Neutral score
    }

    const articleSentiment = getSentimentString(article.sentiment).toLowerCase();
    const userBias = preferences.sentimentBias;

    // Map sentiment to numeric values
    const sentimentScore: { [key: string]: number } = {
      'very_bullish': 100,
      'bullish': 80,
      'positive': 70,
      'neutral': 50,
      'negative': 30,
      'bearish': 20,
      'very_bearish': 0
    };

    const articleScore = sentimentScore[articleSentiment] ?? 50;

    if (userBias === 'bullish') {
      return articleScore; // Higher scores for positive sentiment
    } else if (userBias === 'bearish') {
      return 100 - articleScore; // Higher scores for negative sentiment
    }

    return 50; // Should not reach here, but safe fallback
  }

  /**
   * Calculate time relevance based on article age and user preferences
   */
  private static calculateTimeRelevance(article: Article, preferences: UserPreferences): number {
    const publishedAt = article.publishedAt || article.published_at;
    if (!publishedAt) return 50;

    // Handle both string and FirestoreTimestamp formats
    let articleDate: Date;
    if (typeof publishedAt === 'string') {
      articleDate = new Date(publishedAt);
    } else {
      // FirestoreTimestamp has _seconds property
      articleDate = new Date(publishedAt._seconds * 1000);
    }
    
    const now = new Date();
    const ageInHours = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);

    // Adjust relevance based on user's time horizon preference
    const timeHorizon = preferences.timeHorizon;
    
    if (timeHorizon === 'day_trading') {
      // Day traders prefer very recent news
      if (ageInHours <= 1) return 100;
      if (ageInHours <= 4) return 80;
      if (ageInHours <= 12) return 60;
      if (ageInHours <= 24) return 40;
      return 20;
    } else if (timeHorizon === 'short_term') {
      // Short-term traders can handle slightly older news
      if (ageInHours <= 4) return 100;
      if (ageInHours <= 12) return 90;
      if (ageInHours <= 48) return 70;
      if (ageInHours <= 168) return 50; // 1 week
      return 30;
    } else if (timeHorizon === 'medium_term') {
      // Medium-term focus on weekly trends
      if (ageInHours <= 24) return 100;
      if (ageInHours <= 168) return 90; // 1 week
      if (ageInHours <= 720) return 70; // 1 month
      return 50;
    } else { // long_term
      // Long-term investors care less about recency
      if (ageInHours <= 168) return 100; // 1 week
      if (ageInHours <= 720) return 90; // 1 month
      if (ageInHours <= 2160) return 80; // 3 months
      return 70;
    }
  }

  /**
   * Calculate quality score based on article metadata
   */
  private static calculateQualityScore(article: Article): number {
    let score = 50; // Base score

    // Check if article has quality classification
    if (article.quality_classification) {
      const qualityLabel = article.quality_classification.label;
      switch (qualityLabel) {
        case 'HIGH_QUALITY':
          score = 90;
          break;
        case 'MEDIUM_QUALITY':
          score = 70;
          break;
        case 'LOW_QUALITY':
          score = 30;
          break;
        case 'SPAM_OR_JUNK':
          score = 10;
          break;
        default:
          score = 50;
      }
    }

    // Boost for articles with LLM analysis
    if (article.llm_analysis) {
      score = Math.min(100, score + 10);
    }

    // Boost for articles with multiple tickers (indicates broader market relevance)
    if (article.tickers && article.tickers.length > 1) {
      score = Math.min(100, score + 5);
    }

    // Penalize articles without descriptions
    if (!article.description || article.description.trim().length < 50) {
      score = Math.max(0, score - 10);
    }

    return score;
  }

  /**
   * Calculate trending boost for popular tickers
   */
  private static calculateTrendingBoost(article: Article, trendingTickers?: string[]): number {
    if (!trendingTickers || !article.tickers) return 0;

    const matchedTrending = article.tickers.filter(ticker =>
      trendingTickers.includes(ticker.toLowerCase())
    );

    return matchedTrending.length > 0 ? 20 : 0;
  }

  /**
   * Extract sector information from article
   */
  private static extractSectorFromArticle(article: Article): string | null {
    // This would typically use NLP or predefined mappings
    // Simplified version using keywords
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    const sectorKeywords: { [key: string]: string[] } = {
      'technology': ['tech', 'software', 'ai', 'artificial intelligence', 'cloud', 'cybersecurity'],
      'healthcare': ['health', 'pharma', 'biotech', 'medical', 'drug'],
      'finance': ['bank', 'financial', 'insurance', 'credit', 'lending'],
      'energy': ['oil', 'gas', 'renewable', 'solar', 'energy', 'electric'],
      'retail': ['retail', 'consumer', 'shopping', 'e-commerce'],
      'automotive': ['car', 'automotive', 'vehicle', 'electric vehicle', 'ev']
    };

    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return sector;
      }
    }

    return null;
  }

  /**
   * Find matched topics in article content
   */
  private static findMatchedTopics(article: Article, userTopics: string[]): string[] {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    return userTopics.filter(topic =>
      text.includes(topic.toLowerCase())
    );
  }

  /**
   * Get matched interests for explanation
   */
  private static getMatchedInterests(article: Article, interests: UserInterests) {
    const matchedTickers = (article.tickers || []).filter(ticker =>
      interests.tickers?.some(userTicker =>
        userTicker.toLowerCase() === ticker.toLowerCase()
      )
    );

    const matchedSectors = interests.sectors?.filter(sector => {
      const articleSector = this.extractSectorFromArticle(article);
      return articleSector && sector.toLowerCase() === articleSector.toLowerCase();
    }) || [];

    const matchedTopics = this.findMatchedTopics(article, interests.topics || []);

    return {
      tickers: matchedTickers,
      sectors: matchedSectors,
      topics: matchedTopics
    };
  }

  /**
   * Generate human-readable reason for the score
   */
  private static generateReason(factors: any, matchedInterests: any): string {
    const reasons: string[] = [];

    if (factors.interestMatch > 70) {
      if (matchedInterests.tickers.length > 0) {
        reasons.push(`Matches your interest in ${matchedInterests.tickers.join(', ')}`);
      }
      if (matchedInterests.sectors.length > 0) {
        reasons.push(`Related to ${matchedInterests.sectors.join(', ')} sector`);
      }
      if (matchedInterests.topics.length > 0) {
        reasons.push(`Covers topics: ${matchedInterests.topics.join(', ')}`);
      }
    }

    if (factors.behaviorMatch > 70) {
      reasons.push('Based on your reading history');
    }

    if (factors.sentimentMatch > 70) {
      reasons.push('Matches your sentiment preference');
    }

    if (factors.timeRelevance > 80) {
      reasons.push('Recent and timely');
    }

    if (factors.qualityScore > 80) {
      reasons.push('High-quality content');
    }

    if (factors.trendingBoost > 0) {
      reasons.push('Currently trending');
    }

    return reasons.length > 0 
      ? reasons.join('; ')
      : 'General market relevance';
  }

  /**
   * Sort articles by personalization score
   */
  static sortArticlesByScore(
    articles: Article[],
    interests: UserInterests,
    preferences: UserPreferences,
    behavior?: UserBehavior,
    trendingTickers?: string[]
  ): Array<Article & { personalization: PersonalizationScore }> {
    
    return articles
      .map(article => ({
        ...article,
        personalization: this.calculateScore(article, interests, preferences, behavior, trendingTickers)
      }))
      .sort((a, b) => b.personalization.score - a.personalization.score);
  }

  /**
   * Filter articles by minimum score threshold
   */
  static filterByScore(
    articles: Array<Article & { personalization: PersonalizationScore }>,
    minScore: number = 30
  ): Array<Article & { personalization: PersonalizationScore }> {
    return articles.filter(article => article.personalization.score >= minScore);
  }
}

export default PersonalizationAlgorithm;