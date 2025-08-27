import mongoose from 'mongoose';

export type VisibilityLevel = 'public' | 'followers' | 'private';
export type PostVisibility = 'public' | 'followers' | 'private' | 'custom';
export type ProfileVisibility = 'public' | 'followers' | 'private';

export interface IPrivacySetting extends mongoose.Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  
  // アカウント全体設定
  account: {
    isPrivate: boolean; // 非公開アカウント
    requireFollowApproval: boolean; // フォロー承認制
    allowDiscovery: boolean; // 検索・推奨での表示許可
  };
  
  // プロフィール公開設定
  profile: {
    basicInfo: ProfileVisibility; // 基本情報（名前・アバター）
    bio: ProfileVisibility; // 自己紹介
    location: ProfileVisibility; // 位置情報
    website: ProfileVisibility; // ウェブサイト
    birthDate: ProfileVisibility; // 生年月日
    joinDate: ProfileVisibility; // 登録日
  };
  
  // フォロー情報公開設定
  followers: {
    followersList: ProfileVisibility; // フォロワー一覧
    followingList: ProfileVisibility; // フォロー中一覧
    followersCount: ProfileVisibility; // フォロワー数
    followingCount: ProfileVisibility; // フォロー数
  };
  
  // 投稿公開設定
  posts: {
    defaultVisibility: PostVisibility; // デフォルト投稿公開範囲
    allowComments: VisibilityLevel; // コメント許可範囲
    allowLikes: VisibilityLevel; // いいね許可範囲
    allowSharing: VisibilityLevel; // シェア許可範囲
    showInTimeline: boolean; // タイムライン表示許可
  };
  
  // 通知設定（より詳細）
  notifications: {
    follows: boolean;
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    directMessages: boolean;
    email: boolean;
    push: boolean;
    // 制限設定
    onlyFromFollowers: boolean; // フォロワーのみからの通知
    onlyFromVerified: boolean; // 認証済みユーザーのみからの通知
  };
  
  // 検索・発見設定
  discovery: {
    searchByEmail: boolean; // メールアドレスでの検索許可
    searchByPhone: boolean; // 電話番号での検索許可（将来用）
    appearInSuggestions: boolean; // おすすめユーザーに表示
    allowTagging: VisibilityLevel; // タグ付け許可範囲
  };
  
  // アクティビティ表示設定
  activity: {
    showLastSeen: ProfileVisibility; // 最終アクセス時刻表示
    showOnlineStatus: ProfileVisibility; // オンライン状態表示
    showReadReceipts: boolean; // 既読表示
  };
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
}

const PrivacySettingSchema = new mongoose.Schema<IPrivacySetting>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ユーザーIDは必須です'],
    unique: true,
    index: true,
  },
  
  // アカウント全体設定
  account: {
    isPrivate: { type: Boolean, default: false },
    requireFollowApproval: { type: Boolean, default: false },
    allowDiscovery: { type: Boolean, default: true },
  },
  
  // プロフィール公開設定
  profile: {
    basicInfo: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    bio: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    location: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    website: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    birthDate: { type: String, enum: ['public', 'followers', 'private'], default: 'followers' },
    joinDate: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
  },
  
  // フォロー情報公開設定
  followers: {
    followersList: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    followingList: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    followersCount: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    followingCount: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
  },
  
  // 投稿公開設定
  posts: {
    defaultVisibility: { type: String, enum: ['public', 'followers', 'private', 'custom'], default: 'public' },
    allowComments: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    allowLikes: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    allowSharing: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    showInTimeline: { type: Boolean, default: true },
  },
  
  // 通知設定
  notifications: {
    follows: { type: Boolean, default: true },
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    directMessages: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    onlyFromFollowers: { type: Boolean, default: false },
    onlyFromVerified: { type: Boolean, default: false },
  },
  
  // 検索・発見設定
  discovery: {
    searchByEmail: { type: Boolean, default: false },
    searchByPhone: { type: Boolean, default: false },
    appearInSuggestions: { type: Boolean, default: true },
    allowTagging: { type: String, enum: ['public', 'followers', 'private'], default: 'followers' },
  },
  
  // アクティビティ表示設定
  activity: {
    showLastSeen: { type: String, enum: ['public', 'followers', 'private'], default: 'followers' },
    showOnlineStatus: { type: String, enum: ['public', 'followers', 'private'], default: 'followers' },
    showReadReceipts: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
  collection: 'privacy_settings',
  versionKey: false,
});

// パフォーマンス最適化インデックス
PrivacySettingSchema.index({ userId: 1 }, { unique: true });
PrivacySettingSchema.index({ 'account.isPrivate': 1 });
PrivacySettingSchema.index({ 'account.allowDiscovery': 1 });

// デフォルト設定作成メソッド
PrivacySettingSchema.statics.createDefault = async function(userId: string): Promise<IPrivacySetting> {
  const defaultSettings = new this({
    userId,
    // デフォルト値はスキーマで定義済み
  });
  
  return await defaultSettings.save();
};

// ユーザーの表示権限チェックメソッド
PrivacySettingSchema.methods.canView = function(
  field: string, 
  viewerId?: string, 
  isFollower = false, 
  isOwner = false
): boolean {
  // 本人は全て表示可能
  if (isOwner) return true;
  
  // フィールドの可視性レベルを取得
  const visibility = this.getFieldVisibility(field);
  
  switch (visibility) {
    case 'public':
      return true;
    case 'followers':
      return isFollower;
    case 'private':
      return false;
    default:
      return false;
  }
};

// フィールドの可視性レベル取得メソッド
PrivacySettingSchema.methods.getFieldVisibility = function(field: string): string {
  const fieldParts = field.split('.');
  let current: any = this;
  
  for (const part of fieldParts) {
    current = current[part];
    if (!current) return 'private';
  }
  
  return String(current);
};

export default mongoose.models.PrivacySetting || mongoose.model<IPrivacySetting>('PrivacySetting', PrivacySettingSchema);