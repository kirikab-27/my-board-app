import mongoose, { Document, Schema } from 'mongoose';

// フォロー関係のタイプ定義
export type FollowStatus = 'pending' | 'accepted' | 'blocked' | 'muted';
export type FollowNotificationLevel = 'all' | 'mentions' | 'none';

export interface IFollow extends Document {
  // 基本関係
  follower: string; // フォローする人のユーザーID
  following: string; // フォローされる人のユーザーID
  
  // ステータス管理
  status: FollowStatus; // フォロー状態
  isAccepted: boolean; // 承認済みフラグ（プライベートアカウント用）
  isPending: boolean; // 承認待ちフラグ
  
  // ミュート・ブロック機能
  isMuted: boolean; // ミュート状態
  isBlocked: boolean; // ブロック状態
  
  // 通知設定
  notificationLevel: FollowNotificationLevel; // 通知レベル
  
  // メタデータ
  followedAt: Date; // フォロー開始日時
  acceptedAt?: Date; // 承認日時
  mutedAt?: Date; // ミュート日時
  blockedAt?: Date; // ブロック日時
  
  // 統計情報
  interactionCount: number; // やり取り回数
  lastInteractionAt?: Date; // 最後のやり取り日時
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  
  // メソッド
  accept(): Promise<void>;
  reject(): Promise<void>;
  mute(): Promise<void>;
  unmute(): Promise<void>;
  block(): Promise<void>;
  unblock(): Promise<void>;
  updateInteraction(): Promise<void>;
}

const FollowSchema: Schema = new Schema({
  // 基本関係
  follower: {
    type: String,
    required: [true, 'フォロワーIDは必須です'],
    validate: {
      validator: function(v: string) {
        return /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効なフォロワーIDです'
    }
  },
  following: {
    type: String,
    required: [true, 'フォロー先IDは必須です'],
    validate: {
      validator: function(v: string) {
        return /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効なフォロー先IDです'
    }
  },
  
  // ステータス管理
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked', 'muted'],
    default: 'accepted',
    required: [true, 'ステータスは必須です']
  },
  isAccepted: {
    type: Boolean,
    default: true
  },
  isPending: {
    type: Boolean,
    default: false
  },
  
  // ミュート・ブロック機能
  isMuted: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // 通知設定
  notificationLevel: {
    type: String,
    enum: ['all', 'mentions', 'none'],
    default: 'all',
    required: [true, '通知レベルは必須です']
  },
  
  // メタデータ
  followedAt: {
    type: Date,
    default: Date.now,
    required: [true, 'フォロー日時は必須です']
  },
  acceptedAt: {
    type: Date
  },
  mutedAt: {
    type: Date
  },
  blockedAt: {
    type: Date
  },
  
  // 統計情報
  interactionCount: {
    type: Number,
    default: 0,
    min: [0, 'やり取り回数は0以上である必要があります']
  },
  lastInteractionAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'follows',
  versionKey: false
});

// バリデーション：自分自身をフォローできない
FollowSchema.pre('save', function (next) {
  if (this.follower === this.following) {
    return next(new Error('自分自身をフォローすることはできません'));
  }
  next();
});

// ミドルウェア：状態変更時の処理
FollowSchema.pre('save', async function (next) {
  try {
    // プライベートアカウントの場合、承認待ち状態にする
    if (this.isNew) {
      const User = mongoose.models.User;
      if (User) {
        const followingUser = await User.findById(this.following);
        if (followingUser && followingUser.isPrivate) {
          this.status = 'pending';
          this.isAccepted = false;
          this.isPending = true;
        }
      }
    }
    
    // ステータスに基づいてフラグを設定
    this.isAccepted = this.status === 'accepted';
    this.isPending = this.status === 'pending';
    this.isMuted = this.status === 'muted';
    this.isBlocked = this.status === 'blocked';
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// フォロー承認メソッド
FollowSchema.methods.accept = async function (): Promise<void> {
  this.status = 'accepted';
  this.isAccepted = true;
  this.isPending = false;
  this.acceptedAt = new Date();
  
  await this.save();
  
  // ユーザー統計を更新
  await this.updateUserStats();
};

// フォロー拒否メソッド
FollowSchema.methods.reject = async function (): Promise<void> {
  await this.deleteOne();
};

// ミュートメソッド
FollowSchema.methods.mute = async function (): Promise<void> {
  this.status = 'muted';
  this.isMuted = true;
  this.mutedAt = new Date();
  await this.save();
};

// ミュート解除メソッド
FollowSchema.methods.unmute = async function (): Promise<void> {
  this.status = 'accepted';
  this.isMuted = false;
  this.mutedAt = undefined;
  await this.save();
};

// ブロックメソッド
FollowSchema.methods.block = async function (): Promise<void> {
  this.status = 'blocked';
  this.isBlocked = true;
  this.blockedAt = new Date();
  await this.save();
  
  // 相互フォローも削除
  await mongoose.models.Follow.deleteOne({
    follower: this.following,
    following: this.follower
  });
};

// ブロック解除メソッド
FollowSchema.methods.unblock = async function (): Promise<void> {
  await this.deleteOne();
};

// やり取り更新メソッド
FollowSchema.methods.updateInteraction = async function (): Promise<void> {
  this.interactionCount += 1;
  this.lastInteractionAt = new Date();
  await this.save();
};

// ユーザー統計更新メソッド
FollowSchema.methods.updateUserStats = async function (): Promise<void> {
  try {
    const User = mongoose.models.User;
    if (User) {
      // フォロワー側の統計更新
      const followerUser = await User.findById(this.follower);
      if (followerUser) {
        await followerUser.updateStats();
      }
      
      // フォロー先側の統計更新
      const followingUser = await User.findById(this.following);
      if (followingUser) {
        await followingUser.updateStats();
      }
    }
  } catch (error) {
    console.error('ユーザー統計の更新に失敗しました:', error);
  }
};

// パフォーマンス最適化インデックス
FollowSchema.index({ follower: 1, following: 1 }, { unique: true }); // 重複防止
FollowSchema.index({ follower: 1, createdAt: -1 }); // フォロー中リスト
FollowSchema.index({ following: 1, createdAt: -1 }); // フォロワーリスト
FollowSchema.index({ status: 1 }); // ステータス別検索
FollowSchema.index({ isPending: 1, following: 1 }); // 承認待ちリスト

// 複合インデックス
FollowSchema.index({ follower: 1, status: 1 }); // フォロワーのアクティブ関係
FollowSchema.index({ following: 1, status: 1 }); // フォロー先のアクティブ関係
FollowSchema.index({ isAccepted: 1, createdAt: -1 }); // 承認済み関係
FollowSchema.index({ lastInteractionAt: -1 }); // 最近のやり取り順

// 統計クエリ用
FollowSchema.index({ follower: 1, isAccepted: 1 }); // フォロー数計算
FollowSchema.index({ following: 1, isAccepted: 1 }); // フォロワー数計算

// 静的メソッド：相互フォロー判定
FollowSchema.statics.areMutualFollowers = async function(userId1: string, userId2: string): Promise<boolean> {
  const [follow1, follow2] = await Promise.all([
    this.findOne({ follower: userId1, following: userId2, isAccepted: true }),
    this.findOne({ follower: userId2, following: userId1, isAccepted: true })
  ]);
  
  return !!(follow1 && follow2);
};

// 静的メソッド：フォロー関係取得
FollowSchema.statics.getFollowRelation = async function(followerId: string, followingId: string): Promise<IFollow | null> {
  return this.findOne({ follower: followerId, following: followingId });
};

// 静的メソッド：フォロワー数取得
FollowSchema.statics.getFollowerCount = async function(userId: string): Promise<number> {
  return this.countDocuments({ following: userId, isAccepted: true });
};

// 静的メソッド：フォロー中数取得
FollowSchema.statics.getFollowingCount = async function(userId: string): Promise<number> {
  return this.countDocuments({ follower: userId, isAccepted: true });
};

// 静的メソッド：相互フォロー数取得
FollowSchema.statics.getMutualFollowCount = async function(userId: string): Promise<number> {
  // ユーザーがフォローしている人の一覧を取得
  const followingList = await this.find({ 
    follower: userId, 
    isAccepted: true 
  }).select('following');
  
  const followingIds = followingList.map(f => f.following);
  
  if (followingIds.length === 0) {
    return 0;
  }
  
  // その中で自分をフォローバックしている人の数を計算
  const mutualCount = await this.countDocuments({
    follower: { $in: followingIds },
    following: userId,
    isAccepted: true
  });
  
  return mutualCount;
};

export default mongoose.models.Follow || mongoose.model<IFollow>('Follow', FollowSchema);