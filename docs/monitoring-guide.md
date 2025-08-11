# モニタリング・観測基盤ガイド

## Phase 0.5: 観測基盤構築

### 概要
Phase 0のテスト基盤に続き、システムの可観測性を確保するための包括的なモニタリング基盤を構築します。エラー追跡、パフォーマンス監視、ユーザー行動分析の3層アプローチを採用します。

## 実装内容

### 1. エラートラッキング（Sentry統合）

#### インストールと設定
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**sentry.client.config.ts**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // パフォーマンス監視
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", /^https:\/\/yourapp\.com/],
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // サンプリングレート
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // エラーフィルタリング
  beforeSend(event, hint) {
    // 開発環境のノイズを除外
    if (event.environment === 'development') {
      if (hint.originalException?.message?.includes('ResizeObserver')) {
        return null;
      }
    }
    return event;
  },
});
```

**sentry.server.config.ts**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // サーバーサイド特有の設定
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Mongo(),
  ],
  
  // エラーレベル設定
  beforeSend(event) {
    // 機密情報のマスキング
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.extra?.password) {
      delete event.extra.password;
    }
    return event;
  },
});
```

### 2. パフォーマンス監視

#### カスタムメトリクス収集
```typescript
// src/lib/monitoring/performance.ts
import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  // 操作時間測定
  async measureOperation<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration);
      
      // 閾値チェック
      this.checkThreshold(name, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordError(name, duration, error);
      throw error;
    }
  }
  
  private recordMetric(name: string, duration: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(duration);
    
    // 最新100件のみ保持
    if (values.length > 100) {
      values.shift();
    }
    
    // Sentryに送信
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name} completed`,
      level: 'info',
      data: { duration }
    });
  }
  
  private checkThreshold(name: string, duration: number) {
    const thresholds: Record<string, number> = {
      'auth.login': 500,
      'auth.register': 1000,
      'email.send': 2000,
      'post.create': 300,
      'post.list': 500,
    };
    
    const threshold = thresholds[name];
    if (threshold && duration > threshold) {
      console.warn(`Performance warning: ${name} took ${duration}ms (threshold: ${threshold}ms)`);
      
      // アラート送信
      Sentry.captureMessage(
        `Performance degradation: ${name}`,
        'warning'
      );
    }
  }
  
  // 統計情報取得
  getStats(operation: string) {
    const values = this.metrics.get(operation) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }
}

export const perfMonitor = new PerformanceMonitor();
```

#### Web Vitals監視
```typescript
// src/lib/monitoring/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals() {
  // Cumulative Layout Shift
  getCLS((metric) => {
    console.log('CLS:', metric.value);
    sendToAnalytics('CLS', metric);
  });
  
  // First Input Delay
  getFID((metric) => {
    console.log('FID:', metric.value);
    sendToAnalytics('FID', metric);
  });
  
  // First Contentful Paint
  getFCP((metric) => {
    console.log('FCP:', metric.value);
    sendToAnalytics('FCP', metric);
  });
  
  // Largest Contentful Paint
  getLCP((metric) => {
    console.log('LCP:', metric.value);
    sendToAnalytics('LCP', metric);
  });
  
  // Time to First Byte
  getTTFB((metric) => {
    console.log('TTFB:', metric.value);
    sendToAnalytics('TTFB', metric);
  });
}

function sendToAnalytics(name: string, metric: any) {
  // Sentryに送信
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: name,
    level: 'info',
    data: {
      value: metric.value,
      rating: metric.rating,
    }
  });
  
  // カスタムアナリティクスに送信
  if (window.analytics) {
    window.analytics.track('Web Vitals', {
      metric: name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
    });
  }
}
```

### 3. ユーザー行動分析

#### 認証フロー追跡
```typescript
// src/lib/monitoring/auth-analytics.ts
export class AuthAnalytics {
  private sessionData = new Map<string, any>();
  
  // 登録フロー追跡
  trackSignupStart(sessionId: string) {
    this.sessionData.set(sessionId, {
      startTime: Date.now(),
      step: 'signup_start',
      events: []
    });
    
    this.sendEvent('Signup Started', { sessionId });
  }
  
  trackSignupStep(sessionId: string, step: string, data?: any) {
    const session = this.sessionData.get(sessionId);
    if (session) {
      session.events.push({
        step,
        timestamp: Date.now(),
        data
      });
      
      this.sendEvent('Signup Step', {
        sessionId,
        step,
        duration: Date.now() - session.startTime,
        ...data
      });
    }
  }
  
  trackSignupComplete(sessionId: string, userId: string) {
    const session = this.sessionData.get(sessionId);
    if (session) {
      const totalDuration = Date.now() - session.startTime;
      
      this.sendEvent('Signup Completed', {
        sessionId,
        userId,
        totalDuration,
        steps: session.events.length
      });
      
      // 完了率の計算
      this.updateConversionRate('signup', true);
      
      this.sessionData.delete(sessionId);
    }
  }
  
  trackSignupAbandoned(sessionId: string, reason: string) {
    const session = this.sessionData.get(sessionId);
    if (session) {
      const abandonedAt = session.events[session.events.length - 1]?.step || 'unknown';
      
      this.sendEvent('Signup Abandoned', {
        sessionId,
        reason,
        abandonedAt,
        duration: Date.now() - session.startTime
      });
      
      // 離脱率の更新
      this.updateConversionRate('signup', false);
      
      this.sessionData.delete(sessionId);
    }
  }
  
  // ログインフロー追跡
  trackLoginAttempt(email: string, success: boolean, duration: number) {
    this.sendEvent('Login Attempt', {
      success,
      duration,
      timestamp: Date.now()
    });
    
    if (!success) {
      this.trackFailedLogin(email);
    }
  }
  
  private trackFailedLogin(email: string) {
    // 連続失敗の追跡（セキュリティ用）
    const key = `failed_login_${email}`;
    const failures = this.getFailureCount(key);
    
    if (failures >= 5) {
      // アラート送信
      Sentry.captureMessage(
        `Multiple failed login attempts for ${email}`,
        'warning'
      );
    }
  }
  
  // メトリクス集計
  private conversionRates = new Map<string, { success: number; total: number }>();
  
  private updateConversionRate(flow: string, success: boolean) {
    if (!this.conversionRates.has(flow)) {
      this.conversionRates.set(flow, { success: 0, total: 0 });
    }
    
    const rates = this.conversionRates.get(flow)!;
    rates.total++;
    if (success) rates.success++;
    
    // 定期的にレポート
    if (rates.total % 100 === 0) {
      const rate = (rates.success / rates.total) * 100;
      this.sendEvent('Conversion Rate', {
        flow,
        rate,
        total: rates.total
      });
    }
  }
  
  private sendEvent(name: string, data: any) {
    // コンソール出力（開発用）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${name}:`, data);
    }
    
    // Sentryイベント
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: name,
      level: 'info',
      data
    });
    
    // 外部アナリティクスサービス（例：Mixpanel, Amplitude）
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track(name, data);
    }
  }
  
  private getFailureCount(key: string): number {
    // Redis等のキャッシュから取得（実装例）
    return 0; // 仮実装
  }
}

export const authAnalytics = new AuthAnalytics();
```

### 4. リアルタイムダッシュボード

#### メトリクスダッシュボード
```typescript
// src/app/admin/monitoring/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, Grid, Typography } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<any>({});
  
  useEffect(() => {
    // WebSocketまたはPollingでリアルタイムデータ取得
    const interval = setInterval(async () => {
      const response = await fetch('/api/monitoring/metrics');
      const data = await response.json();
      setMetrics(data);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Grid container spacing={3}>
      {/* エラー率 */}
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6">エラー率</Typography>
          <Typography variant="h3" color={metrics.errorRate > 1 ? 'error' : 'success'}>
            {metrics.errorRate?.toFixed(2)}%
          </Typography>
        </Card>
      </Grid>
      
      {/* 平均応答時間 */}
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6">平均応答時間</Typography>
          <Typography variant="h3" color={metrics.avgResponseTime > 500 ? 'warning' : 'success'}>
            {metrics.avgResponseTime?.toFixed(0)}ms
          </Typography>
        </Card>
      </Grid>
      
      {/* アクティブユーザー */}
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6">アクティブユーザー</Typography>
          <Typography variant="h3">{metrics.activeUsers || 0}</Typography>
        </Card>
      </Grid>
      
      {/* パフォーマンストレンド */}
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6">パフォーマンストレンド</Typography>
          <Line
            data={{
              labels: metrics.timeline || [],
              datasets: [{
                label: '応答時間',
                data: metrics.responseTimeHistory || [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              }]
            }}
          />
        </Card>
      </Grid>
      
      {/* エラー分布 */}
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6">エラー分布</Typography>
          <Bar
            data={{
              labels: Object.keys(metrics.errorTypes || {}),
              datasets: [{
                label: 'エラー数',
                data: Object.values(metrics.errorTypes || {}),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
              }]
            }}
          />
        </Card>
      </Grid>
    </Grid>
  );
}
```

### 5. アラート設定

#### アラートルール
```typescript
// src/lib/monitoring/alerts.ts
export interface AlertRule {
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  cooldown: number; // 再通知までの待機時間（秒）
}

export const alertRules: AlertRule[] = [
  {
    name: 'high_error_rate',
    condition: (m) => m.errorRate > 5,
    severity: 'critical',
    message: 'エラー率が5%を超えています',
    cooldown: 300
  },
  {
    name: 'slow_response',
    condition: (m) => m.avgResponseTime > 1000,
    severity: 'warning',
    message: '平均応答時間が1秒を超えています',
    cooldown: 600
  },
  {
    name: 'memory_usage',
    condition: (m) => m.memoryUsage > 80,
    severity: 'error',
    message: 'メモリ使用率が80%を超えています',
    cooldown: 300
  },
  {
    name: 'failed_logins',
    condition: (m) => m.failedLogins > 10,
    severity: 'warning',
    message: '失敗ログインが10回を超えています',
    cooldown: 900
  },
  {
    name: 'email_failures',
    condition: (m) => m.emailFailureRate > 10,
    severity: 'error',
    message: 'メール送信失敗率が10%を超えています',
    cooldown: 600
  }
];

export class AlertManager {
  private lastAlerted = new Map<string, number>();
  
  checkAlerts(metrics: any) {
    for (const rule of alertRules) {
      if (rule.condition(metrics)) {
        this.triggerAlert(rule, metrics);
      }
    }
  }
  
  private triggerAlert(rule: AlertRule, metrics: any) {
    const lastAlert = this.lastAlerted.get(rule.name) || 0;
    const now = Date.now();
    
    if (now - lastAlert < rule.cooldown * 1000) {
      return; // クールダウン中
    }
    
    // アラート送信
    this.sendAlert(rule, metrics);
    this.lastAlerted.set(rule.name, now);
  }
  
  private sendAlert(rule: AlertRule, metrics: any) {
    // Sentry
    Sentry.captureMessage(rule.message, rule.severity);
    
    // Slack通知
    if (process.env.SLACK_WEBHOOK_URL) {
      fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${rule.severity.toUpperCase()}: ${rule.message}`,
          attachments: [{
            color: this.getSeverityColor(rule.severity),
            fields: Object.entries(metrics).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true
            }))
          }]
        })
      });
    }
    
    // メール通知（重要度が高い場合）
    if (rule.severity === 'critical') {
      // メール送信処理
    }
  }
  
  private getSeverityColor(severity: string): string {
    const colors = {
      info: '#0088cc',
      warning: '#ff9900',
      error: '#cc0000',
      critical: '#660000'
    };
    return colors[severity] || '#808080';
  }
}
```

## 実装スケジュール

### Day 1: エラートラッキング
- Sentry統合
- エラーフィルタリング設定
- アラート設定

### Day 2: パフォーマンス監視
- カスタムメトリクス実装
- Web Vitals設定
- パフォーマンス閾値設定

### Day 3: ユーザー行動分析
- 認証フロー追跡実装
- コンバージョン率測定
- ダッシュボード構築

## 成果物

```
src/lib/monitoring/
├── sentry-config.ts       # Sentry設定
├── performance.ts         # パフォーマンス監視
├── web-vitals.ts         # Web Vitals監視
├── auth-analytics.ts     # 認証分析
├── alerts.ts             # アラート管理
└── dashboard/            # ダッシュボードコンポーネント
```

## パフォーマンス目標と閾値

| メトリクス | 目標値 | 警告閾値 | エラー閾値 |
|----------|--------|---------|-----------|
| ログイン応答時間 | < 300ms | 500ms | 1000ms |
| メール送信時間 | < 1秒 | 2秒 | 5秒 |
| ページ読込時間 | < 2秒 | 3秒 | 5秒 |
| エラー率 | < 0.1% | 1% | 5% |
| 可用性 | > 99.9% | 99.5% | 99% |

## まとめ

Phase 0.5の観測基盤により：
- **問題の早期発見**: リアルタイムモニタリングで即座に検知
- **データドリブンな改善**: メトリクスに基づく最適化
- **ユーザー体験の向上**: 行動分析による改善点の特定
- **運用の安定化**: アラートによる迅速な対応

これにより、Phase 1以降の実装において高い可観測性を維持できます。