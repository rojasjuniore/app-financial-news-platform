import { API_CONFIG } from '../../config/api';
import { articleInteractionService } from '../news/articleInteractionService';

interface UserStats {
  totalLiked: number;
  totalSaved: number;
  totalViewed: number;
  totalReadingTime: number;
  articlesRead: number;
  likedArticles: any[];
  savedArticles: any[];
  recentActivity: any[];
}

class UserStatsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Get comprehensive user statistics
   */
  async getUserStats(userId?: string): Promise<UserStats> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId || 'anonymous'}/stats`);

      if (!response.ok) {
        throw new Error(`Failed to get user stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting user stats:', error);
      // Return default stats
      return {
        totalLiked: 0,
        totalSaved: 0,
        totalViewed: 0,
        totalReadingTime: 0,
        articlesRead: 0,
        likedArticles: [],
        savedArticles: [],
        recentActivity: []
      };
    }
  }

  /**
   * Get user's liked articles
   */
  async getLikedArticles(userId?: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/users/${userId || 'anonymous'}/liked-articles`
      );

      if (!response.ok) {
        throw new Error(`Failed to get liked articles: ${response.statusText}`);
      }

      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error getting liked articles:', error);
      return [];
    }
  }

  /**
   * Get user's saved articles (using existing service)
   */
  async getSavedArticles(userId?: string): Promise<any[]> {
    return articleInteractionService.getSavedArticles(userId);
  }

  /**
   * Get user's reading history
   */
  async getReadingHistory(userId?: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/users/${userId || 'anonymous'}/reading-history`
      );

      if (!response.ok) {
        throw new Error(`Failed to get reading history: ${response.statusText}`);
      }

      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error getting reading history:', error);
      return [];
    }
  }

  /**
   * Update reading time for an article
   */
  async updateReadingTime(articleId: string, timeInSeconds: number, userId?: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/articles/${articleId}/reading-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || 'anonymous',
          timeInSeconds,
        }),
      });
    } catch (error) {
      console.error('Error updating reading time:', error);
    }
  }

  /**
   * Get user activity summary
   */
  async getActivitySummary(userId?: string, days: number = 30): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/users/${userId || 'anonymous'}/activity-summary?days=${days}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get activity summary: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting activity summary:', error);
      return {
        dailyActivity: [],
        mostActiveHours: [],
        topSources: [],
        topTickers: [],
      };
    }
  }
}

export const userStatsService = new UserStatsService();