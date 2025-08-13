import { performance } from 'perf_hooks';
import * as Sentry from '@sentry/nextjs';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private readonly MAX_METRICS_PER_OPERATION = 1000;

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  async measureOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    const timestamp = Date.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        operation,
        duration,
        timestamp,
        success: true,
        metadata,
      });
      
      this.checkPerformanceThresholds(operation, duration);
      
      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        operation,
        duration,
        timestamp,
        success: false,
        metadata: { ...metadata, error: (error as Error).message },
      });
      
      Sentry.captureException(error, {
        tags: { operation },
        extra: { duration, metadata },
      });
      
      throw error;
    }
  }

  private recordMetric(metric: PerformanceMetrics) {
    if (!this.metrics.has(metric.operation)) {
      this.metrics.set(metric.operation, []);
    }

    const operationMetrics = this.metrics.get(metric.operation)!;
    operationMetrics.push(metric);

    // 古いメトリクスを削除してメモリ使用量を制限
    if (operationMetrics.length > this.MAX_METRICS_PER_OPERATION) {
      operationMetrics.shift();
    }

    // Sentryにブレッドクラム追加
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metric.operation} ${metric.success ? 'completed' : 'failed'}`,
      level: metric.success ? 'info' : 'error',
      data: {
        duration: metric.duration,
        operation: metric.operation,
      },
    });
  }

  private checkPerformanceThresholds(operation: string, duration: number) {
    const thresholds: Record<string, number> = {
      'api.posts.list': 500,
      'api.posts.create': 300,
      'api.posts.update': 300,
      'api.posts.delete': 200,
      'auth.login': 500,
      'auth.register': 1000,
      'email.send': 2000,
      'db.query': 100,
      'db.insert': 200,
      'db.update': 200,
      'db.delete': 100,
    };

    const threshold = thresholds[operation];
    if (threshold && duration > threshold) {
      console.warn(`⚠️ Performance: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
      
      Sentry.captureMessage(
        `Performance threshold exceeded: ${operation}`,
        'warning'
      );
      
      // カスタムメトリクス送信
      this.sendCustomMetric('performance_warning', 1, {
        operation,
        duration,
        threshold,
      });
    }
  }

  public getOperationStats(operation: string) {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration);
    const successCount = metrics.filter(m => m.success).length;
    const sorted = [...durations].sort((a, b) => a - b);

    return {
      count: metrics.length,
      successRate: (successCount / metrics.length) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianDuration: sorted[Math.floor(sorted.length / 2)],
      p95Duration: sorted[Math.floor(sorted.length * 0.95)],
      p99Duration: sorted[Math.floor(sorted.length * 0.99)],
      minDuration: sorted[0],
      maxDuration: sorted[sorted.length - 1],
    };
  }

  public getAllStats() {
    const stats: Record<string, unknown> = {};
    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getOperationStats(operation);
    }
    return stats;
  }

  private sendCustomMetric(name: string, value: number, tags?: Record<string, unknown>) {
    // カスタムメトリクス送信（実装は監視サービスに応じて調整）
    console.log(`📊 Metric: ${name}=${value}`, tags);
    
    // Sentry用カスタムメトリクス
    try {
      // Sentry metricsが利用可能な場合のみ使用
      const sentryWithMetrics = Sentry as typeof Sentry & { metrics?: { increment: (name: string, value: number, options?: { tags?: Record<string, unknown> }) => void } };
      sentryWithMetrics.metrics?.increment(name, value, { tags });
    } catch (error) {
      console.warn('Sentry metrics not available:', error);
    }
  }
}

export const perfMonitor = PerformanceMonitor.getInstance();