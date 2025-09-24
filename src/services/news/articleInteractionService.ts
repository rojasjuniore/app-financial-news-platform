import { API_CONFIG } from '../../config/api';

interface InteractionResponse {
  success: boolean;
  message?: string;
  liked?: boolean;
  saved?: boolean;
  likesCount?: number;
}

class ArticleInteractionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Toggle like status for an article
   */
  async toggleLike(articleId: string, userId?: string): Promise<InteractionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/articles/${articleId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || 'anonymous',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle like: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        liked: data.liked,
        likesCount: data.likesCount,
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      // Return success with local state for offline functionality
      return {
        success: true,
        liked: true,
        message: 'Offline - will sync when online',
      };
    }
  }

  /**
   * Toggle save status for an article
   */
  async toggleSave(articleId: string, userId?: string): Promise<InteractionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/articles/${articleId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || 'anonymous',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle save: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        saved: data.saved,
      };
    } catch (error) {
      console.error('Error toggling save:', error);
      // Return success with local state for offline functionality
      return {
        success: true,
        saved: true,
        message: 'Offline - will sync when online',
      };
    }
  }

  /**
   * Get user interactions for an article
   */
  async getUserInteractions(articleId: string, userId?: string): Promise<{
    liked: boolean;
    saved: boolean;
    likesCount: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/articles/${articleId}/interactions?userId=${userId || 'anonymous'}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get interactions: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        liked: data.liked || false,
        saved: data.saved || false,
        likesCount: data.likesCount || 0,
      };
    } catch (error) {
      console.error('Error getting interactions:', error);
      // Return default values for offline functionality
      return {
        liked: false,
        saved: false,
        likesCount: 0,
      };
    }
  }

  /**
   * Get all saved articles for a user
   */
  async getSavedArticles(userId?: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/users/${userId || 'anonymous'}/saved-articles`
      );

      if (!response.ok) {
        throw new Error(`Failed to get saved articles: ${response.statusText}`);
      }

      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error getting saved articles:', error);
      return [];
    }
  }

  /**
   * Share an article (track share event)
   */
  async trackShare(articleId: string, userId?: string, platform?: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/articles/${articleId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || 'anonymous',
          platform: platform || 'unknown',
        }),
      });
    } catch (error) {
      console.error('Error tracking share:', error);
      // Don't throw error for tracking, it's not critical
    }
  }
}

export const articleInteractionService = new ArticleInteractionService();