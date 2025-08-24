/**
 * Phase 7.1: パフォーマンスベースライン測定ユーティリティ
 * 現状のシステムパフォーマンスを測定し、改善効果を定量的に評価する
 */

interface PerformanceMetrics {
  apiResponseTime: {
    notifications: number;
    posts: number;
    timeline: number;
    average: number;
  };
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  pollingInterval: number;
  activeConnections: number;
  timestamp: Date;
}

class PerformanceBaseline {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = Date.now();

  /**
   * API応答時間を測定
   */
  async measureApiResponseTime(endpoint: string): Promise<number> {
    const start = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      await response.json();
    } catch (error) {
      console.error(`Failed to measure ${endpoint}:`, error);
      return -1;
    }
    
    const end = performance.now();
    return end - start;
  }

  /**
   * メモリ使用量を取得（ブラウザ環境用）
   */
  getMemoryUsage(): PerformanceMetrics['memoryUsage'] {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize || 0,
        heapTotal: memory.totalJSHeapSize || 0,
        external: 0, // ブラウザでは利用不可
        rss: memory.jsHeapSizeLimit || 0,
      };
    }
    
    // Node.js環境の場合
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
    };
  }

  /**
   * 現在のポーリング間隔を取得
   */
  getCurrentPollingInterval(): number {
    // 現在の実装では5秒（5000ms）
    return 5000;
  }

  /**
   * アクティブな接続数を推定
   */
  getActiveConnections(): number {
    // 現時点ではポーリングベースなので、アクティブなタブ数を推定
    if (typeof window !== 'undefined') {
      return document.visibilityState === 'visible' ? 1 : 0;
    }
    return 0;
  }

  /**
   * 包括的なベースライン測定を実行
   */
  async runBaselineMeasurement(): Promise<PerformanceMetrics> {
    console.log('🔍 Phase 7.1: パフォーマンスベースライン測定開始...');
    
    // API応答時間測定
    const notificationsTime = await this.measureApiResponseTime('/api/notifications');
    const postsTime = await this.measureApiResponseTime('/api/posts?limit=10');
    const timelineTime = await this.measureApiResponseTime('/api/timeline?limit=10');
    
    const apiResponseTime = {
      notifications: notificationsTime,
      posts: postsTime,
      timeline: timelineTime,
      average: (notificationsTime + postsTime + timelineTime) / 3,
    };
    
    // メトリクス収集
    const metrics: PerformanceMetrics = {
      apiResponseTime,
      memoryUsage: this.getMemoryUsage(),
      pollingInterval: this.getCurrentPollingInterval(),
      activeConnections: this.getActiveConnections(),
      timestamp: new Date(),
    };
    
    this.metrics.push(metrics);
    
    console.log('📊 ベースライン測定結果:');
    console.log('├─ API応答時間:');
    console.log(`│  ├─ 通知: ${notificationsTime.toFixed(2)}ms`);
    console.log(`│  ├─ 投稿: ${postsTime.toFixed(2)}ms`);
    console.log(`│  ├─ タイムライン: ${timelineTime.toFixed(2)}ms`);
    console.log(`│  └─ 平均: ${apiResponseTime.average.toFixed(2)}ms`);
    console.log('├─ メモリ使用量:');
    console.log(`│  ├─ Heap Used: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`│  └─ Heap Total: ${(metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`├─ ポーリング間隔: ${metrics.pollingInterval}ms`);
    console.log(`└─ アクティブ接続数: ${metrics.activeConnections}`);
    
    return metrics;
  }

  /**
   * 複数回測定して平均値を取得
   */
  async runMultipleMeasurements(count: number = 5): Promise<PerformanceMetrics> {
    console.log(`🔄 ${count}回の測定を実行中...`);
    
    const allMetrics: PerformanceMetrics[] = [];
    
    for (let i = 0; i < count; i++) {
      console.log(`  測定 ${i + 1}/${count}...`);
      const metrics = await this.runBaselineMeasurement();
      allMetrics.push(metrics);
      
      // 測定間隔を空ける
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 平均値を計算
    const avgMetrics: PerformanceMetrics = {
      apiResponseTime: {
        notifications: 0,
        posts: 0,
        timeline: 0,
        average: 0,
      },
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      },
      pollingInterval: this.getCurrentPollingInterval(),
      activeConnections: 0,
      timestamp: new Date(),
    };
    
    // 有効な測定値のみを使用して平均を計算
    const validMetrics = allMetrics.filter(m => 
      m.apiResponseTime.notifications >= 0 &&
      m.apiResponseTime.posts >= 0 &&
      m.apiResponseTime.timeline >= 0
    );
    
    if (validMetrics.length > 0) {
      validMetrics.forEach(m => {
        avgMetrics.apiResponseTime.notifications += m.apiResponseTime.notifications;
        avgMetrics.apiResponseTime.posts += m.apiResponseTime.posts;
        avgMetrics.apiResponseTime.timeline += m.apiResponseTime.timeline;
        avgMetrics.memoryUsage.heapUsed += m.memoryUsage.heapUsed;
        avgMetrics.memoryUsage.heapTotal += m.memoryUsage.heapTotal;
        avgMetrics.activeConnections += m.activeConnections;
      });
      
      const count = validMetrics.length;
      avgMetrics.apiResponseTime.notifications /= count;
      avgMetrics.apiResponseTime.posts /= count;
      avgMetrics.apiResponseTime.timeline /= count;
      avgMetrics.apiResponseTime.average = 
        (avgMetrics.apiResponseTime.notifications + 
         avgMetrics.apiResponseTime.posts + 
         avgMetrics.apiResponseTime.timeline) / 3;
      avgMetrics.memoryUsage.heapUsed /= count;
      avgMetrics.memoryUsage.heapTotal /= count;
      avgMetrics.activeConnections /= count;
    }
    
    console.log('\n📈 平均ベースライン:');
    console.log('├─ API応答時間（平均）:');
    console.log(`│  ├─ 通知: ${avgMetrics.apiResponseTime.notifications.toFixed(2)}ms`);
    console.log(`│  ├─ 投稿: ${avgMetrics.apiResponseTime.posts.toFixed(2)}ms`);
    console.log(`│  ├─ タイムライン: ${avgMetrics.apiResponseTime.timeline.toFixed(2)}ms`);
    console.log(`│  └─ 全体平均: ${avgMetrics.apiResponseTime.average.toFixed(2)}ms`);
    console.log('└─ メモリ使用量（平均）:');
    console.log(`   ├─ Heap Used: ${(avgMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   └─ Heap Total: ${(avgMetrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    
    return avgMetrics;
  }

  /**
   * 改善後の効果を測定
   */
  async measureImprovement(
    beforeMetrics: PerformanceMetrics,
    afterMetrics: PerformanceMetrics
  ): Promise<void> {
    const apiImprovement = 
      ((beforeMetrics.apiResponseTime.average - afterMetrics.apiResponseTime.average) / 
       beforeMetrics.apiResponseTime.average) * 100;
    
    const memoryImprovement = 
      ((beforeMetrics.memoryUsage.heapUsed - afterMetrics.memoryUsage.heapUsed) / 
       beforeMetrics.memoryUsage.heapUsed) * 100;
    
    console.log('\n🎯 改善効果:');
    console.log(`├─ API応答速度: ${apiImprovement > 0 ? '↑' : '↓'} ${Math.abs(apiImprovement).toFixed(1)}%`);
    console.log(`├─ メモリ使用量: ${memoryImprovement > 0 ? '↓' : '↑'} ${Math.abs(memoryImprovement).toFixed(1)}%`);
    console.log(`└─ ポーリング間隔: ${beforeMetrics.pollingInterval}ms → ${afterMetrics.pollingInterval}ms`);
    
    // Phase 7.1の成功基準チェック
    if (apiImprovement < -5) {
      console.warn('⚠️ 警告: API応答速度が5%以上悪化しています');
    }
    if (memoryImprovement < -20) {
      console.warn('⚠️ 警告: メモリ使用量が20MB以上増加しています');
    }
  }
}

export default PerformanceBaseline;
export type { PerformanceMetrics };