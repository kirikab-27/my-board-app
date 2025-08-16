import mongoose, { Document, Schema } from 'mongoose';

// メディアタイプの定義
export type MediaType = 'image' | 'video' | 'gif' | 'audio' | 'document';
export type MediaStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted';
export type MediaVisibility = 'public' | 'unlisted' | 'private';

// ファイル形式の定義
export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp' | 'svg' | 'bmp';
export type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'wmv' | 'flv';
export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'aac' | 'flac';
export type DocumentFormat = 'pdf' | 'doc' | 'docx' | 'txt' | 'rtf';

// メディアのメタデータ
export interface IMediaMetadata {
  // 基本ファイル情報
  originalName: string;        // 元のファイル名
  mimeType: string;           // MIMEタイプ
  fileExtension: string;      // ファイル拡張子
  
  // サイズ・品質情報
  width?: number;             // 幅（ピクセル）
  height?: number;            // 高さ（ピクセル）
  duration?: number;          // 再生時間（秒、動画・音声用）
  bitrate?: number;           // ビットレート
  fps?: number;               // フレームレート（動画用）
  
  // EXIF情報（画像用）
  exif?: {
    camera?: string;          // カメラ機種
    lens?: string;            // レンズ情報
    iso?: number;             // ISO値
    aperture?: string;        // 絞り値
    shutterSpeed?: string;    // シャッタースピード
    focalLength?: string;     // 焦点距離
    flash?: boolean;          // フラッシュ使用
    gps?: {                   // GPS情報
      latitude: number;
      longitude: number;
      altitude?: number;
    };
    dateTaken?: Date;         // 撮影日時
  };
  
  // カラー情報
  dominantColors?: string[];  // 主要色
  averageColor?: string;      // 平均色
  
  // その他のメタデータ
  customData?: any;           // カスタムデータ
}

// Cloudinary情報
export interface ICloudinaryInfo {
  publicId: string;           // Cloudinary公開ID
  version: number;            // バージョン番号
  signature: string;          // セキュリティ署名
  url: string;                // 基本URL
  secureUrl: string;          // HTTPS URL
  
  // 変換済みURL
  thumbnailUrl?: string;      // サムネイルURL
  optimizedUrl?: string;      // 最適化済みURL
  
  // 変換オプション
  transformations?: string[]; // 適用済み変換
  format?: string;            // 配信形式
  quality?: string;           // 品質設定
}

// アクセス統計
export interface IMediaStats {
  views: number;              // 表示回数
  downloads: number;          // ダウンロード回数
  shares: number;             // シェア回数
  bandwidth: number;          // 使用帯域幅（バイト）
  uniqueViewers: number;      // ユニーク視聴者数
  avgViewDuration?: number;   // 平均視聴時間（動画用）
  
  // 日別統計（直近30日）
  dailyViews: Array<{
    date: Date;
    views: number;
    downloads: number;
    bandwidth: number;
  }>;
}

// セキュリティスキャン結果
export interface ISecurityScan {
  isScanned: boolean;         // スキャン済みかどうか
  isSafe: boolean;            // 安全かどうか
  threats: string[];          // 検出された脅威
  adultContent?: number;      // アダルトコンテンツスコア（0-1）
  violenceContent?: number;   // 暴力コンテンツスコア（0-1）
  scanDate?: Date;            // スキャン日時
  scanEngine?: string;        // スキャンエンジン名
}

export interface IMedia extends Document {
  // 基本情報
  type: MediaType;
  status: MediaStatus;
  visibility: MediaVisibility;
  
  // ファイル情報
  filename: string;           // ファイル名
  size: number;               // ファイルサイズ（バイト）
  metadata: IMediaMetadata;
  
  // Cloudinary統合
  cloudinary: ICloudinaryInfo;
  
  // 関連情報
  uploadedBy: string;         // アップロード者のユーザーID
  uploaderName: string;       // アップロード者名
  
  // 使用箇所
  usedInPosts: string[];      // 使用している投稿ID一覧
  usedInComments: string[];   // 使用しているコメントID一覧
  usedInProfiles: string[];   // プロフィールで使用しているユーザーID一覧
  
  // 説明・タグ
  title?: string;             // タイトル
  description?: string;       // 説明
  alt: string;                // 代替テキスト
  tags: string[];             // タグ
  
  // アクセス制御
  isPublic: boolean;          // 公開状態
  allowDownload: boolean;     // ダウンロード許可
  watermark?: string;         // ウォーターマーク設定
  
  // 統計情報
  stats: IMediaStats;
  
  // セキュリティ
  security: ISecurityScan;
  
  // 有効期限・保持期間
  expiresAt?: Date;           // 有効期限
  autoDeleteAt?: Date;        // 自動削除日
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  uploadedAt: Date;           // アップロード完了日時
  
  // メソッド
  generateThumbnail(): Promise<string>;
  updateStats(action: 'view' | 'download' | 'share', userId?: string): Promise<void>;
  getOptimizedUrl(options?: any): string;
  canUserAccess(userId?: string): Promise<boolean>;
  canUserEdit(userId?: string): boolean;
  scanForSecurity(): Promise<void>;
  softDelete(): Promise<void>;
  getUsageCount(): number;
}

const MediaSchema: Schema = new Schema({
  // 基本情報
  type: {
    type: String,
    enum: ['image', 'video', 'gif', 'audio', 'document'],
    required: [true, 'メディアタイプは必須です']
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'failed', 'deleted'],
    default: 'uploading',
    required: [true, 'ステータスは必須です']
  },
  visibility: {
    type: String,
    enum: ['public', 'unlisted', 'private'],
    default: 'public',
    required: [true, '公開設定は必須です']
  },
  
  // ファイル情報
  filename: {
    type: String,
    required: [true, 'ファイル名は必須です'],
    maxlength: [255, 'ファイル名は255文字以内である必要があります'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'ファイルサイズは必須です'],
    min: [0, 'ファイルサイズは0以上である必要があります'],
    max: [100 * 1024 * 1024, 'ファイルサイズは100MB以下である必要があります'] // 100MB制限
  },
  
  // メタデータ
  metadata: {
    originalName: {
      type: String,
      required: [true, '元のファイル名は必須です'],
      maxlength: [255, '元のファイル名は255文字以内である必要があります']
    },
    mimeType: {
      type: String,
      required: [true, 'MIMEタイプは必須です'],
      maxlength: [100, 'MIMEタイプは100文字以内である必要があります']
    },
    fileExtension: {
      type: String,
      required: [true, 'ファイル拡張子は必須です'],
      maxlength: [10, 'ファイル拡張子は10文字以内である必要があります'],
      lowercase: true
    },
    width: { type: Number, min: 0, max: 10000 },
    height: { type: Number, min: 0, max: 10000 },
    duration: { type: Number, min: 0 },
    bitrate: { type: Number, min: 0 },
    fps: { type: Number, min: 0, max: 120 },
    
    // EXIF情報
    exif: {
      camera: { type: String, maxlength: [100, 'カメラ機種は100文字以内である必要があります'] },
      lens: { type: String, maxlength: [100, 'レンズ情報は100文字以内である必要があります'] },
      iso: { type: Number, min: 0, max: 100000 },
      aperture: { type: String, maxlength: [20, '絞り値は20文字以内である必要があります'] },
      shutterSpeed: { type: String, maxlength: [20, 'シャッタースピードは20文字以内である必要があります'] },
      focalLength: { type: String, maxlength: [20, '焦点距離は20文字以内である必要があります'] },
      flash: { type: Boolean },
      gps: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
        altitude: { type: Number }
      },
      dateTaken: { type: Date }
    },
    
    // カラー情報
    dominantColors: [{
      type: String,
      maxlength: [7, 'カラーコードは7文字以内である必要があります'],
      match: [/^#[0-9A-Fa-f]{6}$/, '有効なカラーコードを入力してください']
    }],
    averageColor: {
      type: String,
      maxlength: [7, 'カラーコードは7文字以内である必要があります'],
      match: [/^#[0-9A-Fa-f]{6}$/, '有効なカラーコードを入力してください']
    },
    
    customData: { type: Schema.Types.Mixed }
  },
  
  // Cloudinary統合
  cloudinary: {
    publicId: {
      type: String,
      required: [true, 'Cloudinary公開IDは必須です'],
      maxlength: [255, 'Cloudinary公開IDは255文字以内である必要があります']
    },
    version: {
      type: Number,
      required: [true, 'Cloudinaryバージョンは必須です'],
      min: 1
    },
    signature: {
      type: String,
      required: [true, 'Cloudinary署名は必須です'],
      maxlength: [255, 'Cloudinary署名は255文字以内である必要があります']
    },
    url: {
      type: String,
      required: [true, 'CloudinaryのURLは必須です'],
      validate: {
        validator: function(v: string) {
          return /^https:\/\/res\.cloudinary\.com\//.test(v);
        },
        message: '有効なCloudinary URLを入力してください'
      }
    },
    secureUrl: {
      type: String,
      required: [true, 'CloudinaryのHTTPS URLは必須です'],
      validate: {
        validator: function(v: string) {
          return /^https:\/\/res\.cloudinary\.com\//.test(v);
        },
        message: '有効なCloudinary HTTPS URLを入力してください'
      }
    },
    thumbnailUrl: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https:\/\/res\.cloudinary\.com\//.test(v);
        },
        message: '有効なCloudinaryサムネイルURLを入力してください'
      }
    },
    optimizedUrl: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https:\/\/res\.cloudinary\.com\//.test(v);
        },
        message: '有効なCloudinary最適化URLを入力してください'
      }
    },
    transformations: [{ type: String, maxlength: [100, '変換設定は100文字以内である必要があります'] }],
    format: { type: String, maxlength: [10, 'フォーマットは10文字以内である必要があります'] },
    quality: { type: String, maxlength: [20, '品質設定は20文字以内である必要があります'] }
  },
  
  // 関連情報
  uploadedBy: {
    type: String,
    required: [true, 'アップロード者IDは必須です'],
    validate: {
      validator: function(v: string) {
        return /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効なユーザーIDです'
    }
  },
  uploaderName: {
    type: String,
    required: [true, 'アップロード者名は必須です'],
    maxlength: [100, 'アップロード者名は100文字以内である必要があります'],
    trim: true
  },
  
  // 使用箇所
  usedInPosts: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効な投稿IDです'
    }
  }],
  usedInComments: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効なコメントIDです'
    }
  }],
  usedInProfiles: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効なユーザーIDです'
    }
  }],
  
  // 説明・タグ
  title: {
    type: String,
    maxlength: [100, 'タイトルは100文字以内で入力してください'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, '説明は500文字以内で入力してください'],
    trim: true
  },
  alt: {
    type: String,
    required: [true, '代替テキストは必須です'],
    maxlength: [200, '代替テキストは200文字以内で入力してください'],
    trim: true
  },
  tags: [{
    type: String,
    maxlength: [50, 'タグは50文字以内である必要があります'],
    trim: true
  }],
  
  // アクセス制御
  isPublic: {
    type: Boolean,
    default: true
  },
  allowDownload: {
    type: Boolean,
    default: true
  },
  watermark: {
    type: String,
    maxlength: [100, 'ウォーターマーク設定は100文字以内である必要があります']
  },
  
  // 統計情報
  stats: {
    views: { type: Number, default: 0, min: 0 },
    downloads: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    bandwidth: { type: Number, default: 0, min: 0 },
    uniqueViewers: { type: Number, default: 0, min: 0 },
    avgViewDuration: { type: Number, min: 0 },
    
    dailyViews: [{
      date: { type: Date, required: true },
      views: { type: Number, default: 0, min: 0 },
      downloads: { type: Number, default: 0, min: 0 },
      bandwidth: { type: Number, default: 0, min: 0 }
    }]
  },
  
  // セキュリティ
  security: {
    isScanned: { type: Boolean, default: false },
    isSafe: { type: Boolean, default: true },
    threats: [{ type: String, maxlength: [100, '脅威情報は100文字以内である必要があります'] }],
    adultContent: { type: Number, min: 0, max: 1 },
    violenceContent: { type: Number, min: 0, max: 1 },
    scanDate: { type: Date },
    scanEngine: { type: String, maxlength: [50, 'スキャンエンジン名は50文字以内である必要があります'] }
  },
  
  // 有効期限・保持期間
  expiresAt: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        return !v || v > new Date();
      },
      message: '有効期限は現在より後の日時を指定してください'
    }
  },
  autoDeleteAt: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        return !v || v > new Date();
      },
      message: '自動削除日は現在より後の日時を指定してください'
    }
  },
  
  // アップロード完了日時
  uploadedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'media',
  versionKey: false
});

// TTLインデックス：自動削除対応
MediaSchema.index({ autoDeleteAt: 1 }, { expireAfterSeconds: 0 });

// ミドルウェア：保存前処理
MediaSchema.pre('save', async function (next) {
  try {
    // ステータスがreadyになった時にアップロード完了日時を設定
    if (this.isModified('status') && this.status === 'ready' && !this.uploadedAt) {
      this.uploadedAt = new Date();
    }
    
    // 日別統計は直近30日分のみ保持
    if (this.stats.dailyViews.length > 30) {
      this.stats.dailyViews = this.stats.dailyViews
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 30);
    }
    
    // 公開設定とvisibilityの同期
    if (this.isModified('visibility')) {
      this.isPublic = this.visibility === 'public';
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// サムネイル生成メソッド
MediaSchema.methods.generateThumbnail = async function (): Promise<string> {
  if (this.cloudinary.thumbnailUrl) {
    return this.cloudinary.thumbnailUrl;
  }
  
  // Cloudinaryの変換URLを生成
  const baseUrl = this.cloudinary.secureUrl;
  const publicId = this.cloudinary.publicId;
  
  let thumbnailUrl = '';
  
  if (this.type === 'image' || this.type === 'gif') {
    // 画像の場合: 150x150のサムネイルを生成
    thumbnailUrl = baseUrl.replace('/upload/', '/upload/c_fill,w_150,h_150,q_auto,f_auto/');
  } else if (this.type === 'video') {
    // 動画の場合: 最初のフレームからサムネイルを生成
    thumbnailUrl = baseUrl.replace('/upload/', '/upload/c_fill,w_150,h_150,q_auto,f_jpg,fl_attachment/');
  }
  
  if (thumbnailUrl) {
    this.cloudinary.thumbnailUrl = thumbnailUrl;
    await this.save();
  }
  
  return thumbnailUrl;
};

// 統計更新メソッド
MediaSchema.methods.updateStats = async function (action: 'view' | 'download' | 'share', userId?: string): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 全体統計を更新
    if (action === 'view') {
      this.stats.views += 1;
      this.stats.bandwidth += this.size; // 簡易的な帯域幅計算
    } else if (action === 'download') {
      this.stats.downloads += 1;
      this.stats.bandwidth += this.size;
    } else if (action === 'share') {
      this.stats.shares += 1;
    }
    
    // ユニーク視聴者数の更新（簡易版）
    if (userId && action === 'view') {
      // 実際の実装では、別のコレクションで視聴履歴を管理することを推奨
      this.stats.uniqueViewers = Math.max(this.stats.uniqueViewers, this.stats.views * 0.7);
    }
    
    // 日別統計を更新
    let dailyStatIndex = this.stats.dailyViews.findIndex(
      (stat: any) => stat.date.getTime() === today.getTime()
    );
    
    if (dailyStatIndex === -1) {
      this.stats.dailyViews.push({
        date: today,
        views: action === 'view' ? 1 : 0,
        downloads: action === 'download' ? 1 : 0,
        bandwidth: action === 'view' || action === 'download' ? this.size : 0
      });
    } else {
      if (action === 'view') {
        this.stats.dailyViews[dailyStatIndex].views += 1;
        this.stats.dailyViews[dailyStatIndex].bandwidth += this.size;
      } else if (action === 'download') {
        this.stats.dailyViews[dailyStatIndex].downloads += 1;
        this.stats.dailyViews[dailyStatIndex].bandwidth += this.size;
      }
    }
    
    await this.save();
  } catch (error) {
    console.error('メディア統計の更新に失敗しました:', error);
  }
};

// 最適化URL取得メソッド
MediaSchema.methods.getOptimizedUrl = function (options: any = {}): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fit'
  } = options;
  
  let transformations = [`q_${quality}`, `f_${format}`];
  
  if (width || height) {
    const w = width ? `w_${width}` : '';
    const h = height ? `h_${height}` : '';
    const c = `c_${crop}`;
    transformations.push([w, h, c].filter(Boolean).join(','));
  }
  
  const transformationString = transformations.join(',');
  return this.cloudinary.secureUrl.replace('/upload/', `/upload/${transformationString}/`);
};

// アクセス権限チェック
MediaSchema.methods.canUserAccess = async function (userId?: string): Promise<boolean> {
  // 削除済みファイルはアクセス不可
  if (this.status === 'deleted') return false;
  
  // 処理中・失敗したファイルはアップロード者のみアクセス可能
  if (this.status !== 'ready') {
    return userId === this.uploadedBy;
  }
  
  // 公開ファイルは誰でもアクセス可能
  if (this.visibility === 'public') return true;
  
  // プライベートファイルはアップロード者のみアクセス可能
  if (this.visibility === 'private') {
    return userId === this.uploadedBy;
  }
  
  // アンリストファイルはURLを知っていれば誰でもアクセス可能
  if (this.visibility === 'unlisted') return true;
  
  return false;
};

// 編集権限チェック
MediaSchema.methods.canUserEdit = function (userId?: string): boolean {
  if (!userId) return false;
  return this.uploadedBy === userId;
};

// セキュリティスキャン（模擬実装）
MediaSchema.methods.scanForSecurity = async function (): Promise<void> {
  try {
    // 実際の実装では外部のセキュリティサービスと連携
    this.security.isScanned = true;
    this.security.scanDate = new Date();
    this.security.scanEngine = 'MockScanner v1.0';
    
    // 簡易的な安全性判定
    const threats: string[] = [];
    
    // ファイル名チェック
    if (this.filename.toLowerCase().includes('virus') || 
        this.filename.toLowerCase().includes('malware')) {
      threats.push('suspicious_filename');
    }
    
    // ファイルサイズチェック
    if (this.size > 50 * 1024 * 1024) { // 50MB以上
      threats.push('large_file_size');
    }
    
    this.security.threats = threats;
    this.security.isSafe = threats.length === 0;
    
    await this.save();
  } catch (error) {
    console.error('セキュリティスキャンに失敗しました:', error);
  }
};

// 論理削除メソッド
MediaSchema.methods.softDelete = async function (): Promise<void> {
  this.status = 'deleted';
  this.visibility = 'private';
  this.isPublic = false;
  
  // 30日後に自動削除
  this.autoDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  await this.save();
};

// 使用回数取得メソッド
MediaSchema.methods.getUsageCount = function (): number {
  return this.usedInPosts.length + this.usedInComments.length + this.usedInProfiles.length;
};

// パフォーマンス最適化インデックス
MediaSchema.index({ uploadedBy: 1, createdAt: -1 }); // ユーザーのメディア一覧
MediaSchema.index({ type: 1, status: 1 }); // タイプ・ステータス別
MediaSchema.index({ visibility: 1, isPublic: 1 }); // 公開設定別
MediaSchema.index({ 'cloudinary.publicId': 1 }, { unique: true }); // Cloudinary公開ID
MediaSchema.index({ status: 1, createdAt: -1 }); // ステータス・作成日別

// 複合インデックス
MediaSchema.index({ uploadedBy: 1, type: 1, status: 1 }); // ユーザー・タイプ・ステータス
MediaSchema.index({ tags: 1, visibility: 1 }); // タグ・公開設定
MediaSchema.index({ 'stats.views': -1 }); // 人気順
MediaSchema.index({ size: 1 }); // サイズ別

// テキスト検索用
MediaSchema.index({
  filename: 'text',
  title: 'text',
  description: 'text',
  alt: 'text',
  tags: 'text'
}, {
  weights: {
    title: 3,
    filename: 2,
    tags: 2,
    alt: 1,
    description: 1
  },
  name: 'media_text_search'
});

// 静的メソッド：ユーザーのメディア取得
MediaSchema.statics.getUserMedia = async function(userId: string, options: any = {}): Promise<IMedia[]> {
  const {
    type,
    status = 'ready',
    limit = 20,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;
  
  const query: any = {
    uploadedBy: userId,
    status
  };
  
  if (type) {
    query.type = type;
  }
  
  const sort: any = {};
  sort[sortBy] = sortOrder;
  
  return this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

// 静的メソッド：人気メディア取得
MediaSchema.statics.getPopularMedia = async function(options: any = {}): Promise<IMedia[]> {
  const {
    type,
    timeRange = 7, // 日数
    limit = 10
  } = options;
  
  const query: any = {
    status: 'ready',
    visibility: 'public',
    createdAt: { $gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000) }
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ 'stats.views': -1, 'stats.shares': -1 })
    .limit(limit);
};

// 静的メソッド：使用されていないメディアのクリーンアップ
MediaSchema.statics.cleanupUnusedMedia = async function(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // 30日以上前にアップロードされ、どこからも参照されていないメディアを論理削除
  const unusedMedia = await this.find({
    uploadedAt: { $lt: thirtyDaysAgo },
    status: 'ready',
    usedInPosts: { $size: 0 },
    usedInComments: { $size: 0 },
    usedInProfiles: { $size: 0 }
  });
  
  for (const media of unusedMedia) {
    await media.softDelete();
  }
};

// 静的メソッド：ストレージ使用量計算
MediaSchema.statics.calculateStorageUsage = async function(userId?: string): Promise<any> {
  const query: any = { status: { $ne: 'deleted' } };
  if (userId) {
    query.uploadedBy = userId;
  }
  
  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: userId ? '$uploadedBy' : null,
        totalSize: { $sum: '$size' },
        totalFiles: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            size: '$size',
            count: 1
          }
        }
      }
    },
    {
      $unwind: '$byType'
    },
    {
      $group: {
        _id: {
          userId: '$_id',
          type: '$byType.type'
        },
        totalSize: { $first: '$totalSize' },
        totalFiles: { $first: '$totalFiles' },
        typeSize: { $sum: '$byType.size' },
        typeCount: { $sum: '$byType.count' }
      }
    }
  ]);
  
  return result;
};

export default mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);