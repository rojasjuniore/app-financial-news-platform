import apiClient from '../news/api';
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
  constructor() {}

  /**
   * Get comprehensive user statistics
   */
  async getUserStats(userId?: string): Promise<UserStats> {
    try {
      // apiClient already handles auth token automatically
      if (!userId) {
        throw new Error('Authentication required');
      }
      const response = await apiClient.get(`/api/users/${userId}/stats`);
      const data = response.data;
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);

      // Return default stats structure on error
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
   * Get user activity summary for the current session
   */
  async getActivitySummary(userId?: string): Promise<any> {
    try {
      // Use interactions from local service
      const interactions = articleInteractionService.getAllInteractions();

      const summary = {
        sessionDuration: Date.now() - (window as any).sessionStartTime || 0,
        articlesViewed: interactions.filter(i => i.viewed).length,
        articlesLiked: interactions.filter(i => i.liked).length,
        articlesSaved: interactions.filter(i => i.saved).length,
        totalReadingTime: interactions.reduce((acc, i) => acc + (i.viewDuration || 0), 0)
      };

      return summary;
    } catch (error) {
      console.error('Error getting activity summary:', error);
      return {
        sessionDuration: 0,
        articlesViewed: 0,
        articlesLiked: 0,
        articlesSaved: 0,
        totalReadingTime: 0
      };
    }
  }

  /**
   * Update user reading preferences based on behavior
   */
  async updateReadingPreferences(userId: string, preferences: any): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/preferences`, preferences);
    } catch (error) {
      console.error('Error updating reading preferences:', error);
    }
  }

  /**
   * Get reading recommendations based on user history
   */
  async getRecommendations(userId?: string): Promise<any[]> {
    try {
      if (!userId) {
        return [];
      }
      const response = await apiClient.get(`/api/users/${userId}/recommendations`);
      return response.data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
}

export const userStatsService = new UserStatsService();