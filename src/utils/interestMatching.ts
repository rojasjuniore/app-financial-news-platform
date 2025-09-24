import { UserInterests } from '../types';

export interface InterestMatch {
  score: number; // 0-100 interest relevance score
  matches: {
    tickers: string[];
    sectors: string[];
    topics: string[];
    keywords: string[];
  };
  totalMatches: number;
  matchTypes: string[]; // ['ticker', 'sector', 'topic', 'keyword']
}

export interface Article {
  id: string;
  title: string;
  description: string;
  content?: string;
  tickers?: string[];
  sectors?: string[];
  sentiment?: string;
  quality_score?: number;
  impact_score?: number;
}

/**
 * Calculate how well an article matches user interests
 */
export const calculateInterestMatch = (
  article: Article,
  userInterests: UserInterests
): InterestMatch => {
  const matches = {
    tickers: [] as string[],
    sectors: [] as string[],
    topics: [] as string[],
    keywords: [] as string[]
  };

  let score = 0;
  const matchTypes: string[] = [];

  // Check ticker matches (highest weight: 40 points)
  if (userInterests.tickers && article.tickers) {
    const tickerMatches = article.tickers.filter(ticker =>
      userInterests.tickers.includes(ticker.toUpperCase())
    );
    matches.tickers = tickerMatches;
    if (tickerMatches.length > 0) {
      score += Math.min(tickerMatches.length * 20, 40);
      matchTypes.push('ticker');
    }
  }

  // Check sector matches (weight: 20 points)
  if (userInterests.sectors && article.sectors) {
    const sectorMatches = article.sectors.filter(sector =>
      userInterests.sectors.some(userSector =>
        sector.toLowerCase().includes(userSector.toLowerCase()) ||
        userSector.toLowerCase().includes(sector.toLowerCase())
      )
    );
    matches.sectors = sectorMatches;
    if (sectorMatches.length > 0) {
      score += Math.min(sectorMatches.length * 10, 20);
      matchTypes.push('sector');
    }
  }

  // Check topic matches in title/description (weight: 25 points)
  if (userInterests.topics) {
    const contentToCheck = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
    const topicMatches = userInterests.topics.filter(topic =>
      contentToCheck.includes(topic.toLowerCase())
    );
    matches.topics = topicMatches;
    if (topicMatches.length > 0) {
      score += Math.min(topicMatches.length * 8, 25);
      matchTypes.push('topic');
    }
  }

  // Check keyword matches (weight: 15 points)
  if (userInterests.keywords) {
    const contentToCheck = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
    const keywordMatches = userInterests.keywords.filter(keyword =>
      contentToCheck.includes(keyword.toLowerCase())
    );
    matches.keywords = keywordMatches;
    if (keywordMatches.length > 0) {
      score += Math.min(keywordMatches.length * 5, 15);
      matchTypes.push('keyword');
    }
  }

  // Quality bonus (up to 10 points)
  if (article.quality_score && article.quality_score > 70) {
    score += Math.min((article.quality_score - 70) / 3, 10);
  }

  // Impact bonus (up to 10 points)
  if (article.impact_score && article.impact_score > 70) {
    score += Math.min((article.impact_score - 70) / 3, 10);
  }

  const totalMatches = matches.tickers.length + matches.sectors.length +
                      matches.topics.length + matches.keywords.length;

  return {
    score: Math.min(Math.round(score), 100),
    matches,
    totalMatches,
    matchTypes
  };
};

/**
 * Get interest match badge configuration
 */
export const getMatchBadge = (match: InterestMatch) => {
  if (match.score >= 80) {
    return {
      text: 'Perfect Match',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      icon: '🎯'
    };
  } else if (match.score >= 60) {
    return {
      text: 'Great Match',
      color: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      icon: '⭐'
    };
  } else if (match.score >= 40) {
    return {
      text: 'Good Match',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      icon: '👍'
    };
  } else if (match.score >= 20) {
    return {
      text: 'Some Interest',
      color: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white',
      icon: '📊'
    };
  } else if (match.totalMatches > 0) {
    return {
      text: 'Minor Interest',
      color: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
      icon: '🔍'
    };
  }
  return null;
};

/**
 * Format match details for display
 */
export const formatMatchDetails = (match: InterestMatch): string => {
  const details: string[] = [];

  if (match.matches.tickers.length > 0) {
    details.push(`${match.matches.tickers.length} ticker${match.matches.tickers.length > 1 ? 's' : ''}`);
  }
  if (match.matches.sectors.length > 0) {
    details.push(`${match.matches.sectors.length} sector${match.matches.sectors.length > 1 ? 's' : ''}`);
  }
  if (match.matches.topics.length > 0) {
    details.push(`${match.matches.topics.length} topic${match.matches.topics.length > 1 ? 's' : ''}`);
  }
  if (match.matches.keywords.length > 0) {
    details.push(`${match.matches.keywords.length} keyword${match.matches.keywords.length > 1 ? 's' : ''}`);
  }

  return details.length > 0 ? `Matches: ${details.join(', ')}` : 'No specific matches';
};