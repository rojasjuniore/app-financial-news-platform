import React, { Suspense } from 'react';
import { InitialLoadingState, FeedLoadingSkeleton } from './Loading/LoadingStates';

// Lazy-loaded components for code splitting
const LazyFeed = React.lazy(() => import('../pages/Feed'));
const LazyArticleDetail = React.lazy(() => import('../pages/ArticleDetailClean'));
const LazyLogin = React.lazy(() => import('../pages/Login'));
// const LazyVirtualizedFeedList = React.lazy(() => import('./Feed/VirtualizedFeedList'));
const LazyTwitterStyleFeed = React.lazy(() => import('./Feed/TwitterStyleFeed'));

// Higher-order component for lazy loading with error boundary
const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode = <InitialLoadingState />
) => {
  const LazyComponent: React.FC<P> = (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );

  LazyComponent.displayName = `LazyLoading(${Component.displayName || Component.name})`;
  return LazyComponent;
};

// Pre-configured lazy components with appropriate loading states
export const LazyFeedPage = withLazyLoading(LazyFeed, <InitialLoadingState />);
export const LazyArticleDetailPage = withLazyLoading(LazyArticleDetail, <InitialLoadingState />);
export const LazyLoginPage = withLazyLoading(LazyLogin, <InitialLoadingState />);
// export const LazyVirtualizedFeed = withLazyLoading(LazyVirtualizedFeedList, <FeedLoadingSkeleton />);
export const LazyTwitterFeed = withLazyLoading(LazyTwitterStyleFeed, <FeedLoadingSkeleton />);

// Dynamic import utilities
export const loadComponentAsync = async <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): Promise<T> => {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.error('Failed to load component:', error);
    throw error;
  }
};

// Preload components for better UX
export const preloadComponents = () => {
  // Preload critical components when the app is idle
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      import('../pages/ArticleDetailClean');
      // import('./Feed/VirtualizedFeedList');
      import('./Feed/TwitterStyleFeed');
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      import('../pages/ArticleDetailClean');
      // import('./Feed/VirtualizedFeedList');
      import('./Feed/TwitterStyleFeed');
    }, 2000);
  }
};

// Component for handling lazy loading errors
export const LazyErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message.includes('Loading chunk')) {
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 p-8">
        <div className="text-6xl mb-4">🔄</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Error cargando el componente
        </h3>
        <p className="text-gray-600 mb-4 text-center">
          Hubo un problema cargando esta página. Por favor, recarga la página.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Recargar página
        </button>
      </div>
    );
  }

  return <>{children}</>;
};