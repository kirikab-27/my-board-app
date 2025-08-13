import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  integrations: [
    Sentry.browserTracingIntegration({
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/.*\.vercel\.app/,
        /^https:\/\/your-domain\.com/
      ],
    }),
    Sentry.replayIntegration({
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
      if ((hint.originalException as Error)?.message?.includes('ResizeObserver')) {
        return null;
      }
      if ((hint.originalException as Error)?.message?.includes('Non-Error promise rejection')) {
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