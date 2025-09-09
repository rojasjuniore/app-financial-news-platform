import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesService } from '../services/news/articlesService';
import { feedService } from '../services/news/feedService';
import { FeedResponse } from '../types';

interface UseLatestNewsOptions {
  limit?: number;
  offset?: number;
  timeRange?: number;
}

export const useLatestNews = (options: UseLatestNewsOptions = {}) => {
  const queryClient = useQueryClient();

  // Query para obtener artículos más recientes (SIN personalización)
  const latestNewsQuery = useQuery<FeedResponse>({
    queryKey: ['latestNews', options],
    queryFn: () => {
      console.log('🔄 [useLatestNews] Fetching from /api/articles/latest with options:', options);
      return articlesService.getLatestArticles(options);
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Auto-refresh cada 5 minutos
  });

  // Mutation para trackear vista (solo tracking, sin personalización)
  const trackView = useMutation({
    mutationFn: (articleId: string) => feedService.trackInteraction(articleId, 'view'),
    // No invalidamos queries de personalización aquí
  });

  // Mutation para like
  const likeArticle = useMutation({
    mutationFn: (articleId: string) => feedService.likeArticle(articleId),
    onSuccess: (data, articleId) => {
      // Actualizar UI optimisticamente en latest news
      queryClient.setQueryData<FeedResponse>(['latestNews', options], (old) => {
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
      queryClient.setQueryData<FeedResponse>(['latestNews', options], (old) => {
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
    articles: latestNewsQuery.data?.articles || [],
    totalCount: latestNewsQuery.data?.totalCount || 0,
    isLoading: latestNewsQuery.isLoading,
    error: latestNewsQuery.error,
    hasMore: latestNewsQuery.data?.hasMore || false,
    refetch: latestNewsQuery.refetch,
    trackView: trackView.mutate,
    likeArticle: likeArticle.mutate,
    saveArticle: saveArticle.mutate,
    isLiking: likeArticle.isPending,
    isSaving: saveArticle.isPending
  };
};