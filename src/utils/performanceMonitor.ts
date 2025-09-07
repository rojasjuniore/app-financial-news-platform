// Performance monitoring and optimization utilities

// Web Vitals monitoring
export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  });

  // Custom performance metrics
  observePerformance();
};

const sendToAnalytics = (metric: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance Metric:', metric);
  }
  
  // In production, send to your analytics service
  // Example: analytics.track('web-vital', metric);
};

// Performance observer for custom metrics
const observePerformance = () => {
  if (!('PerformanceObserver' in window)) return;

  // Observe paint metrics
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      sendToAnalytics({
        name: entry.name,
        value: entry.startTime,
        rating: entry.startTime < 2000 ? 'good' : entry.startTime < 4000 ? 'needs-improvement' : 'poor'
      });
    }
  });
  paintObserver.observe({ type: 'paint', buffered: true });

  // Observe navigation metrics
  const navigationObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const navEntry = entry as PerformanceNavigationTiming;
      sendToAnalytics({
        name: 'navigation-timing',
        value: {
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          domComplete: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
        }
      });
    }
  });
  navigationObserver.observe({ type: 'navigation', buffered: true });

  // Observe resource loading
  const resourceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const resourceEntry = entry as PerformanceResourceTiming;
      if (resourceEntry.transferSize > 100000) { // Report large resources (>100KB)
        sendToAnalytics({
          name: 'large-resource',
          value: {
            name: resourceEntry.name,
            size: resourceEntry.transferSize,
            duration: resourceEntry.duration
          }
        });
      }
    }
  });
  resourceObserver.observe({ type: 'resource', buffered: true });
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    };
  }
  return null;
};

// Bundle size analysis
export const analyzeBundlePerformance = () => {
  const scripts = document.querySelectorAll('script[src]');
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"][href]');
  
  const bundleInfo = {
    scripts: Array.from(scripts).map(script => (script as HTMLScriptElement).src),
    stylesheets: Array.from(stylesheets).map(link => (link as HTMLLinkElement).href),
    totalScripts: scripts.length,
    totalStylesheets: stylesheets.length
  };
  
  console.log('Bundle Analysis:', bundleInfo);
  return bundleInfo;
};

// Component render performance
export const measureRenderTime = (componentName: string) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
      
      // Warn about slow renders
      if (renderTime > 16) { // 60fps = 16ms per frame
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
      
      return renderTime;
    }
  };
};

// Image loading performance
export const trackImagePerformance = (src: string, loadTime: number, success: boolean) => {
  const metric = {
    name: 'image-load',
    src: src.split('/').pop(), // Just filename for privacy
    loadTime,
    success,
    rating: loadTime < 1000 ? 'good' : loadTime < 3000 ? 'needs-improvement' : 'poor'
  };
  
  sendToAnalytics(metric);
};

// Network performance monitoring
export const monitorNetworkPerformance = () => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    const networkInfo = {
      effectiveType: connection.effectiveType, // '4g', '3g', etc.
      downlink: connection.downlink, // Mb/s
      rtt: connection.rtt, // ms
      saveData: connection.saveData // boolean
    };
    
    sendToAnalytics({
      name: 'network-info',
      value: networkInfo
    });
    
    return networkInfo;
  }
  
  return null;
};

// Adaptive loading based on device capabilities
export const shouldUseOptimizations = () => {
  const networkInfo = monitorNetworkPerformance();
  const memoryInfo = getMemoryUsage();
  
  return {
    useVirtualScrolling: (
      networkInfo?.effectiveType === '2g' ||
      networkInfo?.effectiveType === '3g' ||
      (memoryInfo && memoryInfo.used > 150) // >150MB
    ),
    useLazyLoading: (
      networkInfo?.saveData === true ||
      networkInfo?.effectiveType === '2g'
    ),
    reduceAnimations: (
      networkInfo?.effectiveType === '2g' ||
      (memoryInfo && memoryInfo.percentage > 80) // >80% memory usage
    ),
    preloadImages: (
      networkInfo?.effectiveType === '4g' ||
      networkInfo?.effectiveType === '5g'
    )
  };
};

// Frame rate monitoring
export const monitorFrameRate = () => {
  let frames = 0;
  let lastTime = performance.now();
  let fps = 0;
  
  const measure = () => {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frames * 1000) / (currentTime - lastTime));
      frames = 0;
      lastTime = currentTime;
      
      // Report low FPS
      if (fps < 30) {
        console.warn(`Low FPS detected: ${fps}fps`);
        sendToAnalytics({
          name: 'low-fps',
          value: fps,
          timestamp: currentTime
        });
      }
    }
    
    requestAnimationFrame(measure);
  };
  
  requestAnimationFrame(measure);
  
  return () => fps;
};

// Bundle splitting recommendations
export const getBundleSplittingRecommendations = () => {
  return {
    recommendations: [
      'Lazy load route components with React.lazy()',
      'Split vendor libraries into separate chunks',
      'Use dynamic imports for heavy features',
      'Implement code splitting by route',
      'Consider using React.Suspense for loading states'
    ],
    implementations: {
      lazyRoute: `
        const ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'));
        
        <Suspense fallback={<LoadingState />}>
          <Route path="/article/:id" component={ArticleDetail} />
        </Suspense>
      `,
      dynamicImport: `
        const loadChartLibrary = () => {
          return import('recharts').then(module => module.LineChart);
        };
      `
    }
  };
};