import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  emailVerified: Date | null;
  image?: string;
  bio?: string; // 自己紹介（最大200文字）
  role: 'user' | 'moderator' | 'admin';
  createdAt: Date;
  updatedAt: Date;

  // メソッド
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    required: [false, 'ユーザー名は必須です'], // preミドルウェアで自動生成されるため
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
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
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
    email: {
      type: String,
      required: [true, 'メールアドレスは必須です'],
      unique: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        '有効なメールアドレスを入力してください',
      ],
    },
  },
  image: {
    type: String,
    default: null, // 既存互換性のため残す
  },
  
  // プロフィール詳細
  bio: {
    type: String,
    maxlength: [300, '自己紹介は300文字以内で入力してください'],
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
    emailVerified: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [200, '自己紹介は200文字以内で入力してください'],
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

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
    
    // 統計情報のみの部分更新（バリデーションを回避）
    await mongoose.model('User').updateOne(
      { _id: this._id },
      { $set: { stats: this.stats } },
      { runValidators: false }
    );
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
