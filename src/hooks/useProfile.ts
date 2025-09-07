import { useQuery } from '@tanstack/react-query';
import { feedService } from '../services/feedService';
import { useAuth } from './useAuth';
import { UserProfile } from '../types';

export const useProfile = () => {
  const { user } = useAuth();

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['profile', user?.uid],
    queryFn: () => feedService.getProfile(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const isNewUser = () => {
    if (!profileQuery.data) return false;
    
    const profile = profileQuery.data;
    
    // Consideramos nuevo usuario si:
    // 1. No tiene intereses configurados
    // 2. No ha visto ningún artículo
    // 3. La cuenta fue creada hace menos de 24 horas
    
    const hasNoInterests = 
      (!profile.interests.tickers || profile.interests.tickers.length === 0) &&
      (!profile.interests.sectors || profile.interests.sectors.length === 0) &&
      (!profile.interests.marketTypes || profile.interests.marketTypes.length === 0);
    
    const hasNoActivity = 
      (!profile.behavior.viewedArticles || profile.behavior.viewedArticles.length === 0);
    
    // Podríamos usar esto para verificar si la cuenta es reciente
    // const isRecentlyCreated = profile.createdAt && 
    //   (new Date().getTime() - new Date(profile.createdAt).getTime()) < 24 * 60 * 60 * 1000;
    
    return hasNoInterests && hasNoActivity;
  };

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    isNewUser: isNewUser(),
    refetch: profileQuery.refetch
  };
};