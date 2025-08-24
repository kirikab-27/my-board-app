/**
 * Phase 7.1: パフォーマンス設定
 * 保守的アプローチによる段階的な最適化設定
 */

export interface PerformanceConfig {
  polling: {
    interval: number;        // ポーリング間隔（ミリ秒）
    enabled: boolean;        // ポーリング有効/無効
    adaptiveInterval: boolean; // アダプティブ間隔（将来的な拡張用）
  };
  api: {
    timeout: number;         // APIタイムアウト（ミリ秒）
    retryCount: number;      // リトライ回数
    retryDelay: number;      // リトライ間隔（ミリ秒）
  };
  monitoring: {
    enabled: boolean;        // パフォーマンス監視有効/無効
    logLevel: 'none' | 'basic' | 'detailed'; // ログレベル
    metricsInterval: number; // メトリクス収集間隔（ミリ秒）
  };
  thresholds: {
    maxMemoryUsageMB: number;     // 最大メモリ使用量（MB）
    maxApiResponseTimeMs: number; // 最大API応答時間（ミリ秒）
    performanceImpactLimit: number; // パフォーマンス影響限界（%）
  };
}

// Phase 7.1: 保守的な改善設定
const performanceConfig: PerformanceConfig = {
  polling: {
    // Phase 7.1: 5秒→2秒に段階的短縮
    interval: process.env.NEXT_PUBLIC_POLLING_INTERVAL 
      ? parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL) 
      : 2000, // 2秒（改善後）
    enabled: true,
    adaptiveInterval: false, // Phase 7.2で実装予定
  },
  api: {
    timeout: 10000,      // 10秒
    retryCount: 2,       // 2回まで再試行
    retryDelay: 1000,    // 1秒後に再試行
  },
  monitoring: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'basic' : 'none',
    metricsInterval: 60000, // 1分ごと
  },
  thresholds: {
    maxMemoryUsageMB: 100,        // 100MB（既存 + 20MB以内）
    maxApiResponseTimeMs: 1000,   // 1秒
    performanceImpactLimit: 5,    // 5%以内の影響
  },
};

// パフォーマンス設定のバリデーション
export function validatePerformanceConfig(config: PerformanceConfig): void {
  // Phase 7.1の保守的基準を確認
  if (config.polling.interval < 1000) {
    console.warn('⚠️ ポーリング間隔が1秒未満です。パフォーマンスへの影響に注意してください。');
  }
  
  if (config.polling.interval > 5000) {
    console.info('ℹ️ ポーリング間隔が5秒を超えています。リアルタイム性が低下する可能性があります。');
  }
  
  // メモリ使用量の警告
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    const currentUsageMB = memory.usedJSHeapSize / 1024 / 1024;
    
    if (currentUsageMB > config.thresholds.maxMemoryUsageMB) {
      console.warn(`⚠️ メモリ使用量が閾値を超えています: ${currentUsageMB.toFixed(2)}MB > ${config.thresholds.maxMemoryUsageMB}MB`);
    }
  }
}

// 動的な設定更新（Phase 7.2で使用予定）
export class DynamicPerformanceConfig {
  private static instance: DynamicPerformanceConfig;
  private config: PerformanceConfig;
  private listeners: ((config: PerformanceConfig) => void)[] = [];
  
  private constructor() {
    this.config = { ...performanceConfig };
    validatePerformanceConfig(this.config);
  }
  
  static getInstance(): DynamicPerformanceConfig {
    if (!DynamicPerformanceConfig.instance) {
      DynamicPerformanceConfig.instance = new DynamicPerformanceConfig();
    }
    return DynamicPerformanceConfig.instance;
  }
  
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }
  
  updatePollingInterval(interval: number): void {
    // Phase 7.1: 保守的な制限を適用
    if (interval < 1000) {
      console.error('❌ ポーリング間隔は1秒以上である必要があります');
      return;
    }
    
    if (interval > 10000) {
      console.error('❌ ポーリング間隔は10秒以下である必要があります');
      return;
    }
    
    const oldInterval = this.config.polling.interval;
    this.config.polling.interval = interval;
    
    console.log(`✅ ポーリング間隔を更新: ${oldInterval}ms → ${interval}ms`);
    
    // リスナーに通知
    this.notifyListeners();
  }
  
  enableAdaptivePolling(): void {
    // Phase 7.2で実装予定
    console.info('ℹ️ アダプティブポーリングはPhase 7.2で実装予定です');
  }
  
  onConfigChange(listener: (config: PerformanceConfig) => void): () => void {
    this.listeners.push(listener);
    
    // クリーンアップ関数を返す
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config));
  }
  
  // パフォーマンス影響を測定
  async measureImpact(): Promise<boolean> {
    if (typeof window === 'undefined') return true;
    
    const startMemory = 'memory' in performance 
      ? (performance as any).memory.usedJSHeapSize / 1024 / 1024
      : 0;
    
    // 設定変更後、少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const endMemory = 'memory' in performance
      ? (performance as any).memory.usedJSHeapSize / 1024 / 1024
      : 0;
    
    const memoryIncrease = endMemory - startMemory;
    
    if (memoryIncrease > 20) {
      console.error(`❌ メモリ使用量が20MB以上増加しました: ${memoryIncrease.toFixed(2)}MB`);
      return false;
    }
    
    console.log(`✅ メモリ影響: ${memoryIncrease.toFixed(2)}MB（許容範囲内）`);
    return true;
  }
}

export default performanceConfig;