import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Edge runtime用の軽量設定
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 1.0,

  beforeSend(event) {
    // Edge runtime機密情報保護
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      if (typeof data === 'object' && data !== null) {
        ['password', 'token', 'secret', 'key'].forEach((key) => {
          if (key in data) {
            data[key] = '[Filtered]';
          }
        });
      }
    }

    return event;
  },
});
