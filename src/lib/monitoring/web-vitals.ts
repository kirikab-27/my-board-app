import { onCLS, onFID, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

export function reportWebVitals() {
  // Cumulative Layout Shift
  onCLS(onPerfEntry);
  
  // First Input Delay
  onFID(onPerfEntry);
  
  // First Contentful Paint
  onFCP(onPerfEntry);
  
  // Largest Contentful Paint
  onLCP(onPerfEntry);
  
  // Time to First Byte
  onTTFB(onPerfEntry);
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
  if (typeof window !== 'undefined' && (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag!('event', metric.name, {
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