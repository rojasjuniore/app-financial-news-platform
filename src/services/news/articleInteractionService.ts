import apiClient from './api';

interface InteractionResponse {
  success: boolean;
  message?: string;
  liked?: boolean;
  saved?: boolean;
  likesCount?: number;
}

class ArticleInteractionService {
  constructor() {}

  /**
   * Toggle like status for an article
   */
  async toggleLike(articleId: string, userId?: string): Promise<InteractionResponse> {
    try {
      const response = await apiClient.post(`/api/articles/${articleId}/like`, {
        userId: userId || 'anonymous',
      });

      if (response.status === 200) {
        return response.data;
      }

      return {
        success: false,
        message: 'Failed to toggle like'
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      return {
        success: false,
        message: 'Error toggling like'
      };
    }
  }

  /**
   * Save or unsave an article
   */
  async toggleSave(articleId: string, userId?: string): Promise<InteractionResponse> {
    try {
      const response = await apiClient.post(`/api/articles/${articleId}/save`, {
        userId: userId || 'anonymous',
      });

      if (response.status === 200) {
        return response.data;
      }

      return {
        success: false,
        message: 'Failed to save article'
      };
    } catch (error) {
      console.error('Error saving article:', error);
      return {
        success: false,
        message: 'Error saving article'
      };
    }
  }

  /**
   * Get interaction status for an article
   */
  async getInteractionStatus(articleId: string, userId?: string): Promise<{
    liked: boolean;
    saved: boolean;
    likesCount: number;
  }> {
    try {
      const response = await apiClient.get(
        `/api/articles/${articleId}/interactions?userId=${userId || 'anonymous'}`
      );

      if (response.status === 200) {
        return response.data;
      }

      return {
        liked: false,
        saved: false,
        likesCount: 0
      };
    } catch (error) {
      console.error('Error fetching interaction status:', error);
      return {
        liked: false,
        saved: false,
        likesCount: 0
      };
    }
  }

  /**
   * Get user interactions for an article (alias for getInteractionStatus for backward compatibility)
   */
  async getUserInteractions(articleId: string, userId?: string): Promise<{
    liked: boolean;
    saved: boolean;
    likesCount: number;
  }> {
    return this.getInteractionStatus(articleId, userId);
  }

  /**
   * Track article view
   */
  async trackView(articleId: string, userId?: string): Promise<void> {
    try {
      await apiClient.post(
        `/api/articles/${articleId}/view`,
        {
          userId: userId || 'anonymous',
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  /**
   * Track article share
   */
  async trackShare(articleId: string, platform: string, userId?: string): Promise<void> {
    try {
      await apiClient.post(`/api/articles/${articleId}/share`, {
        userId: userId || 'anonymous',
        platform,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  }

  /**
   * Get all user interactions (for local state management)
   */
  getAllInteractions(): any[] {
    try {
      const stored = localStorage.getItem('article_interactions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Store interaction locally
   */
  storeInteractionLocally(articleId: string, interaction: any): void {
    try {
      const interactions = this.getAllInteractions();
      const index = interactions.findIndex(i => i.articleId === articleId);

      if (index >= 0) {
        interactions[index] = { ...interactions[index], ...interaction };
      } else {
        interactions.push({ articleId, ...interaction });
      }

      localStorage.setItem('article_interactions', JSON.stringify(interactions));
    } catch (error) {
      console.error('Error storing interaction locally:', error);
    }
  }
}

export const articleInteractionService = new ArticleInteractionService();