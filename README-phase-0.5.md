# Phase 0.5: 観測基盤構築 実装手順

> システム可観測性の確保により、以降の全Phaseでリアルタイム監視・品質保証を実現

## 🎯 Phase概要

**期間**: 1-2日間  
**ブランチ**: `feature/monitoring`  
**前提条件**: Phase 0（テスト基盤）完了  
**目標**: エラー率1%未満、パフォーマンス目標達成、完全可観測性

## 📋 実装チェックリスト

### Day 1: エラートラッキング・パフォーマンス監視
- [ ] Sentry統合・設定
- [ ] パフォーマンスメトリクス収集基盤
- [ ] Web Vitals監視設定
- [ ] カスタムメトリクス実装
- [ ] エラーフィルタリング設定

### Day 2: ユーザー行動分析・ダッシュボード
- [ ] ユーザー行動追跡基盤
- [ ] アラートシステム構築
- [ ] リアルタイムダッシュボード作成
- [ ] 統計レポート機能
- [ ] Phase完了確認

## 🚀 実装手順

### Step 1: ブランチ準備

```bash
# Phase 0完了ブランチから開始
git checkout feature/test-infrastructure
git pull origin feature/test-infrastructure

# Phase 0.5ブランチ作成
git checkout -b feature/monitoring

# 開始タグ
git tag phase-0.5-start
```

### Step 2: 必要パッケージインストール

```bash
# Sentry統合
npm install @sentry/nextjs @sentry/replay

# パフォーマンス監視
npm install web-vitals

# ダッシュボード・チャート
npm install chart.js react-chartjs-2
npm install recharts

# ユーティリティ
npm install uuid
npm install -D @types/uuid
```

### Step 3: Sentry統合設定

**sentry.client.config.ts**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/.*\.vercel\.app/,
        /^https:\/\/your-domain\.com/
      ],
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  beforeSend(event, hint) {
    // 開発環境ノイズ除去
    if (process.env.NODE_ENV === 'development') {
      if (hint.originalException?.message?.includes('ResizeObserver')) {
        return null;
      }
      if (hint.originalException?.message?.includes('Non-Error promise rejection')) {
        return null;
      }
    }
    
    // 機密情報のマスキング
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    
    if (event.extra?.password || event.extra?.token) {
      delete event.extra.password;
      delete event.extra.token;
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
  
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Mongo(),
  ],
  
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  
  beforeSend(event) {
    // サーバーサイド機密情報保護
    if (event.request?.data) {
      const data = event.request.data;
      if (typeof data === 'object' && data !== null) {
        ['password', 'token', 'secret', 'key'].forEach(key => {
          if (key in data) {
            data[key] = '[Filtered]';
          }
        });
      }
    }
    
    return event;
  },
});
```

### Step 4: パフォーマンスメトリクス収集基盤

**src/lib/monitoring/performance-monitor.ts**
```typescript
import { performance } from 'perf_hooks';
import * as Sentry from '@sentry/nextjs';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
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
    metadata?: Record<string, any>
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
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        operation,
        duration,
        timestamp,
        success: false,
        metadata: { ...metadata, error: error.message },
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
    const stats: Record<string, any> = {};
    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getOperationStats(operation);
    }
    return stats;
  }

  private sendCustomMetric(name: string, value: number, tags?: Record<string, any>) {
    // カスタムメトリクス送信（実装は監視サービスに応じて調整）
    console.log(`📊 Metric: ${name}=${value}`, tags);
    
    // Sentry用カスタムメトリクス
    Sentry.metrics.increment(name, value, { tags });
  }
}

export const perfMonitor = PerformanceMonitor.getInstance();
```

### Step 5: Web Vitals監視

**src/lib/monitoring/web-vitals.ts**
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

export function reportWebVitals() {
  // Cumulative Layout Shift
  getCLS(onPerfEntry);
  
  // First Input Delay
  getFID(onPerfEntry);
  
  // First Contentful Paint
  getFCP(onPerfEntry);
  
  // Largest Contentful Paint
  getLCP(onPerfEntry);
  
  // Time to First Byte
  getTTFB(onPerfEntry);
}

function onPerfEntry(metric: Metric) {
  console.log(`📈 ${metric.name}: ${metric.value}`);
  
  // Sentryに送信
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value}`,
    level: 'info',
    data: {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    },
  });
  
  // 閾値チェック
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  };
  
  const threshold = thresholds[metric.name as keyof typeof thresholds];
  if (threshold) {
    let level: 'info' | 'warning' | 'error' = 'info';
    
    if (metric.value > threshold.poor) {
      level = 'error';
    } else if (metric.value > threshold.good) {
      level = 'warning';
    }
    
    if (level !== 'info') {
      Sentry.captureMessage(
        `Web Vitals threshold exceeded: ${metric.name}`,
        level
      );
    }
  }
  
  // カスタム分析サービスに送信
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

// Next.js App Router用
export function WebVitalsReporter() {
  if (typeof window !== 'undefined') {
    reportWebVitals();
  }
  return null;
}
```

### Step 6: ユーザー行動分析基盤

**src/lib/monitoring/user-analytics.ts**
```typescript
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/nextjs';

export interface UserEvent {
  eventId: string;
  eventName: string;
  userId?: string;
  sessionId: string;
  timestamp: number;
  properties: Record<string, any>;
  context: {
    userAgent: string;
    url: string;
    referrer: string;
  };
}

export class UserAnalytics {
  private static instance: UserAnalytics;
  private sessionId: string;
  private events: UserEvent[] = [];
  private readonly MAX_EVENTS = 500;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): UserAnalytics {
    if (!UserAnalytics.instance) {
      UserAnalytics.instance = new UserAnalytics();
    }
    return UserAnalytics.instance;
  }

  private generateSessionId(): string {
    const stored = typeof window !== 'undefined' 
      ? sessionStorage.getItem('analytics_session_id') 
      : null;
    
    if (stored) {
      return stored;
    }
    
    const sessionId = uuidv4();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    
    return sessionId;
  }

  public track(eventName: string, properties: Record<string, any> = {}, userId?: string) {
    if (typeof window === 'undefined') return;

    const event: UserEvent = {
      eventId: uuidv4(),
      eventName,
      userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      properties,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
      },
    };

    this.events.push(event);

    // イベント数制限
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // 開発環境でのログ出力
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 Analytics: ${eventName}`, properties);
    }

    // Sentryブレッドクラム
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: eventName,
      level: 'info',
      data: properties,
    });

    // 外部アナリティクス送信
    this.sendToExternalService(event);
  }

  private sendToExternalService(event: UserEvent) {
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.eventName, {
        event_category: 'User Action',
        event_label: event.eventName,
        custom_map: event.properties,
        session_id: event.sessionId,
        user_id: event.userId,
      });
    }

    // カスタム分析サービス（実装例）
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }).catch(error => {
        console.error('Analytics送信エラー:', error);
      });
    }
  }

  // 認証関連イベント
  public trackAuthEvent(event: 'login_start' | 'login_success' | 'login_failed' | 'register_start' | 'register_success' | 'register_failed' | 'logout', metadata?: any) {
    this.track(`auth.${event}`, metadata);
  }

  // ページビューイベント
  public trackPageView(path: string, title?: string) {
    this.track('page_view', {
      path,
      title: title || document.title,
    });
  }

  // 投稿関連イベント
  public trackPostEvent(event: 'create' | 'edit' | 'delete' | 'like' | 'view', postId?: string, metadata?: any) {
    this.track(`post.${event}`, {
      postId,
      ...metadata,
    });
  }

  // エラーイベント
  public trackError(error: Error, context?: any) {
    this.track('error_occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
    });
  }

  // 統計取得
  public getSessionStats() {
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);
    
    return {
      sessionId: this.sessionId,
      eventCount: sessionEvents.length,
      firstEvent: sessionEvents[0]?.timestamp,
      lastEvent: sessionEvents[sessionEvents.length - 1]?.timestamp,
      sessionDuration: sessionEvents.length > 1 
        ? sessionEvents[sessionEvents.length - 1].timestamp - sessionEvents[0].timestamp
        : 0,
      topEvents: this.getTopEvents(sessionEvents),
    };
  }

  private getTopEvents(events: UserEvent[]) {
    const eventCounts: Record<string, number> = {};
    events.forEach(event => {
      eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
    });

    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }
}

export const userAnalytics = UserAnalytics.getInstance();
```

### Step 7: アラートシステム

**src/lib/monitoring/alert-manager.ts**
```typescript
import * as Sentry from '@sentry/nextjs';

export interface AlertRule {
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number; // 秒
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'email' | 'slack' | 'sentry' | 'console';
  config: Record<string, any>;
}

export class AlertManager {
  private static instance: AlertManager;
  private lastAlerted: Map<string, number> = new Map();
  private rules: AlertRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        name: 'high_error_rate',
        condition: (m) => m.errorRate > 5,
        severity: 'critical',
        message: 'エラー率が5%を超えています',
        cooldown: 300,
        actions: [
          { type: 'sentry', config: {} },
          { type: 'slack', config: { channel: '#alerts' } },
        ],
      },
      {
        name: 'slow_response_time',
        condition: (m) => m.avgResponseTime > 1000,
        severity: 'high',
        message: '平均応答時間が1秒を超えています',
        cooldown: 600,
        actions: [
          { type: 'sentry', config: {} },
          { type: 'console', config: {} },
        ],
      },
      {
        name: 'memory_usage_high',
        condition: (m) => m.memoryUsage > 80,
        severity: 'medium',
        message: 'メモリ使用率が80%を超えています',
        cooldown: 300,
        actions: [
          { type: 'console', config: {} },
        ],
      },
      {
        name: 'database_connection_issues',
        condition: (m) => m.dbConnectionErrors > 3,
        severity: 'high',
        message: 'データベース接続エラーが多発しています',
        cooldown: 300,
        actions: [
          { type: 'sentry', config: {} },
          { type: 'email', config: { to: 'admin@example.com' } },
        ],
      },
    ];
  }

  public checkAlerts(metrics: any) {
    this.rules.forEach(rule => {
      if (rule.condition(metrics)) {
        this.triggerAlert(rule, metrics);
      }
    });
  }

  private triggerAlert(rule: AlertRule, metrics: any) {
    const now = Date.now();
    const lastAlerted = this.lastAlerted.get(rule.name) || 0;

    // クールダウン期間中はアラート送信をスキップ
    if (now - lastAlerted < rule.cooldown * 1000) {
      return;
    }

    console.log(`🚨 Alert: ${rule.name} - ${rule.message}`);

    // アクション実行
    rule.actions.forEach(action => {
      this.executeAction(action, rule, metrics);
    });

    this.lastAlerted.set(rule.name, now);
  }

  private executeAction(action: AlertAction, rule: AlertRule, metrics: any) {
    switch (action.type) {
      case 'sentry':
        Sentry.captureMessage(rule.message, this.getSentryLevel(rule.severity));
        break;

      case 'console':
        console.error(`🚨 ${rule.severity.toUpperCase()}: ${rule.message}`, metrics);
        break;

      case 'slack':
        this.sendSlackAlert(rule, metrics, action.config);
        break;

      case 'email':
        this.sendEmailAlert(rule, metrics, action.config);
        break;
    }
  }

  private getSentryLevel(severity: string): 'info' | 'warning' | 'error' | 'fatal' {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'fatal';
      default: return 'warning';
    }
  }

  private async sendSlackAlert(rule: AlertRule, metrics: any, config: any) {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const payload = {
      text: `🚨 ${rule.severity.toUpperCase()}: ${rule.message}`,
      attachments: [{
        color: this.getAlertColor(rule.severity),
        fields: Object.entries(metrics).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true,
        })),
        timestamp: Math.floor(Date.now() / 1000),
      }],
    };

    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Slack通知送信エラー:', error);
    }
  }

  private async sendEmailAlert(rule: AlertRule, metrics: any, config: any) {
    try {
      await fetch('/api/monitoring/send-alert-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: config.to,
          subject: `Alert: ${rule.message}`,
          rule,
          metrics,
        }),
      });
    } catch (error) {
      console.error('メールアラート送信エラー:', error);
    }
  }

  private getAlertColor(severity: string): string {
    switch (severity) {
      case 'low': return '#36a64f';      // green
      case 'medium': return '#ff9500';   // orange  
      case 'high': return '#e01e5a';     // red
      case 'critical': return '#8b0000'; // dark red
      default: return '#808080';         // gray
    }
  }

  public addRule(rule: AlertRule) {
    this.rules.push(rule);
  }

  public removeRule(name: string) {
    this.rules = this.rules.filter(rule => rule.name !== name);
  }

  public getRules(): AlertRule[] {
    return [...this.rules];
  }
}

export const alertManager = AlertManager.getInstance();
```

### Step 8: ダッシュボード作成

**src/app/monitoring/dashboard/page.tsx**
```typescript
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Grid,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardMetrics {
  errorRate: number;
  avgResponseTime: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTimeHistory: number[];
  errorTypeDistribution: Record<string, number>;
  topPages: Array<{ path: string; views: number }>;
  timeline: string[];
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/monitoring/metrics');
        if (!response.ok) {
          throw new Error('メトリクス取得に失敗しました');
        }
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Typography>読み込み中...</Typography>;
  }

  if (error) {
    return <Alert severity="error">エラー: {error}</Alert>;
  }

  if (!metrics) {
    return <Alert severity="info">データがありません</Alert>;
  }

  const getStatusColor = (value: number, thresholds: { warning: number; error: number }) => {
    if (value >= thresholds.error) return 'error';
    if (value >= thresholds.warning) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        システム監視ダッシュボード
      </Typography>

      <Grid container spacing={3}>
        {/* システム状態 */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="エラー率" />
            <CardContent>
              <Typography 
                variant="h3" 
                color={getStatusColor(metrics.errorRate, { warning: 1, error: 5 })}
              >
                {metrics.errorRate.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="平均応答時間" />
            <CardContent>
              <Typography 
                variant="h3" 
                color={getStatusColor(metrics.avgResponseTime, { warning: 500, error: 1000 })}
              >
                {metrics.avgResponseTime.toFixed(0)}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="アクティブユーザー" />
            <CardContent>
              <Typography variant="h3" color="primary">
                {metrics.activeUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="メモリ使用率" />
            <CardContent>
              <Typography 
                variant="h3" 
                color={getStatusColor(metrics.memoryUsage, { warning: 70, error: 85 })}
              >
                {metrics.memoryUsage.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* パフォーマンストレンド */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="応答時間トレンド" />
            <CardContent>
              <Line
                data={{
                  labels: metrics.timeline,
                  datasets: [{
                    label: '応答時間 (ms)',
                    data: metrics.responseTimeHistory,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                  }],
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: '応答時間 (ms)',
                      },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* エラー分布 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="エラータイプ分布" />
            <CardContent>
              <Doughnut
                data={{
                  labels: Object.keys(metrics.errorTypeDistribution),
                  datasets: [{
                    data: Object.values(metrics.errorTypeDistribution),
                    backgroundColor: [
                      '#FF6384',
                      '#36A2EB',
                      '#FFCE56',
                      '#4BC0C0',
                      '#9966FF',
                    ],
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* トップページ */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="人気ページ" />
            <CardContent>
              <Bar
                data={{
                  labels: metrics.topPages.map(page => page.path),
                  datasets: [{
                    label: 'ページビュー',
                    data: metrics.topPages.map(page => page.views),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                  }],
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'ビュー数',
                      },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
```

### Step 9: API エンドポイント作成

**src/app/api/monitoring/metrics/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { perfMonitor } from '@/lib/monitoring/performance-monitor';

export async function GET(request: NextRequest) {
  try {
    // パフォーマンス統計取得
    const performanceStats = perfMonitor.getAllStats();
    
    // システムメトリクス（実装例）
    const systemMetrics = {
      errorRate: 0.5, // 実際の実装では計算
      avgResponseTime: 250,
      activeUsers: 42,
      memoryUsage: 65.2,
      cpuUsage: 30.1,
    };
    
    // 履歴データ（実装例）
    const historicalData = {
      responseTimeHistory: [200, 220, 240, 230, 250, 260, 250],
      timeline: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'],
      errorTypeDistribution: {
        'ValidationError': 3,
        'NetworkError': 2,
        'DatabaseError': 1,
      },
      topPages: [
        { path: '/', views: 1500 },
        { path: '/posts/123', views: 800 },
        { path: '/auth/login', views: 600 },
      ],
    };
    
    return NextResponse.json({
      ...systemMetrics,
      ...historicalData,
      performanceStats,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('メトリクス取得エラー:', error);
    return NextResponse.json(
      { error: 'メトリクス取得に失敗しました' },
      { status: 500 }
    );
  }
}
```

### Step 10: 設定ファイル更新

**next.config.js**（Sentryウィザード実行後に生成される設定に追加）
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // 既存設定
  experimental: {
    serverComponentsExternalPackages: ['@sentry/nextjs'],
  },
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

**package.json scripts追加**
```json
{
  "scripts": {
    "monitor:check": "node -e \"console.log('Monitoring services check...')\"",
    "monitor:dashboard": "next dev -p 3010",
    "sentry:sourcemaps": "sentry-cli sourcemaps inject --org $SENTRY_ORG --project $SENTRY_PROJECT ./build && sentry-cli sourcemaps upload --org $SENTRY_ORG --project $SENTRY_PROJECT ./build"
  }
}
```

## ✅ 完了確認

### テスト実行
```bash
# Sentryエラートラッキングテスト
npm run dev
# ブラウザで意図的にエラーを発生させてSentryに送信されるか確認

# パフォーマンス監視テスト
# API呼び出しを実行してメトリクスが記録されるか確認

# ダッシュボードアクセステスト
# http://localhost:3010/monitoring/dashboard でダッシュボード表示確認

# アラートテスト
# 閾値を意図的に超えてアラートが発動するか確認
```

### 環境変数設定
```bash
# .env.local に追加
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## 🎯 Phase 0.5完了条件

- [ ] **Sentryエラートラッキング**: エラー自動収集・通知動作
- [ ] **パフォーマンス監視**: メトリクス収集・閾値アラート動作  
- [ ] **Web Vitals監視**: CLS/FID/LCP/FCP/TTFB測定動作
- [ ] **ユーザー行動追跡**: イベント収集・セッション分析動作
- [ ] **ダッシュボード**: リアルタイム表示・チャート描画動作
- [ ] **アラートシステム**: 閾値超過時の通知動作

## 🔄 次のPhaseへ

```bash
# 変更をコミット
git add .
git commit -m "feat: Phase 0.5 - 観測基盤構築完了

- Sentry統合・エラートラッキング実装
- パフォーマンス監視・メトリクス収集実装  
- Web Vitals監視実装
- ユーザー行動分析基盤実装
- リアルタイムダッシュボード作成
- アラートシステム構築完了

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# developにマージ
git checkout develop  
git merge feature/monitoring

# 完了タグ
git tag phase-0.5-complete

# Phase 1準備
git checkout feature/monitoring
git checkout -b feature/auth-system
```

**Phase 0.5完了により、以降の全Phaseでリアルタイム監視・品質可視化が実現されます！**