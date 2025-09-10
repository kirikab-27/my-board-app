import { configService } from '@/services/configService';
import { Environment } from '@/models/SystemConfig';

// 設定キャッシュ
const configCache = new Map<string, any>();
let isInitialized = false;

// 設定のインターフェース
export interface AppConfig {
  // メール設定
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromAddress: string;
    fromName: string;
  };

  // アップロード設定
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
    cloudinaryUrl?: string;
  };

  // セキュリティ設定
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    jwtSecret: string;
    encryptionKey: string;
  };

  // 機能フラグ
  features: {
    enableSignup: boolean;
    enableSocialLogin: boolean;
    enableEmailVerification: boolean;
    enable2FA: boolean;
    enableMediaUpload: boolean;
    maintenanceMode: boolean;
  };

  // パフォーマンス設定
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    rateLimit: number;
    rateLimitWindow: number;
  };

  // API設定
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    rateLimitPerMinute: number;
  };
}

// デフォルト設定
const defaultConfig: AppConfig = {
  email: {
    smtpHost: process.env.SMTP_HOST || 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    fromAddress: process.env.MAIL_FROM_ADDRESS || 'noreply@example.com',
    fromName: 'My Board App',
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    cloudinaryUrl: process.env.CLOUDINARY_URL,
  },
  security: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24時間
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分
    jwtSecret: process.env.NEXTAUTH_SECRET || 'default-secret',
    encryptionKey: process.env.CONFIG_ENCRYPTION_KEY || 'default-key',
  },
  features: {
    enableSignup: true,
    enableSocialLogin: true,
    enableEmailVerification: true,
    enable2FA: false,
    enableMediaUpload: true,
    maintenanceMode: false,
  },
  performance: {
    cacheEnabled: true,
    cacheTTL: 5 * 60 * 1000, // 5分
    rateLimit: 100,
    rateLimitWindow: 60 * 1000, // 1分
  },
  api: {
    baseUrl: process.env.APP_URL || 'http://localhost:3010',
    timeout: 30000, // 30秒
    retryAttempts: 3,
    rateLimitPerMinute: 100,
  },
};

// 設定の初期化
export async function initializeConfig(): Promise<void> {
  if (isInitialized) return;

  const environment = (process.env.NODE_ENV as Environment) || 'development';

  try {
    // データベースから設定を読み込み
    const dbConfigs = await configService.getByCategory('all', environment);

    // 設定をマージ
    for (const dbConfig of dbConfigs) {
      const value = dbConfig.isSecret ? dbConfig.getDecryptedValue() : dbConfig.value;
      setNestedValue(configCache, dbConfig.key, value);
    }

    isInitialized = true;
    console.log('Configuration loaded successfully');
  } catch (error) {
    console.error('Failed to load configuration from database:', error);
    // データベースエラーの場合はデフォルト設定を使用
    Object.assign(configCache, defaultConfig);
    isInitialized = true;
  }

  // ホットリロードリスナーを設定
  setupHotReload();
}

// ネストされたオブジェクトに値を設定
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

// ネストされたオブジェクトから値を取得
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current[key] === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

// 設定の取得
export function getConfig<T = any>(key?: string): T {
  if (!isInitialized) {
    console.warn('Configuration not initialized, using defaults');
    if (!key) return defaultConfig as T;
    return getNestedValue(defaultConfig, key) as T;
  }

  if (!key) {
    // 全設定を返す
    return { ...defaultConfig, ...configCache } as T;
  }

  // 特定の設定を返す
  const value = getNestedValue(configCache, key);
  if (value !== undefined) {
    return value as T;
  }

  // キャッシュになければデフォルトから取得
  return getNestedValue(defaultConfig, key) as T;
}

// 設定の更新（ホットリロード用）
export function updateConfig(key: string, value: any): void {
  setNestedValue(configCache, key, value);
  console.log(`Configuration updated: ${key} = ${JSON.stringify(value)}`);
}

// ホットリロードの設定
function setupHotReload(): void {
  // configServiceのイベントリスナーを設定
  configService.onConfigChange(({ key, value, environment }) => {
    const currentEnv = (process.env.NODE_ENV as Environment) || 'development';

    // 現在の環境の設定のみ更新
    if (environment === currentEnv) {
      updateConfig(key, value);

      // 特定の設定変更に対する処理
      handleConfigChange(key, value);
    }
  });
}

// 設定変更時の処理
function handleConfigChange(key: string, value: any): void {
  switch (key) {
    case 'features.maintenanceMode':
      if (value) {
        console.log('⚠️ Maintenance mode enabled');
        // メンテナンスモードの処理
      } else {
        console.log('✅ Maintenance mode disabled');
      }
      break;

    case 'performance.cacheEnabled':
      if (!value) {
        // キャッシュをクリア
        configCache.clear();
        initializeConfig(); // 再初期化
      }
      break;

    case 'security.sessionTimeout':
      console.log(`Session timeout updated to ${value}ms`);
      // セッション設定の更新処理
      break;

    default:
      // その他の設定変更
      break;
  }
}

// 設定のリロード（手動）
export async function reloadConfig(): Promise<void> {
  configCache.clear();
  isInitialized = false;
  await initializeConfig();
}

// エクスポート用のヘルパー関数
export const config = {
  get: getConfig,
  update: updateConfig,
  reload: reloadConfig,
  initialize: initializeConfig,
};
