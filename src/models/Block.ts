import mongoose from 'mongoose';

export interface IBlock extends mongoose.Document {
  _id: string;
  // ブロック関係
  blocker: mongoose.Types.ObjectId; // ブロックしたユーザー
  blocked: mongoose.Types.ObjectId; // ブロックされたユーザー
  
  // ブロック理由・メタデータ
  reason?: string; // ブロック理由（オプション）
  type: 'user' | 'mutual'; // ブロックタイプ
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
}

const BlockSchema = new mongoose.Schema<IBlock>({
  blocker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ブロックしたユーザーは必須です'],
    index: true,
  },
  blocked: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ブロックされたユーザーは必須です'],
    index: true,
  },
  reason: {
    type: String,
    maxlength: [500, 'ブロック理由は500文字以内で入力してください'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['user', 'mutual'],
    default: 'user',
  },
}, {
  timestamps: true,
  collection: 'blocks',
  versionKey: false,
});

// パフォーマンス最適化インデックス
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true }); // 重複ブロック防止
BlockSchema.index({ blocker: 1, createdAt: -1 }); // ブロックリスト取得用
BlockSchema.index({ blocked: 1, createdAt: -1 }); // 被ブロック確認用

// 複合インデックス
BlockSchema.index({ blocker: 1, blocked: 1, type: 1 }); // ブロック関係確認用

// ブロック関係確認メソッド
BlockSchema.statics.isBlocked = async function(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await this.findOne({
    blocker: blockerId,
    blocked: blockedId,
  });
  return !!block;
};

// 相互ブロック確認メソッド
BlockSchema.statics.isMutuallyBlocked = async function(userId1: string, userId2: string): Promise<boolean> {
  const blocks = await this.find({
    $or: [
      { blocker: userId1, blocked: userId2 },
      { blocker: userId2, blocked: userId1 },
    ],
  });
  return blocks.length > 0;
};

// ブロックリスト取得メソッド
BlockSchema.statics.getBlockedUsers = async function(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const blocks = await this.find({ blocker: userId })
    .populate('blocked', 'username name avatar isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const totalCount = await this.countDocuments({ blocker: userId });
  
  return {
    blocks: blocks.map((block: any) => ({
      ...block.toObject(),
      blockedUser: block.blocked,
    })),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    },
  };
};

export default mongoose.models.Block || mongoose.model<IBlock>('Block', BlockSchema);