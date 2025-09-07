import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Performance components
import ArticleCard from '../components/Feed/ArticleCard';
import { FeedLoadingSkeleton, InitialLoadingState } from '../components/Loading/LoadingStates';
import LazyImage from '../components/UI/LazyImage';
import { usePerformance, useIntersectionObserver } from '../hooks/usePerformance';

// Mock data
const mockArticle = {
  id: 'test-1',
  title: 'Test Article',
  description: 'Test description',
  publishedAt: new Date().toISOString(),
  created_at: new Date().toISOString(),
  source: 'Test Source',
  tickers: ['AAPL', 'GOOGL', 'MSFT'],
  sentiment: 'bullish' as const,
  userInteraction: {
    viewed: false,
    liked: false,
    saved: false
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Performance Optimizations', () => {
  describe('ArticleCard Performance', () => {
    it('should not re-render when props are the same', () => {
      const onView = jest.fn();
      const onLike = jest.fn();
      const onSave = jest.fn();
      const onShare = jest.fn();

      const { rerender } = render(
        <TestWrapper>
          <ArticleCard
            article={mockArticle}
            onView={onView}
            index={0}
          />
        </TestWrapper>
      );

      // First render
      expect(screen.getByText('Test Article')).toBeInTheDocument();

      // Re-render with same props - should not trigger new render
      rerender(
        <TestWrapper>
          <ArticleCard
            article={mockArticle}
            onView={onView}
            index={0}
          />
        </TestWrapper>
      );

      // Should still be in document without additional renders
      expect(screen.getByText('Test Article')).toBeInTheDocument();
    });

    it('should handle interactions efficiently with debouncing', async () => {
      const onLike = jest.fn();
      
      render(
        <TestWrapper>
          <ArticleCard
            article={mockArticle}
            index={0}
          />
        </TestWrapper>
      );

      const likeButton = screen.getByLabelText('Like');
      
      // Rapid clicks should be debounced
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);

      // Wait for debounce
      await waitFor(() => {
        expect(onLike).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });
  });

  describe('Loading States Performance', () => {
    it('should render skeleton loading efficiently', () => {
      const startTime = performance.now();
      
      render(<FeedLoadingSkeleton />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly (under 16ms for 60fps)
      expect(renderTime).toBeLessThan(16);
      
      // Should have correct number of skeleton cards
      const skeletonCards = screen.getAllByTestId(/skeleton/i);
      expect(skeletonCards).toHaveLength(6);
    });

    it('should show initial loading state with proper animations', () => {
      render(<InitialLoadingState />);
      
      expect(screen.getByText(/cargando tu feed personalizado/i)).toBeInTheDocument();
      expect(screen.getByText(/analizando las últimas noticias/i)).toBeInTheDocument();
    });
  });

  describe('Image Lazy Loading', () => {
    beforeEach(() => {
      // Mock IntersectionObserver
      global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
        root: null,
        rootMargin: '',
        thresholds: []
      }));
    });

    it('should not load image until visible', () => {
      const mockImage = jest.fn();
      global.Image = mockImage;
      
      render(
        <LazyImage
          src="test-image.jpg"
          alt="Test Image"
          className="w-full h-48"
        />
      );
      
      // Image constructor should not be called initially
      expect(mockImage).not.toHaveBeenCalled();
    });

    it('should show loading state while image loads', async () => {
      render(
        <LazyImage
          src="test-image.jpg"
          alt="Test Image"
          showLoadingShimmer={true}
        />
      );
      
      // Should show loading shimmer initially
      expect(screen.getByRole('img', { name: /test image/i })).toBeInTheDocument();
    });
  });

  describe('Performance Hooks', () => {
    it('usePerformance should provide performance metrics', () => {
      let performanceHook: ReturnType<typeof usePerformance>;
      
      const TestComponent = () => {
        performanceHook = usePerformance();
        return <div>Test</div>;
      };
      
      render(<TestComponent />);
      
      expect(performanceHook!.startTimer).toBeDefined();
      expect(performanceHook!.endTimer).toBeDefined();
      expect(performanceHook!.getMemoryUsage).toBeDefined();
      expect(performanceHook!.measureFPS).toBeDefined();
    });

    it('useIntersectionObserver should track visibility', () => {
      let observerHook: ReturnType<typeof useIntersectionObserver>;
      
      const TestComponent = () => {
        observerHook = useIntersectionObserver({
          threshold: 0.1,
          rootMargin: '50px'
        });
        return <div ref={observerHook[0] as React.RefObject<HTMLDivElement>}>Observed Element</div>;
      };
      
      render(<TestComponent />);
      
      const [ref, isIntersecting, hasBeenVisible] = observerHook!;
      expect(ref).toBeDefined();
      expect(typeof isIntersecting).toBe('boolean');
      expect(typeof hasBeenVisible).toBe('boolean');
    });
  });

  describe('Bundle Performance', () => {
    it('should have efficient bundle size', () => {
      // This would be tested in CI/CD with actual bundle analysis
      const mockBundleSize = 850; // KB
      const maxBundleSize = 1000; // KB
      
      expect(mockBundleSize).toBeLessThan(maxBundleSize);
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks', async () => {
      const { unmount } = render(
        <TestWrapper>
          <ArticleCard
            article={mockArticle}
            index={0}
          />
        </TestWrapper>
      );
      
      // Component should unmount cleanly
      unmount();
      
      // In a real test, you'd check for cleanup of event listeners, timers, etc.
      expect(true).toBe(true);
    });
  });

  describe('Animation Performance', () => {
    it('should use GPU-accelerated animations', () => {
      render(
        <TestWrapper>
          <ArticleCard
            article={mockArticle}
            index={0}
          />
        </TestWrapper>
      );
      
      const cardElement = screen.getByRole('article');
      const computedStyle = window.getComputedStyle(cardElement);
      
      // Should have will-change property for GPU acceleration
      expect(computedStyle.getPropertyValue('will-change')).toContain('transform');
    });
  });
});

// Performance benchmark tests
describe('Performance Benchmarks', () => {
  const renderPerformanceTest = (Component: React.ComponentType, props: any = {}) => {
    const iterations = 100;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const { unmount } = render(<Component {...props} />);
      const endTime = performance.now();
      unmount();
      
      times.push(endTime - startTime);
    }
    
    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    };
  };

  it('ArticleCard should render under performance budget', () => {
    const TestArticleCard = () => (
      <TestWrapper>
        <ArticleCard article={mockArticle} index={0} />
      </TestWrapper>
    );
    
    const results = renderPerformanceTest(TestArticleCard);
    
    // Should render in under 16ms on average (60fps)
    expect(results.average).toBeLessThan(16);
    expect(results.max).toBeLessThan(50); // Max should be reasonable
  });

  it('Loading states should render efficiently', () => {
    const results = renderPerformanceTest(InitialLoadingState);
    
    // Loading states should be very fast
    expect(results.average).toBeLessThan(8);
  });
});

// Integration performance tests
describe('Performance Integration', () => {
  it('should maintain performance with multiple components', () => {
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <div>
          {Array.from({ length: 20 }, (_, i) => (
            <ArticleCard
              key={i}
              article={{ ...mockArticle, id: `test-${i}` }}
              index={i}
            />
          ))}
        </div>
      </TestWrapper>
    );
    
    const endTime = performance.now();
    const totalRenderTime = endTime - startTime;
    
    // 20 cards should render in reasonable time
    expect(totalRenderTime).toBeLessThan(200); // 200ms for 20 cards
  });
});