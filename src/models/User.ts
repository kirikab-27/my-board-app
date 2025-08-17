import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// SNS用のタイプ定義
export type UserRole = 'user' | 'moderator' | 'admin';
export type NotificationPreference = 'all' | 'mentions' | 'none';
export type PrivacyLevel = 'public' | 'friends' | 'private';

export interface IUserPreferences {
  notifications: {
    follows: boolean;
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    email: boolean;
  };
  privacy: {
    profile: PrivacyLevel;
    posts: PrivacyLevel;
    followers: PrivacyLevel;
  };
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface IUserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
  commentsReceived: number;
}

export interface IUser extends mongoose.Document {
  _id: string;
  // 基本情報
  name: string;
  username: string; // 一意のユーザー名（@username）
  displayName?: string; // 表示名（空の場合はnameを使用）
  email: string;
  password: string;
  emailVerified: Date | null;
  
  // プロフィール画像・カバー
  avatar?: string; // Cloudinary URL
  cover?: string; // カバー画像 Cloudinary URL
  image?: string; // 既存互換性のため残す
  
  // プロフィール詳細
  bio?: string; // 自己紹介（最大160文字）
  location?: string; // 位置情報
  website?: string; // ウェブサイトURL
  birthDate?: Date; // 生年月日
  
  // システム設定
  role: UserRole;
  isVerified: boolean; // 認証済みアカウント
  isPrivate: boolean; // プライベートアカウント
  
  // 統計情報（キャッシュ用）
  stats: IUserStats;
  
  // ユーザー設定
  preferences: IUserPreferences;
  
  // アクティビティ
  lastSeen: Date;
  isOnline: boolean;
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  
  // メソッド
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateStats(): Promise<void>;
  toPublicProfile(): Partial<IUser>;
}

const UserSchema = new mongoose.Schema<IUser>({
  // 基本情報
  name: {
    type: String,
    required: [true, '名前は必須です'],
    trim: true,
    maxlength: [50, '名前は50文字以内で入力してください'],
  },
  username: {
    type: String,
    required: [true, 'ユーザー名は必須です'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'ユーザー名は3文字以上で入力してください'],
    maxlength: [30, 'ユーザー名は30文字以内で入力してください'],
    match: [/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます'],
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [50, '表示名は50文字以内で入力してください'],
  },
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      '有効なメールアドレスを入力してください',
    ],
  },
  password: {
    type: String,
    required: [true, 'パスワードは必須です'],
    minlength: [8, 'パスワードは8文字以上で入力してください'],
  },
  emailVerified: {
    type: Date,
    default: null,
  },
  
  // プロフィール画像・カバー
  avatar: {
    type: String,
    default: null,
    validate: {
      validator: function(v: string) {
        return !v || /^https:\/\/res\.cloudinary\.com\//.test(v);
      },
      message: '無効な画像URLです',
    },
  },
  cover: {
    type: String,
    default: null,
    validate: {
      validator: function(v: string) {
        return !v || /^https:\/\/res\.cloudinary\.com\//.test(v);
      },
      message: '無効なカバー画像URLです',
    },
  },
  image: {
    type: String,
    default: null, // 既存互換性のため残す
  },
  
  // プロフィール詳細
  bio: {
    type: String,
    maxlength: [160, '自己紹介は160文字以内で入力してください'],
    default: '',
    trim: true,
  },
  location: {
    type: String,
    maxlength: [100, '位置情報は100文字以内で入力してください'],
    trim: true,
  },
  website: {
    type: String,
    maxlength: [200, 'ウェブサイトURLは200文字以内で入力してください'],
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\//.test(v);
      },
      message: '有効なURLを入力してください（http://またはhttps://から始まる）',
    },
  },
  birthDate: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        return !v || v < new Date();
      },
      message: '生年月日は現在より前の日付を入力してください',
    },
  },
  
  // システム設定
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  
  // 統計情報（キャッシュ用）
  stats: {
    postsCount: { type: Number, default: 0, min: 0 },
    followersCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    likesReceived: { type: Number, default: 0, min: 0 },
    commentsReceived: { type: Number, default: 0, min: 0 },
  },
  
  // ユーザー設定
  preferences: {
    notifications: {
      follows: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
    privacy: {
      profile: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      posts: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      followers: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
    },
    language: { type: String, default: 'ja' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
  },
  
  // アクティビティ
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  // パフォーマンス最適化
  collection: 'users',
  versionKey: false,
});

// パスワードハッシュ化（保存前）
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ミドルウェア：ユーザー名の自動生成
UserSchema.pre('save', async function (next) {
  // ユーザー名が設定されていない場合、emailから生成
  if (!this.username && this.email) {
    const baseUsername = this.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // 一意のユーザー名になるまで番号を追加
    while (await mongoose.models.User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    this.username = username;
  }
  
  // lastSeenを現在時刻に更新
  this.lastSeen = new Date();
  
  next();
});

// パスワード比較メソッド
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 統計情報更新メソッド
UserSchema.methods.updateStats = async function (): Promise<void> {
  try {
    // 投稿数
    const Post = mongoose.models.Post;
    if (Post) {
      this.stats.postsCount = await Post.countDocuments({ userId: this._id });
    }
    
    // フォロワー・フォロー数
    const Follow = mongoose.models.Follow;
    if (Follow) {
      this.stats.followersCount = await Follow.countDocuments({ following: this._id });
      this.stats.followingCount = await Follow.countDocuments({ follower: this._id });
    }
    
    // いいね・コメント受信数
    if (Post) {
      const posts = await Post.find({ userId: this._id });
      this.stats.likesReceived = posts.reduce((total, post) => total + (post.likes || 0), 0);
    }
    
    const Comment = mongoose.models.Comment;
    if (Comment) {
      this.stats.commentsReceived = await Comment.countDocuments({ postUserId: this._id });
    }
    
    await this.save();
  } catch (error) {
    console.error('統計情報の更新に失敗しました:', error);
  }
};

// 公開プロフィール生成メソッド
UserSchema.methods.toPublicProfile = function (): Partial<IUser> {
  const publicFields = {
    _id: this._id,
    username: this.username,
    name: this.name,
    displayName: this.displayName,
    avatar: this.avatar,
    cover: this.cover,
    bio: this.bio,
    location: this.location,
    website: this.website,
    isVerified: this.isVerified,
    stats: this.stats,
    createdAt: this.createdAt,
    lastSeen: this.lastSeen,
    isOnline: this.isOnline,
  };

  // プライベートアカウントの場合、制限された情報のみ返す
  if (this.isPrivate) {
    return {
      _id: this._id,
      username: this.username,
      name: this.name,
      displayName: this.displayName,
      avatar: this.avatar,
      isVerified: this.isVerified,
      isPrivate: this.isPrivate,
    };
  }

  return publicFields;
};

// パフォーマンス最適化インデックス
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ 'stats.followersCount': -1 }); // 人気ユーザー検索用
UserSchema.index({ lastSeen: -1 }); // アクティブユーザー検索用
UserSchema.index({ isOnline: 1 }); // オンラインユーザー検索用
UserSchema.index({ createdAt: -1 }); // 新規ユーザー検索用
UserSchema.index({ name: 'text', username: 'text', bio: 'text' }); // テキスト検索用

// 複合インデックス
UserSchema.index({ isPrivate: 1, 'stats.followersCount': -1 }); // 公開・人気ユーザー
UserSchema.index({ role: 1, isVerified: 1 }); // ロール・認証状態

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);