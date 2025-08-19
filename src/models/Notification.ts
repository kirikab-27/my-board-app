import mongoose, { Document, Schema } from 'mongoose';

// 通知タイプの定義
export type NotificationType = 
  | 'follow'        // フォロー通知
  | 'follow_accept' // フォロー承認通知
  | 'like_post'     // 投稿いいね通知
  | 'like_comment'  // コメントいいね通知
  | 'comment'       // コメント通知
  | 'reply'         // 返信通知
  | 'mention_post'  // 投稿メンション通知
  | 'mention_comment' // コメントメンション通知
  | 'repost'        // リポスト通知
  | 'quote'         // 引用通知
  | 'system'        // システム通知
  | 'announcement'  // お知らせ
  | 'security'      // セキュリティ通知
  | 'milestone';    // マイルストーン通知（フォロワー数達成等）

// 通知の優先度
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// 通知の配信方法
export interface INotificationDelivery {
  app: boolean;        // アプリ内通知
  email: boolean;      // メール通知
  push: boolean;       // プッシュ通知
  sms: boolean;        // SMS通知（将来用）
}

// 通知のメタデータ
export interface INotificationMetadata {
  postId?: string;       // 関連投稿ID
  commentId?: string;    // 関連コメントID
  followId?: string;     // 関連フォローID
  imageUrl?: string;     // 通知に表示する画像
  linkUrl?: string;      // 通知クリック時のリンク
  customData?: unknown;  // カスタムデータ
}

// バッチ通知用の情報
export interface INotificationBatch {
  batchId: string;       // バッチID
  count: number;         // 同種通知の数
  sampleUsers: string[]; // 代表的なユーザーID（最大3人）
  lastActivity: Date;    // 最後の活動日時
}

export interface INotificationMethods {
  markAsRead(): Promise<void>;
  markAsViewed(): Promise<void>;
  markAsClicked(): Promise<void>;
  hide(): Promise<void>;
  softDelete(): Promise<void>;
  canUserView(userId: string): boolean;
  generateMessage(): string;
  shouldBatch(): boolean;
}

export interface INotificationStatics {
  getUnreadCount(userId: string): Promise<number>;
  createNotification(data: Partial<INotification>): Promise<INotification>;
  cleanupOldNotifications(): Promise<void>;
}

export interface INotification extends Document, INotificationMethods {
  // 基本情報
  type: NotificationType;
  title: string;         // 通知タイトル
  message: string;       // 通知メッセージ
  priority: NotificationPriority;
  
  // ユーザー情報
  userId: string;        // 通知を受け取るユーザーID
  fromUserId?: string;   // 通知を送信したユーザーID（システム通知以外）
  fromUserName?: string; // 送信者名（表示用）
  fromUserAvatar?: string; // 送信者アバター
  
  // 関連データ
  metadata: INotificationMetadata;
  
  // バッチ通知
  isBatched: boolean;           // バッチ通知かどうか
  batchInfo?: INotificationBatch; // バッチ情報
  
  // 状態管理
  isRead: boolean;       // 既読状態
  isViewed: boolean;     // 表示済み状態（通知一覧で見た）
  isClicked: boolean;    // クリック済み状態
  isHidden: boolean;     // 非表示状態
  isDeleted: boolean;    // 論理削除
  
  // 配信設定
  delivery: INotificationDelivery;
  deliveredAt?: Date;    // 配信日時
  emailSentAt?: Date;    // メール送信日時
  pushSentAt?: Date;     // プッシュ送信日時
  
  // 有効期限
  expiresAt?: Date;      // 通知の有効期限
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;         // 既読日時
  clickedAt?: Date;      // クリック日時
}

const NotificationSchema: Schema = new Schema({
  // 基本情報
  type: {
    type: String,
    enum: [
      'follow', 'follow_accept', 'like_post', 'like_comment', 
      'comment', 'reply', 'mention_post', 'mention_comment',
      'repost', 'quote', 'system', 'announcement', 'security', 'milestone'
    ],
    required: [true, '通知タイプは必須です']
  },
  title: {
    type: String,
    required: [true, '通知タイトルは必須です'],
    maxlength: [100, '通知タイトルは100文字以内で入力してください'],
    trim: true
  },
  message: {
    type: String,
    required: [true, '通知メッセージは必須です'],
    maxlength: [500, '通知メッセージは500文字以内で入力してください'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    required: [true, '通知優先度は必須です']
  },
  
  // ユーザー情報
  userId: {
    type: String,
    required: [true, 'ユーザーIDは必須です'],
    validate: {
      validator: function(v: string) {
        return /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効なユーザーIDです'
    }
  },
  fromUserId: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効な送信者IDです'
    }
  },
  fromUserName: {
    type: String,
    maxlength: [100, '送信者名は100文字以内で入力してください'],
    trim: true
  },
  fromUserAvatar: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https:\/\/res\.cloudinary\.com\//.test(v);
      },
      message: '無効なアバターURLです'
    }
  },
  
  // 関連データ
  metadata: {
    postId: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^[0-9a-fA-F]{24}$/.test(v);
        },
        message: '無効な投稿IDです'
      }
    },
    commentId: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^[0-9a-fA-F]{24}$/.test(v);
        },
        message: '無効なコメントIDです'
      }
    },
    followId: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^[0-9a-fA-F]{24}$/.test(v);
        },
        message: '無効なフォローIDです'
      }
    },
    imageUrl: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https:\/\//.test(v);
        },
        message: '無効な画像URLです'
      }
    },
    linkUrl: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\//.test(v);
        },
        message: '無効なリンクURLです'
      }
    },
    customData: {
      type: Schema.Types.Mixed
    }
  },
  
  // バッチ通知
  isBatched: {
    type: Boolean,
    default: false
  },
  batchInfo: {
    batchId: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message: '無効なバッチIDです'
      }
    },
    count: {
      type: Number,
      min: [1, 'バッチ数は1以上である必要があります'],
      max: [1000, 'バッチ数は1000以下である必要があります']
    },
    sampleUsers: [{
      type: String,
      validate: {
        validator: function(v: string) {
          return /^[0-9a-fA-F]{24}$/.test(v);
        },
        message: '無効なユーザーIDです'
      }
    }],
    lastActivity: {
      type: Date
    }
  },
  
  // 状態管理
  isRead: {
    type: Boolean,
    default: false
  },
  isViewed: {
    type: Boolean,
    default: false
  },
  isClicked: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // 配信設定
  delivery: {
    app: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  deliveredAt: {
    type: Date
  },
  emailSentAt: {
    type: Date
  },
  pushSentAt: {
    type: Date
  },
  
  // 有効期限
  expiresAt: {
    type: Date,
    default: function() {
      // デフォルトで30日後に期限切れ
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  
  // 既読・クリック日時
  readAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'notifications',
  versionKey: false
});

// TTLインデックス：期限切れ通知の自動削除
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ミドルウェア：保存前処理
NotificationSchema.pre('save', async function (next) {
  try {
    // メッセージの自動生成
    if (!this.message || this.isModified('type') || this.isModified('fromUserName')) {
      this.message = (this as INotificationDocument).generateMessage();
    }
    
    // 配信日時の設定
    if (this.isNew) {
      this.deliveredAt = new Date();
    }
    
    // 既読時間の設定
    if (this.isModified('isRead') && this.isRead && !this.readAt) {
      this.readAt = new Date();
    }
    
    // クリック時間の設定
    if (this.isModified('isClicked') && this.isClicked && !this.clickedAt) {
      this.clickedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 既読マークメソッド
NotificationSchema.methods.markAsRead = async function (): Promise<void> {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

// 表示済みマークメソッド
NotificationSchema.methods.markAsViewed = async function (): Promise<void> {
  this.isViewed = true;
  await this.save();
};

// クリック済みマークメソッド
NotificationSchema.methods.markAsClicked = async function (): Promise<void> {
  this.isClicked = true;
  this.clickedAt = new Date();
  
  // クリックしたら自動的に既読にする
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  
  await this.save();
};

// 非表示メソッド
NotificationSchema.methods.hide = async function (): Promise<void> {
  this.isHidden = true;
  await this.save();
};

// 論理削除メソッド
NotificationSchema.methods.softDelete = async function (): Promise<void> {
  this.isDeleted = true;
  await this.save();
};

// ユーザーが通知を閲覧できるかチェック
NotificationSchema.methods.canUserView = function (userId: string): boolean {
  return this.userId === userId && !this.isDeleted && !this.isHidden;
};

// メッセージ自動生成メソッド
NotificationSchema.methods.generateMessage = function (): string {
  const fromName = this.fromUserName || 'ユーザー';
  
  switch (this.type) {
    case 'follow':
      return `${fromName}さんがあなたをフォローしました`;
    case 'follow_accept':
      return `${fromName}さんがフォローリクエストを承認しました`;
    case 'like_post':
      return `${fromName}さんがあなたの投稿にいいねしました`;
    case 'like_comment':
      return `${fromName}さんがあなたのコメントにいいねしました`;
    case 'comment':
      return `${fromName}さんがあなたの投稿にコメントしました`;
    case 'reply':
      return `${fromName}さんがあなたのコメントに返信しました`;
    case 'mention_post':
      return `${fromName}さんが投稿であなたをメンションしました`;
    case 'mention_comment':
      return `${fromName}さんがコメントであなたをメンションしました`;
    case 'repost':
      return `${fromName}さんがあなたの投稿をリポストしました`;
    case 'quote':
      return `${fromName}さんがあなたの投稿を引用しました`;
    case 'system':
      return 'システムからのお知らせがあります';
    case 'announcement':
      return '新しいお知らせがあります';
    case 'security':
      return 'セキュリティに関する重要な通知があります';
    case 'milestone':
      return 'おめでとうございます！マイルストーンを達成しました';
    default:
      return '新しい通知があります';
  }
};

// バッチ通知の対象かチェック
NotificationSchema.methods.shouldBatch = function (): boolean {
  const batchableTypes = ['like_post', 'like_comment', 'follow'];
  return batchableTypes.includes(this.type);
};

// パフォーマンス最適化インデックス
NotificationSchema.index({ userId: 1, createdAt: -1 }); // ユーザーの通知一覧
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 }); // 未読通知
NotificationSchema.index({ fromUserId: 1, createdAt: -1 }); // 送信者別
NotificationSchema.index({ type: 1, createdAt: -1 }); // タイプ別
NotificationSchema.index({ priority: 1, createdAt: -1 }); // 優先度別

// 複合インデックス
NotificationSchema.index({ userId: 1, isDeleted: 1, isHidden: 1, createdAt: -1 }); // 表示可能通知
NotificationSchema.index({ userId: 1, type: 1, isRead: 1 }); // ユーザー・タイプ・既読状態
NotificationSchema.index({ isBatched: 1, 'batchInfo.batchId': 1 }); // バッチ通知
NotificationSchema.index({ 'metadata.postId': 1 }); // 投稿関連通知
NotificationSchema.index({ 'metadata.commentId': 1 }); // コメント関連通知

// テキスト検索用
NotificationSchema.index({ 
  title: 'text', 
  message: 'text' 
}, {
  weights: {
    title: 2,
    message: 1
  },
  name: 'notification_text_search'
});

// 静的メソッド：未読通知数取得
NotificationSchema.statics.getUnreadCount = async function(userId: string): Promise<number> {
  return this.countDocuments({
    userId,
    isRead: false,
    isDeleted: false,
    isHidden: false
  });
};

// 静的メソッド：通知作成（バッチ処理対応）
NotificationSchema.statics.createNotification = async function(data: Partial<INotification>): Promise<INotification> {
  // メッセージの自動生成（バリデーションエラー回避）
  if (!data.message && data.type && data.fromUserName) {
    const fromName = data.fromUserName || 'ユーザー';
    
    switch (data.type) {
      case 'follow':
        data.message = `${fromName}さんがあなたをフォローしました`;
        break;
      case 'follow_accept':
        data.message = `${fromName}さんがフォローリクエストを承認しました`;
        break;
      case 'like_post':
        data.message = `${fromName}さんがあなたの投稿にいいねしました`;
        break;
      case 'like_comment':
        data.message = `${fromName}さんがあなたのコメントにいいねしました`;
        break;
      case 'comment':
        data.message = `${fromName}さんがあなたの投稿にコメントしました`;
        break;
      case 'reply':
        data.message = `${fromName}さんがあなたのコメントに返信しました`;
        break;
      case 'mention_post':
        data.message = `${fromName}さんが投稿であなたをメンションしました`;
        break;
      case 'mention_comment':
        data.message = `${fromName}さんがコメントであなたをメンションしました`;
        break;
      case 'repost':
        data.message = `${fromName}さんがあなたの投稿をリポストしました`;
        break;
      case 'quote':
        data.message = `${fromName}さんがあなたの投稿を引用しました`;
        break;
      case 'system':
        data.message = 'システムからのお知らせがあります';
        break;
      case 'announcement':
        data.message = '新しいお知らせがあります';
        break;
      case 'security':
        data.message = 'セキュリティに関する重要な通知があります';
        break;
      case 'milestone':
        data.message = 'おめでとうございます！マイルストーンを達成しました';
        break;
      default:
        data.message = '新しい通知があります';
    }
  }

  // バッチ通知の対象かチェック
  if (data.type && ['like_post', 'like_comment', 'follow'].includes(data.type)) {
    const batchId = `${data.type}_${data.userId}_${data.metadata?.postId || data.metadata?.commentId || 'general'}`;
    
    // 既存のバッチ通知があるかチェック（24時間以内）
    const existingBatch = await this.findOne({
      userId: data.userId,
      'batchInfo.batchId': batchId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (existingBatch) {
      // 既存バッチを更新
      existingBatch.batchInfo.count += 1;
      existingBatch.batchInfo.lastActivity = new Date();
      
      if (!existingBatch.batchInfo.sampleUsers.includes(data.fromUserId) && 
          existingBatch.batchInfo.sampleUsers.length < 3) {
        existingBatch.batchInfo.sampleUsers.push(data.fromUserId);
      }
      
      existingBatch.isRead = false; // 新しい活動があったので未読に戻す
      return existingBatch.save();
    } else {
      // 新しいバッチ通知を作成
      data.isBatched = true;
      data.batchInfo = {
        batchId,
        count: 1,
        sampleUsers: data.fromUserId ? [data.fromUserId] : [],
        lastActivity: new Date()
      };
    }
  }
  
  return this.create(data);
};

// 静的メソッド：古い通知の削除
NotificationSchema.statics.cleanupOldNotifications = async function(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // 30日以上前の既読通知を削除
  await this.deleteMany({
    createdAt: { $lt: thirtyDaysAgo },
    isRead: true
  });
  
  // 90日以上前の未読通知も削除
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await this.deleteMany({
    createdAt: { $lt: ninetyDaysAgo }
  });
};

export default (mongoose.models.Notification as mongoose.Model<INotification, object, INotificationMethods, object, unknown, INotificationStatics>) || 
  mongoose.model<INotification, mongoose.Model<INotification, object, INotificationMethods, object, unknown, INotificationStatics>>('Notification', NotificationSchema);