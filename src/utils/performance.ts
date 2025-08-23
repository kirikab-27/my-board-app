// Performance monitoring utilities for Phase 4 infinite scroll

interface PerformanceMetrics {
  loadTime: number;
  itemsLoaded: number;
  scrollPosition: number;
  memoryUsage?: number;
  timestamp: number;
}

export class InfiniteScrollPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private observer?: PerformanceObserver;

  constructor() {
    this.initPerformanceObserver();
  }

  private initPerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.includes('infinite-scroll')) {
              console.log('🚀 Performance:', entry.name, entry.duration + 'ms');
            }
          });
        });
        
        this.observer.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  startMeasurement(label: string) {
    if (typeof window !== 'undefined') {
      this.startTime = performance.now();
      performance.mark(`infinite-scroll-${label}-start`);
    }
  }

  endMeasurement(label: string, itemsLoaded: number) {
    if (typeof window !== 'undefined') {
      const endTime = performance.now();
      performance.mark(`infinite-scroll-${label}-end`);
      
      try {
        performance.measure(
          `infinite-scroll-${label}`,
          `infinite-scroll-${label}-start`,
          `infinite-scroll-${label}-end`
        );
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }

      const loadTime = endTime - this.startTime;
      const scrollPosition = window.scrollY;
      
      // メモリ使用量（対応ブラウザのみ）
      let memoryUsage: number | undefined;
      if ('memory' in performance) {
        memoryUsage = (performance as any).memory?.usedJSHeapSize;
      }

      const metric: PerformanceMetrics = {
        loadTime,
        itemsLoaded,
        scrollPosition,
        memoryUsage,
        timestamp: Date.now()
      };

      this.metrics.push(metric);
      this.logPerformance(label, metric);
    }
  }

  private logPerformance(label: string, metric: PerformanceMetrics) {
    const { loadTime, itemsLoaded, memoryUsage } = metric;
    const itemsPerSecond = itemsLoaded / (loadTime / 1000);
    
    console.group(`📊 ${label} Performance`);
    console.log(`⏱️ Load Time: ${loadTime.toFixed(2)}ms`);
    console.log(`📝 Items Loaded: ${itemsLoaded}`);
    console.log(`⚡ Items/sec: ${itemsPerSecond.toFixed(2)}`);
    
    if (memoryUsage) {
      console.log(`💾 Memory: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // パフォーマンス警告
    if (loadTime > 1000) {
      console.warn('⚠️ Slow loading detected (>1s)');
    }
    if (itemsPerSecond < 10) {
      console.warn('⚠️ Low throughput (<10 items/sec)');
    }
    
    console.groupEnd();
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return total / this.metrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// シングルトンインスタンス
export const performanceMonitor = new InfiniteScrollPerformanceMonitor();

// パフォーマンス測定デコレータ
export function measurePerformance(label: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startMeasurement(label);
      const result = await method.apply(this, args);
      
      // 結果に基づいて項目数を推定
      const itemCount = Array.isArray(result) ? result.length : 1;
      performanceMonitor.endMeasurement(label, itemCount);
      
      return result;
    };
  };
}