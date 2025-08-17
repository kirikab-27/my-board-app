import mongoose, { Document, Schema } from 'mongoose';

// 分析イベントの種類
export type AnalyticsEventType = 
  // ユーザー行動
  | 'page_view'           // ページ表示
  | 'click'               // クリック
  | 'scroll'              // スクロール
  | 'form_submit'         // フォーム送信
  | 'search'              // 検索
  | 'download'            // ダウンロード
  
  // コンテンツ関連
  | 'post_view'           // 投稿表示
  | 'post_like'           // 投稿いいね
  | 'post_share'          // 投稿シェア
  | 'comment_post'        // コメント投稿
  | 'media_view'          // メディア表示
  
  // ソーシャル機能
  | 'user_follow'         // ユーザーフォロー
  | 'profile_view'        // プロフィール表示
  | 'notification_click'  // 通知クリック
  
  // システム関連
  | 'api_call'            // API呼び出し
  | 'error'               // エラー発生
  | 'performance'         // パフォーマンス測定
  
  // ビジネス指標
  | 'signup'              // ユーザー登録
  | 'login'               // ログイン
  | 'logout'              // ログアウト
  | 'conversion'          // コンバージョン
  | 'retention'           // リテンション
  | 'custom';             // カスタムイベント

// デバイス・ブラウザ情報
export interface IDeviceInfo {
  userAgent: string;          // ユーザーエージェント
  platform: string;          // プラットフォーム（Windows, Mac, iOS, Android等）
  browser: string;            // ブラウザ（Chrome, Firefox, Safari等）
  browserVersion: string;     // ブラウザバージョン
  deviceType: 'desktop' | 'tablet' | 'mobile' | 'unknown'; // デバイスタイプ
  screenWidth: number;        // 画面幅
  screenHeight: number;       // 画面高さ
  viewport: {                 // ビューポート
    width: number;
    height: number;
  };
  language: string;           // 言語
  timezone: string;           // タイムゾーン
}

// 位置情報
export interface ILocationInfo {
  country?: string;           // 国
  region?: string;            // 地域/州
  city?: string;              // 都市
  latitude?: number;          // 緯度
  longitude?: number;         // 経度
  isp?: string;               // ISP
  timezone?: string;          // タイムゾーン
}

// セッション情報
export interface ISessionInfo {
  sessionId: string;          // セッションID
  isNewSession: boolean;      // 新規セッションかどうか
  sessionStart: Date;         // セッション開始時刻
  sessionDuration?: number;   // セッション継続時間（秒）
  pageViews: number;          // ページビュー数
  referrer?: string;          // リファラー
  landingPage?: string;       // ランディングページ
  exitPage?: string;          // 離脱ページ
}

// パフォーマンス情報
export interface IPerformanceInfo {
  loadTime?: number;          // ページ読み込み時間（ms）
  domReady?: number;          // DOM準備完了時間（ms）
  apiResponseTime?: number;   // API応答時間（ms）
  renderTime?: number;        // レンダリング時間（ms）
  networkType?: string;       // ネットワークタイプ
  connectionSpeed?: string;   // 接続速度
}

// カスタムイベントデータ
export interface ICustomEventData {
  [key: string]: any;         // 柔軟なカスタムデータ
}

export interface IAnalytics extends Document {
  // 基本情報
  eventType: AnalyticsEventType;
  eventName: string;          // イベント名
  category?: string;          // カテゴリ
  label?: string;             // ラベル
  value?: number;             // 数値（コンバージョン額等）
  
  // ユーザー情報
  userId?: string;            // ユーザーID（ログイン済みの場合）
  anonymousId: string;        // 匿名ID（クッキー等）
  userEmail?: string;         // ユーザーメール
  
  // セッション・デバイス情報
  sessionInfo: ISessionInfo;
  deviceInfo: IDeviceInfo;
  locationInfo?: ILocationInfo;
  
  // ページ・コンテンツ情報
  url: string;                // 現在のURL
  path: string;               // URLパス
  title?: string;             // ページタイトル
  contentId?: string;         // コンテンツID（投稿ID等）
  contentType?: string;       // コンテンツタイプ
  
  // 対象オブジェクト情報
  targetId?: string;          // 対象のオブジェクトID
  targetType?: string;        // 対象のオブジェクトタイプ
  targetUrl?: string;         // 対象のURL
  
  // パフォーマンス情報
  performance?: IPerformanceInfo;
  
  // エラー情報（errorイベントの場合）
  errorMessage?: string;      // エラーメッセージ
  errorStack?: string;        // エラースタック
  errorType?: string;         // エラータイプ
  
  // A/Bテスト情報
  experimentId?: string;      // 実験ID
  variant?: string;           // バリエーション
  
  // カスタムデータ
  customData?: ICustomEventData;
  
  // メタデータ
  source: string;             // データソース（web, mobile, api等）
  version?: string;           // アプリケーションバージョン
  environment: 'development' | 'staging' | 'production'; // 環境
  
  // タイムスタンプ
  timestamp: Date;            // イベント発生日時
  createdAt: Date;
  
  // メソッド
  calculateDuration(endTime: Date): number;
  enrichWithUserData(): Promise<void>;
  aggregateToHourly(): Promise<void>;
  isValidEvent(): boolean;
}

const AnalyticsSchema: Schema = new Schema({
  // 基本情報
  eventType: {
    type: String,
    enum: [
      'page_view', 'click', 'scroll', 'form_submit', 'search', 'download',
      'post_view', 'post_like', 'post_share', 'comment_post', 'media_view',
      'user_follow', 'profile_view', 'notification_click',
      'api_call', 'error', 'performance',
      'signup', 'login', 'logout', 'conversion', 'retention', 'custom'
    ],
    required: [true, 'イベントタイプは必須です']
  },
  eventName: {
    type: String,
    required: [true, 'イベント名は必須です'],
    maxlength: [100, 'イベント名は100文字以内で入力してください'],
    trim: true
  },
  category: {
    type: String,
    maxlength: [50, 'カテゴリは50文字以内で入力してください'],
    trim: true
  },
  label: {
    type: String,
    maxlength: [100, 'ラベルは100文字以内で入力してください'],
    trim: true
  },
  value: {
    type: Number,
    min: 0
  },
  
  // ユーザー情報
  userId: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効なユーザーIDです'
    }
  },
  anonymousId: {
    type: String,
    required: [true, '匿名IDは必須です'],
    maxlength: [255, '匿名IDは255文字以内である必要があります']
  },
  userEmail: {
    type: String,
    maxlength: [255, 'ユーザーメールは255文字以内である必要があります'],
    validate: {
      validator: function(v: string) {
        return !v || /^[\w\.-]+@[\w\.-]+\.\w+$/.test(v);
      },
      message: '有効なメールアドレスを入力してください'
    }
  },
  
  // セッション情報
  sessionInfo: {
    sessionId: {
      type: String,
      required: [true, 'セッションIDは必須です'],
      maxlength: [255, 'セッションIDは255文字以内である必要があります']
    },
    isNewSession: {
      type: Boolean,
      default: false
    },
    sessionStart: {
      type: Date,
      required: [true, 'セッション開始時刻は必須です']
    },
    sessionDuration: {
      type: Number,
      min: 0
    },
    pageViews: {
      type: Number,
      default: 1,
      min: 0
    },
    referrer: {
      type: String,
      maxlength: [500, 'リファラーは500文字以内である必要があります']
    },
    landingPage: {
      type: String,
      maxlength: [500, 'ランディングページは500文字以内である必要があります']
    },
    exitPage: {
      type: String,
      maxlength: [500, '離脱ページは500文字以内である必要があります']
    }
  },
  
  // デバイス情報
  deviceInfo: {
    userAgent: {
      type: String,
      required: [true, 'ユーザーエージェントは必須です'],
      maxlength: [1000, 'ユーザーエージェントは1000文字以内である必要があります']
    },
    platform: {
      type: String,
      required: [true, 'プラットフォームは必須です'],
      maxlength: [50, 'プラットフォームは50文字以内である必要があります']
    },
    browser: {
      type: String,
      required: [true, 'ブラウザは必須です'],
      maxlength: [50, 'ブラウザは50文字以内である必要があります']
    },
    browserVersion: {
      type: String,
      maxlength: [20, 'ブラウザバージョンは20文字以内である必要があります']
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile', 'unknown'],
      default: 'unknown'
    },
    screenWidth: {
      type: Number,
      min: 0,
      max: 10000
    },
    screenHeight: {
      type: Number,
      min: 0,
      max: 10000
    },
    viewport: {
      width: { type: Number, min: 0, max: 10000 },
      height: { type: Number, min: 0, max: 10000 }
    },
    language: {
      type: String,
      maxlength: [10, '言語は10文字以内である必要があります']
    },
    timezone: {
      type: String,
      maxlength: [50, 'タイムゾーンは50文字以内である必要があります']
    }
  },
  
  // 位置情報
  locationInfo: {
    country: {
      type: String,
      maxlength: [100, '国名は100文字以内である必要があります']
    },
    region: {
      type: String,
      maxlength: [100, '地域名は100文字以内である必要があります']
    },
    city: {
      type: String,
      maxlength: [100, '都市名は100文字以内である必要があります']
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    isp: {
      type: String,
      maxlength: [100, 'ISPは100文字以内である必要があります']
    },
    timezone: {
      type: String,
      maxlength: [50, 'タイムゾーンは50文字以内である必要があります']
    }
  },
  
  // ページ・コンテンツ情報
  url: {
    type: String,
    required: [true, 'URLは必須です'],
    maxlength: [2000, 'URLは2000文字以内である必要があります']
  },
  path: {
    type: String,
    required: [true, 'パスは必須です'],
    maxlength: [500, 'パスは500文字以内である必要があります']
  },
  title: {
    type: String,
    maxlength: [200, 'タイトルは200文字以内で入力してください']
  },
  contentId: {
    type: String,
    maxlength: [255, 'コンテンツIDは255文字以内である必要があります']
  },
  contentType: {
    type: String,
    maxlength: [50, 'コンテンツタイプは50文字以内である必要があります']
  },
  
  // 対象オブジェクト情報
  targetId: {
    type: String,
    maxlength: [255, '対象IDは255文字以内である必要があります']
  },
  targetType: {
    type: String,
    maxlength: [50, '対象タイプは50文字以内である必要があります']
  },
  targetUrl: {
    type: String,
    maxlength: [2000, '対象URLは2000文字以内である必要があります']
  },
  
  // パフォーマンス情報
  performance: {
    loadTime: { type: Number, min: 0 },
    domReady: { type: Number, min: 0 },
    apiResponseTime: { type: Number, min: 0 },
    renderTime: { type: Number, min: 0 },
    networkType: {
      type: String,
      maxlength: [20, 'ネットワークタイプは20文字以内である必要があります']
    },
    connectionSpeed: {
      type: String,
      maxlength: [20, '接続速度は20文字以内である必要があります']
    }
  },
  
  // エラー情報
  errorMessage: {
    type: String,
    maxlength: [1000, 'エラーメッセージは1000文字以内である必要があります']
  },
  errorStack: {
    type: String,
    maxlength: [5000, 'エラースタックは5000文字以内である必要があります']
  },
  errorType: {
    type: String,
    maxlength: [100, 'エラータイプは100文字以内である必要があります']
  },
  
  // A/Bテスト情報
  experimentId: {
    type: String,
    maxlength: [100, '実験IDは100文字以内である必要があります']
  },
  variant: {
    type: String,
    maxlength: [50, 'バリエーションは50文字以内である必要があります']
  },
  
  // カスタムデータ
  customData: {
    type: Schema.Types.Mixed
  },
  
  // メタデータ
  source: {
    type: String,
    required: [true, 'データソースは必須です'],
    enum: ['web', 'mobile', 'api', 'server', 'webhook'],
    default: 'web'
  },
  version: {
    type: String,
    maxlength: [20, 'バージョンは20文字以内である必要があります']
  },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'production',
    required: [true, '環境は必須です']
  },
  
  // タイムスタンプ
  timestamp: {
    type: Date,
    required: [true, 'タイムスタンプは必須です'],
    default: Date.now
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }, // updatedAtは不要
  collection: 'analytics',
  versionKey: false
});

// TTLインデックス：1年後に自動削除
AnalyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// バリデーション：エラーイベントの場合はエラー情報が必須
AnalyticsSchema.pre('save', function (next) {
  if (this.eventType === 'error' && !this.errorMessage) {
    return next(new Error('エラーイベントの場合、エラーメッセージは必須です'));
  }
  
  // パフォーマンスイベントの場合は何らかの測定値が必須
  if (this.eventType === 'performance' && !this.performance) {
    return next(new Error('パフォーマンスイベントの場合、パフォーマンス情報は必須です'));
  }
  
  next();
});

// ミドルウェア：保存前処理
AnalyticsSchema.pre('save', async function (next) {
  try {
    // セッション継続時間の計算
    if (this.sessionInfo && typeof this.sessionInfo === 'object' && 
        'sessionStart' in this.sessionInfo && (this.sessionInfo as any).sessionStart && 
        !('sessionDuration' in this.sessionInfo && (this.sessionInfo as any).sessionDuration)) {
      (this.sessionInfo as any).sessionDuration = Math.floor(
        ((this as any).timestamp.getTime() - (this.sessionInfo as any).sessionStart.getTime()) / 1000
      );
    }
    
    // URLからパスを抽出（パスが設定されていない場合）
    if (!this.path && this.url && typeof this.url === 'string') {
      try {
        const urlObj = new URL(this.url);
        this.path = urlObj.pathname;
      } catch {
        this.path = '/';
      }
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 継続時間計算メソッド
AnalyticsSchema.methods.calculateDuration = function (endTime: Date): number {
  return Math.floor((endTime.getTime() - this.timestamp.getTime()) / 1000);
};

// ユーザーデータ補完メソッド
AnalyticsSchema.methods.enrichWithUserData = async function (): Promise<void> {
  if (!this.userId) return;
  
  try {
    const User = mongoose.models.User;
    if (User) {
      const user = await User.findById(this.userId);
      if (user) {
        this.userEmail = user.email;
        // その他のユーザー情報も必要に応じて設定
      }
    }
  } catch (error) {
    console.error('ユーザーデータの補完に失敗しました:', error);
  }
};

// 時間別集計メソッド
AnalyticsSchema.methods.aggregateToHourly = async function (): Promise<void> {
  // 実際の実装では、別の集計テーブルにデータを蓄積
  // ここではログのみ
  console.log(`時間別集計: ${this.eventType} at ${this.timestamp}`);
};

// イベント有効性チェック
AnalyticsSchema.methods.isValidEvent = function (): boolean {
  // 基本的な有効性チェック
  if (!this.eventType || !this.eventName || !this.timestamp) {
    return false;
  }
  
  // URL形式チェック
  try {
    new URL(this.url);
  } catch {
    return false;
  }
  
  // セッション情報チェック
  if (!this.sessionInfo.sessionId || !this.sessionInfo.sessionStart) {
    return false;
  }
  
  return true;
};

// パフォーマンス最適化インデックス
AnalyticsSchema.index({ eventType: 1, timestamp: -1 }); // イベントタイプ・時間別
AnalyticsSchema.index({ userId: 1, timestamp: -1 }); // ユーザー・時間別
AnalyticsSchema.index({ 'sessionInfo.sessionId': 1, timestamp: 1 }); // セッション別
AnalyticsSchema.index({ path: 1, timestamp: -1 }); // ページ・時間別
AnalyticsSchema.index({ anonymousId: 1, timestamp: -1 }); // 匿名ユーザー・時間別

// 複合インデックス
AnalyticsSchema.index({ 
  eventType: 1, 
  'deviceInfo.deviceType': 1, 
  timestamp: -1 
}); // イベント・デバイス・時間
AnalyticsSchema.index({ 
  environment: 1, 
  source: 1, 
  timestamp: -1 
}); // 環境・ソース・時間
AnalyticsSchema.index({ 
  'locationInfo.country': 1, 
  timestamp: -1 
}); // 国・時間別

// 集計用インデックス
AnalyticsSchema.index({ 
  eventType: 1, 
  category: 1, 
  timestamp: -1 
}); // カテゴリ別集計
AnalyticsSchema.index({ 
  contentId: 1, 
  eventType: 1, 
  timestamp: -1 
}); // コンテンツ別分析

// 静的メソッド：時間別統計取得
AnalyticsSchema.statics.getHourlyStats = async function(
  startDate: Date, 
  endDate: Date, 
  eventTypes?: string[]
): Promise<any[]> {
  const pipeline: any[] = [
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        ...(eventTypes && { eventType: { $in: eventTypes } })
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
          eventType: '$eventType'
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionInfo.sessionId' }
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' },
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day',
            hour: '$_id.hour'
          }
        }
      }
    },
    { $sort: { date: 1 } }
  ];
  
  return this.aggregate(pipeline);
};

// 静的メソッド：ページビュー統計取得
AnalyticsSchema.statics.getPageViewStats = async function(
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<any[]> {
  const matchQuery: any = {
    eventType: 'page_view',
    timestamp: { $gte: startDate, $lte: endDate }
  };
  
  if (userId) {
    matchQuery.userId = userId;
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$path',
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$anonymousId' },
        avgSessionDuration: { $avg: '$sessionInfo.sessionDuration' },
        bounceRate: {
          $avg: {
            $cond: [{ $eq: ['$sessionInfo.pageViews', 1] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        path: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
        avgSessionDuration: { $round: ['$avgSessionDuration', 2] },
        bounceRate: { $round: [{ $multiply: ['$bounceRate', 100] }, 2] }
      }
    },
    { $sort: { views: -1 } }
  ]);
};

// 静的メソッド：デバイス別統計取得
AnalyticsSchema.statics.getDeviceStats = async function(
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          deviceType: '$deviceInfo.deviceType',
          browser: '$deviceInfo.browser',
          platform: '$deviceInfo.platform'
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$anonymousId' }
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// 静的メソッド：エラー統計取得
AnalyticsSchema.statics.getErrorStats = async function(
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  return this.aggregate([
    {
      $match: {
        eventType: 'error',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          errorType: '$errorType',
          path: '$path'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' },
        affectedUsers: { $addToSet: '$userId' },
        errorMessages: { $addToSet: '$errorMessage' }
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        lastOccurrence: 1,
        affectedUsers: { $size: '$affectedUsers' },
        uniqueErrors: { $size: '$errorMessages' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// 静的メソッド：コンバージョン率計算
AnalyticsSchema.statics.getConversionRate = async function(
  startDate: Date,
  endDate: Date,
  goalEvent: string = 'conversion'
): Promise<any> {
  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$userId',
        events: { $push: '$eventType' },
        firstEvent: { $min: '$timestamp' }
      }
    },
    {
      $project: {
        hasGoal: { $in: [goalEvent, '$events'] },
        isNewUser: {
          $gte: ['$firstEvent', startDate]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        convertedUsers: { $sum: { $cond: ['$hasGoal', 1, 0] } },
        newUsers: { $sum: { $cond: ['$isNewUser', 1, 0] } },
        newConverted: {
          $sum: {
            $cond: [{ $and: ['$hasGoal', '$isNewUser'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        totalUsers: 1,
        convertedUsers: 1,
        conversionRate: {
          $multiply: [
            { $divide: ['$convertedUsers', '$totalUsers'] },
            100
          ]
        },
        newUserConversionRate: {
          $multiply: [
            { $divide: ['$newConverted', '$newUsers'] },
            100
          ]
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalUsers: 0,
    convertedUsers: 0,
    conversionRate: 0,
    newUserConversionRate: 0
  };
};

// 静的メソッド：リアルタイムアクティブユーザー数取得
AnalyticsSchema.statics.getActiveUsers = async function(
  timeRangeMinutes: number = 5
): Promise<number> {
  const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
  
  const result = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: cutoffTime }
      }
    },
    {
      $group: {
        _id: null,
        activeUsers: { $addToSet: '$anonymousId' }
      }
    },
    {
      $project: {
        count: { $size: '$activeUsers' }
      }
    }
  ]);
  
  return result[0]?.count || 0;
};

// 静的メソッド：カスタムイベント記録
AnalyticsSchema.statics.trackEvent = async function(eventData: Partial<IAnalytics>): Promise<IAnalytics> {
  // 必須フィールドのデフォルト値設定
  const defaultData = {
    timestamp: new Date(),
    anonymousId: eventData.anonymousId || `anon_${Date.now()}_${Math.random()}`,
    sessionInfo: {
      sessionId: `session_${Date.now()}_${Math.random()}`,
      isNewSession: true,
      sessionStart: new Date(),
      pageViews: 1,
      ...eventData.sessionInfo
    },
    deviceInfo: {
      userAgent: 'Unknown',
      platform: 'Unknown',
      browser: 'Unknown',
      browserVersion: 'Unknown',
      deviceType: 'unknown' as const,
      screenWidth: 0,
      screenHeight: 0,
      viewport: { width: 0, height: 0 },
      language: 'unknown',
      timezone: 'unknown',
      ...eventData.deviceInfo
    },
    url: eventData.url || '/',
    path: eventData.path || '/',
    source: eventData.source || 'web',
    environment: eventData.environment || 'production'
  };
  
  return this.create({ ...defaultData, ...eventData });
};

export default mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);