import { config } from './configLoader';

// アプリケーション起動時の設定初期化
let initPromise: Promise<void> | null = null;

export async function ensureConfigInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = config.initialize();
  }
  await initPromise;
}

// サーバーサイドで自動的に初期化
if (typeof window === 'undefined') {
  ensureConfigInitialized().catch(console.error);
}
