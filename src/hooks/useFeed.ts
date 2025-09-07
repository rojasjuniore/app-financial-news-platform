import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feedService';
import { useAuth } from './useAuth';
import { FeedResponse } from '../types';

interface UseFeedOptions {
  limit?: number;
  offset?: number;
  includeViewed?: boolean;
  timeRange?: number;
  forceRefresh?: boolean;
  sortBy?: 'time' | 'quality' | 'personalized';
}

export const useFeed = (options: UseFeedOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para obtener feed
  const feedQuery = useQuery<FeedResponse>({
    queryKey: ['feed', options],
    queryFn: () => feedService.getFeed(options),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para trackear vista
  const trackView = useMutation({
    mutationFn: (articleId: string) => feedService.trackInteraction(articleId, 'view'),
    onSuccess: () => {
      // Invalidar cache del perfil
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  // Mutation para like
  const likeArticle = useMutation({
    mutationFn: (articleId: string) => feedService.likeArticle(articleId),
    onSuccess: (data, articleId) => {
      // Actualizar UI optimisticamente
      queryClient.setQueryData<FeedResponse>(['feed', options], (old) => {
        if (!old) return old;
        return {
          ...old,
          articles: old.articles.map(article => 
            article.id === articleId 
              ? { 
                  ...article, 
                  userInteraction: { 
                    viewed: article.userInteraction?.viewed || false,
                    saved: article.userInteraction?.saved || false,
                    liked: true 
                  } 
                }
              : article
          )
        };
      });
    }
  });

  // Mutation para guardar
  const saveArticle = useMutation({
    mutationFn: (articleId: string) => feedService.saveArticle(articleId),
    onSuccess: (data, articleId) => {
      queryClient.setQueryData<FeedResponse>(['feed', options], (old) => {
        if (!old) return old;
        return {
          ...old,
          articles: old.articles.map(article => 
            article.id === articleId 
              ? { 
                  ...article, 
                  userInteraction: { 
                    viewed: article.userInteraction?.viewed || false,
                    liked: article.userInteraction?.liked || false,
                    saved: true 
                  } 
                }
              : article
          )
        };
      });
    }
  });

  return {
    articles: feedQuery.data?.articles || [],
    isLoading: feedQuery.isLoading,
    error: feedQuery.error,
    hasMore: feedQuery.data?.hasMore,
    refetch: feedQuery.refetch,
    trackView: trackView.mutate,
    likeArticle: likeArticle.mutate,
    saveArticle: saveArticle.mutate,
    isLiking: likeArticle.isPending,
    isSaving: saveArticle.isPending
  };
};