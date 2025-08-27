import mongoose from 'mongoose';

export type NotificationSenderRestriction = 'all' | 'followers' | 'verified' | 'mutual';
export type NotificationPriority = 'low' | 'normal' | 'high';
export type NotificationTimeSlot = {
  start: string; // HH:mm format
  end: string;   // HH:mm format
};

export interface INotificationSettings extends mongoose.Document {
  _id: string;
  userId: mongoose.Types.ObjectId; // 設定を持つユーザー
  
  // 送信者制限設定
  senderRestriction: NotificationSenderRestriction;
  
  // 内容フィルタ設定
  contentFilter: {
    enabled: boolean;
    keywords: string[]; // フィルタリングするキーワード
    isRegex: boolean;   // 正規表現を使用するか
    caseSensitive: boolean; // 大文字小文字を区別するか
  };
  
  // 時間帯制御設定
  timeControl: {
    enabled: boolean;
    allowedTimeSlots: NotificationTimeSlot[]; // 通知を受信する時間帯
    timezone: string; // タイムゾーン (例: 'Asia/Tokyo')
    silentMode: {
      enabled: boolean;
      start: string; // HH:mm format
      end: string;   // HH:mm format
    };
  };
  
  // 優先度設定
  prioritySettings: {
    [key: string]: NotificationPriority; // 通知タイプ別優先度設定
  };
  
  // 通知タイプ別ON/OFF設定
  notificationTypes: {
    like: boolean;           // いいね通知
    comment: boolean;        // コメント通知
    follow: boolean;         // フォロー通知
    mention: boolean;        // メンション通知
    reply: boolean;          // 返信通知
    directMessage: boolean;  // DM通知
    system: boolean;         // システム通知
    security: boolean;       // セキュリティ通知
  };
  
  // グローバル設定
  globalSettings: {
    enabled: boolean;        // 通知全体のON/OFF
    pushNotifications: boolean; // プッシュ通知
    emailNotifications: boolean; // メール通知
    soundEnabled: boolean;   // 通知音
    vibrationEnabled: boolean; // バイブレーション
  };
  
  // 統計情報
  stats: {
    totalFiltered: number;   // フィルタリングした通知数
    lastUpdated: Date;       // 最後の設定更新日時
  };
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSettingsSchema = new mongoose.Schema<INotificationSettings>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ユーザーIDは必須です'],
    unique: true,
    index: true,
  },
  
  // 送信者制限設定
  senderRestriction: {
    type: String,
    enum: ['all', 'followers', 'verified', 'mutual'],
    default: 'all',
  },
  
  // 内容フィルタ設定
  contentFilter: {
    enabled: { type: Boolean, default: false },
    keywords: [{ 
      type: String, 
      maxlength: [100, 'キーワードは100文字以内で入力してください'],
      trim: true,
    }],
    isRegex: { type: Boolean, default: false },
    caseSensitive: { type: Boolean, default: false },
  },
  
  // 時間帯制御設定
  timeControl: {
    enabled: { type: Boolean, default: false },
    allowedTimeSlots: [{
      start: { 
        type: String,
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, '時刻はHH:mm形式で入力してください'],
      },
      end: { 
        type: String,
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, '時刻はHH:mm形式で入力してください'],
      },
    }],
    timezone: { type: String, default: 'Asia/Tokyo' },
    silentMode: {
      enabled: { type: Boolean, default: false },
      start: { 
        type: String,
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, '時刻はHH:mm形式で入力してください'],
        default: '22:00',
      },
      end: { 
        type: String,
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, '時刻はHH:mm形式で入力してください'],
        default: '07:00',
      },
    },
  },
  
  // 優先度設定
  prioritySettings: {
    type: Map,
    of: {
      type: String,
      enum: ['low', 'normal', 'high'],
    },
    default: new Map([
      ['like', 'low'],
      ['comment', 'normal'],
      ['follow', 'normal'],
      ['mention', 'high'],
      ['reply', 'high'],
      ['directMessage', 'high'],
      ['system', 'high'],
      ['security', 'high'],
    ]),
  },
  
  // 通知タイプ別ON/OFF設定
  notificationTypes: {
    like: { type: Boolean, default: true },
    comment: { type: Boolean, default: true },
    follow: { type: Boolean, default: true },
    mention: { type: Boolean, default: true },
    reply: { type: Boolean, default: true },
    directMessage: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
    security: { type: Boolean, default: true },
  },
  
  // グローバル設定
  globalSettings: {
    enabled: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    soundEnabled: { type: Boolean, default: true },
    vibrationEnabled: { type: Boolean, default: true },
  },
  
  // 統計情報
  stats: {
    totalFiltered: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
}, {
  timestamps: true,
  collection: 'notification_settings',
  versionKey: false,
});

// パフォーマンス最適化インデックス
NotificationSettingsSchema.index({ userId: 1 }, { unique: true });
NotificationSettingsSchema.index({ 'globalSettings.enabled': 1 });
NotificationSettingsSchema.index({ senderRestriction: 1 });

// デフォルト設定作成メソッド
NotificationSettingsSchema.statics.createDefault = async function(userId: string) {
  const defaultSettings = new this({
    userId,
    senderRestriction: 'all',
    contentFilter: {
      enabled: false,
      keywords: [],
      isRegex: false,
      caseSensitive: false,
    },
    timeControl: {
      enabled: false,
      allowedTimeSlots: [
        { start: '09:00', end: '22:00' } // デフォルトは9時-22時
      ],
      timezone: 'Asia/Tokyo',
      silentMode: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    },
    prioritySettings: new Map([
      ['like', 'low'],
      ['comment', 'normal'],
      ['follow', 'normal'],
      ['mention', 'high'],
      ['reply', 'high'],
      ['directMessage', 'high'],
      ['system', 'high'],
      ['security', 'high'],
    ]),
    notificationTypes: {
      like: true,
      comment: true,
      follow: true,
      mention: true,
      reply: true,
      directMessage: true,
      system: true,
      security: true,
    },
    globalSettings: {
      enabled: true,
      pushNotifications: true,
      emailNotifications: false,
      soundEnabled: true,
      vibrationEnabled: true,
    },
  });
  
  return await defaultSettings.save();
};

// 通知フィルタチェックメソッド
NotificationSettingsSchema.statics.shouldFilterNotification = async function(
  userId: string,
  senderId: string,
  content: string,
  notificationType: string,
  priority: NotificationPriority = 'normal'
): Promise<boolean> {
  const settings = await this.findOne({ userId });
  if (!settings || !settings.globalSettings.enabled) {
    return true; // 通知無効の場合はフィルタ
  }
  
  // 通知タイプチェック
  if (!settings.notificationTypes[notificationType]) {
    return true; // この通知タイプが無効
  }
  
  // 送信者制限チェック
  if (await this.checkSenderRestriction(settings, userId, senderId)) {
    return true;
  }
  
  // 内容フィルタチェック
  if (await this.checkContentFilter(settings, content)) {
    return true;
  }
  
  // 時間帯制御チェック
  if (await this.checkTimeControl(settings)) {
    return true;
  }
  
  return false; // フィルタしない
};

// 送信者制限チェック
NotificationSettingsSchema.statics.checkSenderRestriction = async function(
  settings: any,
  userId: string,
  senderId: string
): Promise<boolean> {
  if (settings.senderRestriction === 'all') return false;
  
  const Follow = mongoose.model('Follow');
  const User = mongoose.model('User');
  
  switch (settings.senderRestriction) {
    case 'followers':
      // フォロワーのみ
      const isFollower = await Follow.findOne({ 
        userId: senderId, 
        targetUserId: userId,
        status: 'accepted'
      });
      return !isFollower;
      
    case 'verified':
      // 認証済みユーザーのみ
      const sender = await User.findById(senderId);
      return !sender?.emailVerified;
      
    case 'mutual':
      // 相互フォローのみ
      const [following, follower] = await Promise.all([
        Follow.findOne({ 
          userId: userId, 
          targetUserId: senderId,
          status: 'accepted'
        }),
        Follow.findOne({ 
          userId: senderId, 
          targetUserId: userId,
          status: 'accepted'
        })
      ]);
      return !(following && follower);
      
    default:
      return false;
  }
};

// 内容フィルタチェック
NotificationSettingsSchema.statics.checkContentFilter = async function(
  settings: any,
  content: string
): Promise<boolean> {
  if (!settings.contentFilter.enabled || !content) return false;
  
  const keywords = settings.contentFilter.keywords;
  if (!keywords.length) return false;
  
  const searchContent = settings.contentFilter.caseSensitive ? 
    content : content.toLowerCase();
  
  for (const keyword of keywords) {
    const searchKeyword = settings.contentFilter.caseSensitive ? 
      keyword : keyword.toLowerCase();
    
    if (settings.contentFilter.isRegex) {
      try {
        const flags = settings.contentFilter.caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(searchKeyword, flags);
        if (regex.test(searchContent)) return true;
      } catch {
        // 正規表現エラーの場合は通常の文字列マッチング
        if (searchContent.includes(searchKeyword)) return true;
      }
    } else {
      if (searchContent.includes(searchKeyword)) return true;
    }
  }
  
  return false;
};

// 時間帯制御チェック
NotificationSettingsSchema.statics.checkTimeControl = async function(
  settings: any
): Promise<boolean> {
  if (!settings.timeControl.enabled) return false;
  
  const now = new Date();
  const timezone = settings.timeControl.timezone;
  
  // タイムゾーン調整
  const currentTime = new Intl.DateTimeFormat('ja-JP', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);
  
  // サイレントモードチェック
  if (settings.timeControl.silentMode.enabled) {
    const silentStart = settings.timeControl.silentMode.start;
    const silentEnd = settings.timeControl.silentMode.end;
    
    if (isTimeInRange(currentTime, silentStart, silentEnd)) {
      return true; // サイレント時間内
    }
  }
  
  // 許可時間帯チェック
  const allowedSlots = settings.timeControl.allowedTimeSlots;
  if (allowedSlots.length > 0) {
    const isInAllowedSlot = allowedSlots.some((slot: any) =>
      isTimeInRange(currentTime, slot.start, slot.end)
    );
    return !isInAllowedSlot; // 許可時間外
  }
  
  return false;
};

// 時間範囲チェックヘルパー関数
function isTimeInRange(current: string, start: string, end: string): boolean {
  const [currentHour, currentMin] = current.split(':').map(Number);
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const currentMinutes = currentHour * 60 + currentMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  if (startMinutes <= endMinutes) {
    // 同日内の範囲
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // 日跨ぎの範囲
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

// 統計更新メソッド
NotificationSettingsSchema.methods.incrementFilterCount = async function() {
  this.stats.totalFiltered += 1;
  this.stats.lastUpdated = new Date();
  return await this.save();
};

export default mongoose.models.NotificationSettings || 
  mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);