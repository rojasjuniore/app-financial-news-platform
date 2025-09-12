import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/news/feedService';
import { useAuth } from './useAuth';
import { FeedResponse } from '../types';
import { useProfile } from './useProfile';

interface UseFeedOptions {
  limit?: number;
  offset?: number;
  includeViewed?: boolean;
  timeRange?: number;
  forceRefresh?: boolean;
  sortBy?: 'time' | 'quality' | 'personalized';
  onlyMyInterests?: boolean;
  minRelevanceScore?: number;
}

export const useFeed = (options: UseFeedOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  // Get user interests from profile
  const userInterests = profile?.interests || { tickers: [], sectors: [], topics: [], keywords: [] };
  
  // Aplicar opciones por defecto para personalización
  const feedOptions: any = {
    onlyMyInterests: true, // POR DEFECTO: Solo mostrar contenido de interés
    minRelevanceScore: 0, // Se usará el del perfil del usuario en el backend
    sortBy: 'personalized' as const, // POR DEFECTO: Ordenar por personalización
    ...options
  };
  
  // Only add interests parameters if they exist and have values
  if (userInterests.tickers && userInterests.tickers.length > 0) {
    feedOptions.tickers = userInterests.tickers.join(',');
  }
  if (userInterests.sectors && userInterests.sectors.length > 0) {
    feedOptions.sectors = userInterests.sectors.join(',');
  }
  if (userInterests.topics && userInterests.topics.length > 0) {
    feedOptions.topics = userInterests.topics.join(',');
  }
  if (userInterests.keywords && userInterests.keywords.length > 0) {
    feedOptions.keywords = userInterests.keywords.join(',');
  }

  // Query para obtener feed
  const feedQuery = useQuery<FeedResponse>({
    queryKey: ['feed', feedOptions],
    queryFn: () => feedService.getFeed(feedOptions),
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