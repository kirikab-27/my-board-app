// Phase 5: Advanced Performance Optimization Utilities
import React from 'react';

// Phase 5: CSS Critical Path Optimization
export const criticalCSS = {
  // Inline critical CSS for above-the-fold content
  inlineCriticalStyles: () => `
    /* Critical CSS for First Paint optimization */
    body { 
      margin: 0; 
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: #fafafa;
    }
    
    /* AppBar critical styles for LCP */
    .MuiAppBar-root {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1100;
      background-color: #1976d2;
      min-height: 64px;
      box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2);
    }
    
    /* Skeleton loading animation */
    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading-shimmer 1.5s infinite;
    }
    
    @keyframes loading-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Container critical styles */
    .MuiContainer-root {
      padding-left: 16px;
      padding-right: 16px;
      margin-left: auto;
      margin-right: auto;
    }
    
    /* Typography critical styles */
    .MuiTypography-h4 {
      font-size: 2.125rem;
      font-weight: 400;
      line-height: 1.235;
      letter-spacing: 0.00735em;
    }
  `,
  
  // Resource hints for external resources
  generateResourceHints: () => ({
    preconnect: [
      'https://res.cloudinary.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    dnsPrefetch: [
      '//res.cloudinary.com',
      '//fonts.googleapis.com',
      '//fonts.gstatic.com',
    ],
    preload: [
      {
        href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
        as: 'style',
      },
    ],
  }),
};

// Phase 5: Image Optimization Utilities
export const imageOptimization = {
  // Auto-generate optimal image sizes based on viewport
  generateResponsiveSizes: (breakpoints: { sm: number; md: number; lg: number }) => {
    return `(max-width: ${breakpoints.sm}px) 100vw, 
            (max-width: ${breakpoints.md}px) 50vw, 
            (max-width: ${breakpoints.lg}px) 33vw, 
            25vw`;
  },
  
  // Determine if image should be prioritized (above-the-fold)
  shouldPrioritizeImage: (index: number, maxPriority: number = 3) => {
    return index < maxPriority;
  },
  
  // Generate blur data URL for placeholder
  generateBlurDataURL: (width: number = 10, height: number = 10) => {
    // Simple base64 blur placeholder
    return `data:image/svg+xml;base64,${btoa(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>`
    )}`;
  },
};

// Phase 5: JavaScript Bundle Optimization
export const bundleOptimization = {
  // Lazy loading utilities
  createLazyComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ) => {
    return React.lazy(importFn);
  },
  
  // Preload critical chunks
  preloadCriticalChunks: () => {
    if (typeof window === 'undefined') return;
    
    // Preload critical routes
    const criticalRoutes = ['/board', '/timeline', '/users'];
    criticalRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  },
  
  // Dynamic import with retry logic
  dynamicImportWithRetry: async <T>(
    importFn: () => Promise<T>, 
    retries: number = 3
  ): Promise<T> => {
    try {
      return await importFn();
    } catch (error) {
      if (retries > 0) {
        console.warn(`Import failed, retrying... (${retries} attempts left)`);
        return bundleOptimization.dynamicImportWithRetry(importFn, retries - 1);
      }
      throw error;
    }
  },
};

// Phase 5: Performance Monitoring
export const performanceMonitoring = {
  // Measure and report Core Web Vitals
  measureCoreWebVitals: () => {
    if (typeof window === 'undefined') return;
    
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const lcp = entry.startTime;
        console.log('🎯 LCP:', lcp.toFixed(2), 'ms');
        
        // Report to analytics if needed
        if (lcp > 2500) {
          console.warn('⚠️ LCP above 2.5s threshold');
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay (FID) - via polyfill
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        console.log('🎯 FID:', fid.toFixed(2), 'ms');
        
        if (fid > 100) {
          console.warn('⚠️ FID above 100ms threshold');
        }
      }
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      console.log('🎯 CLS:', clsValue.toFixed(4));
      
      if (clsValue > 0.1) {
        console.warn('⚠️ CLS above 0.1 threshold');
      }
    }).observe({ entryTypes: ['layout-shift'] });
  },
  
  // Track resource loading performance
  trackResourcePerformance: () => {
    if (typeof window === 'undefined') return;
    
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        const loadTime = resource.responseEnd - resource.requestStart;
        
        console.log('📦 Resource:', resource.name, 'loaded in', loadTime.toFixed(2), 'ms');
        
        // Alert on slow resources
        if (loadTime > 1000) {
          console.warn('⚠️ Slow resource detected:', resource.name);
        }
      }
    }).observe({ entryTypes: ['resource'] });
  },
};

// Phase 5: Export all optimization utilities
export const performanceOptimization = {
  criticalCSS,
  imageOptimization,
  bundleOptimization,
  performanceMonitoring,
};