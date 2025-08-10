import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/nextjs';

export interface UserEvent {
  eventId: string;
  eventName: string;
  userId?: string;
  sessionId: string;
  timestamp: number;
  properties: Record<string, unknown>;
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

  public track(eventName: string, properties: Record<string, unknown> = {}, userId?: string) {
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
    if (typeof window !== 'undefined' && (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag!('event', event.eventName, {
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
  public trackAuthEvent(event: 'login_start' | 'login_success' | 'login_failed' | 'register_start' | 'register_success' | 'register_failed' | 'logout', metadata?: Record<string, unknown>) {
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
  public trackPostEvent(event: 'create' | 'edit' | 'delete' | 'like' | 'view', postId?: string, metadata?: Record<string, unknown>) {
    this.track(`post.${event}`, {
      postId,
      ...metadata,
    });
  }

  // エラーイベント
  public trackError(error: Error, context?: Record<string, unknown>) {
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