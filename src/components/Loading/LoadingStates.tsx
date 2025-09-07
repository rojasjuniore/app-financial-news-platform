import React from 'react';
import { Loader } from 'lucide-react';

export const FeedLoadingSkeleton: React.FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse transition-colors duration-300">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
};

export const InitialLoadingState: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="text-center">
        <Loader className="animate-spin w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Cargando...</p>
      </div>
    </div>
  );
};

export const LoadingMoreState: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <Loader className="animate-spin w-4 h-4" />
      <span>Cargando más...</span>
    </div>
  );
};

export const RefreshingState: React.FC = () => {
  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 z-50 transition-colors duration-300">
      <div className="flex items-center space-x-2">
        <Loader className="animate-spin w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Actualizando feed...</span>
      </div>
    </div>
  );
};

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <div className="w-8 h-8 text-red-600 dark:text-red-400">⚠</div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{message}</h3>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; description: string; icon?: React.ReactNode }> = ({ 
  title, 
  description, 
  icon 
}) => {
  return (
    <div className="text-center py-12">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
};