/**
 * Phase 7.1: 接続監視基盤
 * WebSocketなしの保守的監視アプローチ
 */

interface ConnectionMetrics {
  activeConnections: number;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastUpdated: Date;
}

interface RequestEvent {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: Date;
  userId?: string;
}

class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private metrics: ConnectionMetrics;
  private recentRequests: RequestEvent[] = [];
  private readonly MAX_RECENT_REQUESTS = 100;
  private readonly METRICS_WINDOW_MS = 60000; // 1分間のメトリクス収集

  private constructor() {
    this.metrics = {
      activeConnections: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastUpdated: new Date(),
    };
  }

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  /**
   * API リクエストを記録
   */
  recordRequest(event: Omit<RequestEvent, 'timestamp'>): void {
    const requestEvent: RequestEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.recentRequests.push(requestEvent);
    
    // 古いリクエストを削除
    if (this.recentRequests.length > this.MAX_RECENT_REQUESTS) {
      this.recentRequests.shift();
    }

    // メトリクス更新
    this.updateMetrics();
  }

  /**
   * アクティブ接続数を増加
   */
  incrementActiveConnections(): void {
    this.metrics.activeConnections++;
    this.metrics.lastUpdated = new Date();
  }

  /**
   * アクティブ接続数を減少
   */
  decrementActiveConnections(): void {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    this.metrics.lastUpdated = new Date();
  }

  /**
   * メトリクスを更新
   */
  private updateMetrics(): void {
    const now = Date.now();
    const windowStart = now - this.METRICS_WINDOW_MS;
    
    // 1分以内のリクエストのみをフィルタリング
    const recentRequests = this.recentRequests.filter(
      req => req.timestamp.getTime() > windowStart
    );

    if (recentRequests.length === 0) {
      this.metrics.averageResponseTime = 0;
      this.metrics.errorRate = 0;
      this.metrics.lastUpdated = new Date();
      return;
    }

    // 平均応答時間を計算
    const totalResponseTime = recentRequests.reduce((sum, req) => sum + req.responseTime, 0);
    this.metrics.averageResponseTime = totalResponseTime / recentRequests.length;

    // エラー率を計算（4xx, 5xxステータス）
    const errorRequests = recentRequests.filter(req => req.status >= 400);
    this.metrics.errorRate = (errorRequests.length / recentRequests.length) * 100;

    this.metrics.totalRequests = recentRequests.length;
    this.metrics.lastUpdated = new Date();
  }

  /**
   * 現在のメトリクスを取得
   */
  getMetrics(): ConnectionMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * 最近のリクエスト履歴を取得
   */
  getRecentRequests(limit: number = 10): RequestEvent[] {
    return this.recentRequests
      .slice(-limit)
      .reverse(); // 新しい順
  }

  /**
   * エンドポイント別統計を取得
   */
  getEndpointStats(): Record<string, { count: number; avgResponseTime: number; errorRate: number }> {
    const stats: Record<string, { total: number; responseTime: number; errors: number }> = {};
    
    const now = Date.now();
    const windowStart = now - this.METRICS_WINDOW_MS;
    
    const recentRequests = this.recentRequests.filter(
      req => req.timestamp.getTime() > windowStart
    );

    // エンドポイント別に集計
    recentRequests.forEach(req => {
      const key = `${req.method} ${req.endpoint}`;
      if (!stats[key]) {
        stats[key] = { total: 0, responseTime: 0, errors: 0 };
      }
      
      stats[key].total++;
      stats[key].responseTime += req.responseTime;
      if (req.status >= 400) {
        stats[key].errors++;
      }
    });

    // 結果を整形
    const result: Record<string, { count: number; avgResponseTime: number; errorRate: number }> = {};
    
    Object.entries(stats).forEach(([key, stat]) => {
      result[key] = {
        count: stat.total,
        avgResponseTime: stat.responseTime / stat.total,
        errorRate: (stat.errors / stat.total) * 100,
      };
    });

    return result;
  }

  /**
   * パフォーマンス警告をチェック
   */
  checkPerformanceWarnings(): string[] {
    const warnings: string[] = [];
    const metrics = this.getMetrics();

    // 平均応答時間が1秒を超える場合
    if (metrics.averageResponseTime > 1000) {
      warnings.push(`平均応答時間が遅いです: ${metrics.averageResponseTime.toFixed(0)}ms`);
    }

    // エラー率が10%を超える場合
    if (metrics.errorRate > 10) {
      warnings.push(`エラー率が高いです: ${metrics.errorRate.toFixed(1)}%`);
    }

    // アクティブ接続数が100を超える場合
    if (metrics.activeConnections > 100) {
      warnings.push(`アクティブ接続数が多いです: ${metrics.activeConnections}`);
    }

    return warnings;
  }

  /**
   * メトリクスをリセット
   */
  reset(): void {
    this.metrics = {
      activeConnections: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastUpdated: new Date(),
    };
    this.recentRequests = [];
  }
}

// Express/Next.js ミドルウェア形式でリクエストを監視
export function createConnectionMiddleware() {
  const monitor = ConnectionMonitor.getInstance();
  
  return (endpoint: string, method: string = 'GET') => {
    const startTime = Date.now();
    monitor.incrementActiveConnections();
    
    return {
      // API呼び出し完了時に記録
      finish: (status: number = 200) => {
        const responseTime = Date.now() - startTime;
        monitor.decrementActiveConnections();
        monitor.recordRequest({
          endpoint,
          method,
          responseTime,
          status,
        });
      }
    };
  };
}

export default ConnectionMonitor;
export type { ConnectionMetrics, RequestEvent };