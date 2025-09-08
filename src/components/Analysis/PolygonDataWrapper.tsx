import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/news/api';
import PolygonDataCardFixed from './PolygonDataCardFixed';
import { Loader, AlertCircle } from 'lucide-react';

interface PolygonDataWrapperProps {
  ticker: string;
}

const PolygonDataWrapper: React.FC<PolygonDataWrapperProps> = ({ ticker }) => {
  const { data: polygonData, isLoading, error } = useQuery({
    queryKey: ['polygon-data', ticker],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/polygon/ticker/${ticker}`);
      return data;
    },
    enabled: !!ticker,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute for live data
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (error || !polygonData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Market data unavailable for {ticker}</span>
        </div>
      </div>
    );
  }

  return <PolygonDataCardFixed polygonData={polygonData} ticker={ticker} />;
};

export default PolygonDataWrapper;