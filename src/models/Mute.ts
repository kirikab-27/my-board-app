import mongoose from 'mongoose';

export type MuteType = 'user' | 'keyword' | 'hashtag' | 'domain';
export type MuteDuration = 'permanent' | 'temporary';

export interface IMute extends mongoose.Document {
  _id: string;
  userId: mongoose.Types.ObjectId; // ミュートを設定したユーザー
  
  // ミュート対象
  type: MuteType;
  targetUserId?: mongoose.Types.ObjectId; // ユーザーミュート時
  keyword?: string; // キーワードミュート時
  hashtag?: string; // ハッシュタグミュート時
  domain?: string; // ドメインミュート時（将来用）
  
  // ミュート設定
  duration: MuteDuration;
  expiresAt?: Date; // 期間限定ミュートの期限
  isRegex: boolean; // キーワードが正規表現かどうか
  caseSensitive: boolean; // 大文字小文字を区別するか
  
  // 適用範囲
  scope: {
    posts: boolean; // 投稿をミュート
    comments: boolean; // コメントをミュート
    notifications: boolean; // 通知をミュート
    timeline: boolean; // タイムラインでミュート
    search: boolean; // 検索結果でミュート
  };
  
  // メタデータ
  reason?: string; // ミュート理由
  isActive: boolean; // ミュートが有効かどうか
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
}

const MuteSchema = new mongoose.Schema<IMute>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ユーザーIDは必須です'],
    index: true,
  },
  
  // ミュート対象
  type: {
    type: String,
    enum: ['user', 'keyword', 'hashtag', 'domain'],
    required: [true, 'ミュートタイプは必須です'],
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.type === 'user'; },
  },
  keyword: {
    type: String,
    required: function() { return this.type === 'keyword'; },
    maxlength: [100, 'キーワードは100文字以内で入力してください'],
  },
  hashtag: {
    type: String,
    required: function() { return this.type === 'hashtag'; },
    maxlength: [50, 'ハッシュタグは50文字以内で入力してください'],
  },
  domain: {
    type: String,
    required: function() { return this.type === 'domain'; },
    maxlength: [100, 'ドメインは100文字以内で入力してください'],
  },
  
  // ミュート設定
  duration: {
    type: String,
    enum: ['permanent', 'temporary'],
    default: 'permanent',
  },
  expiresAt: {
    type: Date,
    required: function() { return this.duration === 'temporary'; },
    index: { expireAfterSeconds: 0 }, // MongoDB TTL
  },
  isRegex: {
    type: Boolean,
    default: false,
  },
  caseSensitive: {
    type: Boolean,
    default: false,
  },
  
  // 適用範囲
  scope: {
    posts: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    timeline: { type: Boolean, default: true },
    search: { type: Boolean, default: false },
  },
  
  // メタデータ
  reason: {
    type: String,
    maxlength: [500, 'ミュート理由は500文字以内で入力してください'],
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
  collection: 'mutes',
  versionKey: false,
});

// パフォーマンス最適化インデックス
MuteSchema.index({ userId: 1, type: 1 });
MuteSchema.index({ userId: 1, isActive: 1 });
MuteSchema.index({ userId: 1, targetUserId: 1 }, { 
  unique: true,
  sparse: true,
  partialFilterExpression: { type: 'user' }
});
MuteSchema.index({ userId: 1, keyword: 1 }, { 
  sparse: true,
  partialFilterExpression: { type: 'keyword' }
});
MuteSchema.index({ userId: 1, hashtag: 1 }, { 
  sparse: true,
  partialFilterExpression: { type: 'hashtag' }
});
MuteSchema.index({ expiresAt: 1 }, { sparse: true }); // TTL用

// 複合インデックス（フィルタリング用）
MuteSchema.index({ userId: 1, 'scope.posts': 1, isActive: 1 });
MuteSchema.index({ userId: 1, 'scope.timeline': 1, isActive: 1 });
MuteSchema.index({ userId: 1, 'scope.notifications': 1, isActive: 1 });

// ユーザーのミュートリスト取得メソッド
MuteSchema.statics.getUserMutes = async function(userId: string, type?: MuteType) {
  const filter: any = { userId, isActive: true };
  if (type) filter.type = type;
  
  return await this.find(filter)
    .populate('targetUserId', 'username name avatar')
    .sort({ createdAt: -1 });
};

// ミュートチェックメソッド
MuteSchema.statics.isMuted = async function(
  userId: string, 
  targetUserId?: string, 
  content?: string,
  hashtags?: string[]
): Promise<boolean> {
  const mutes = await this.find({
    userId,
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });

  for (const mute of mutes) {
    switch (mute.type) {
      case 'user':
        if (targetUserId && mute.targetUserId.toString() === targetUserId) {
          return true;
        }
        break;
        
      case 'keyword':
        if (content && this.matchesKeyword(content, mute)) {
          return true;
        }
        break;
        
      case 'hashtag':
        if (hashtags && hashtags.includes(mute.hashtag)) {
          return true;
        }
        break;
    }
  }
  
  return false;
};

// キーワードマッチングメソッド
MuteSchema.statics.matchesKeyword = function(content: string, mute: any): boolean {
  if (!content || !mute.keyword) return false;
  
  let searchContent = mute.caseSensitive ? content : content.toLowerCase();
  let keyword = mute.caseSensitive ? mute.keyword : mute.keyword.toLowerCase();
  
  if (mute.isRegex) {
    try {
      const flags = mute.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(keyword, flags);
      return regex.test(searchContent);
    } catch {
      // 正規表現エラーの場合は通常の文字列マッチング
      return searchContent.includes(keyword);
    }
  } else {
    return searchContent.includes(keyword);
  }
};

// 期限切れミュート自動削除メソッド
MuteSchema.statics.cleanupExpiredMutes = async function() {
  return await this.deleteMany({
    duration: 'temporary',
    expiresAt: { $lt: new Date() }
  });
};

// ミュート統計取得メソッド
MuteSchema.statics.getMuteStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        permanent: {
          $sum: { $cond: [{ $eq: ['$duration', 'permanent'] }, 1, 0] }
        },
        temporary: {
          $sum: { $cond: [{ $eq: ['$duration', 'temporary'] }, 1, 0] }
        }
      }
    }
  ]);

  const result: any = {
    total: 0,
    user: 0,
    keyword: 0,
    hashtag: 0,
    domain: 0,
    permanent: 0,
    temporary: 0,
  };

  stats.forEach((stat: any) => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    result.permanent += stat.permanent;
    result.temporary += stat.temporary;
  });

  return result;
};

export default mongoose.models.Mute || mongoose.model<IMute>('Mute', MuteSchema);