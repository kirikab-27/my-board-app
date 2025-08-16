import mongoose, { Document, Schema } from 'mongoose';

// コメント関連のタイプ定義
export type CommentType = 'comment' | 'reply';

export interface ICommentMention {
  userId: string;
  username: string;
  startIndex: number;
  endIndex: number;
}

export interface ICommentMedia {
  type: 'image' | 'video' | 'gif';
  url: string; // Cloudinary URL
  thumbnailUrl?: string; // サムネイル（動画用）
  alt?: string; // 代替テキスト
  width?: number;
  height?: number;
  size?: number; // ファイルサイズ（bytes）
}

export interface ICommentStats {
  likes: number;
  replies: number;
  reports: number;
}

export interface IComment extends Document {
  // 基本情報
  content: string; // コメント内容
  type: CommentType; // コメントタイプ
  
  // 関連性
  postId: string; // 投稿ID
  parentId?: string; // 親コメントID（返信の場合）
  threadId?: string; // スレッドID（最上位コメントのID）
  depth: number; // コメントの深さ（0: 最上位, 1: 返信, 2: 返信の返信...）
  
  // 作成者情報
  userId: string; // コメント作成者のユーザーID
  authorName: string; // 作成者名（表示用）
  
  // SNS機能
  hashtags: string[]; // ハッシュタグ（#なし）
  mentions: ICommentMention[]; // メンション機能
  media: ICommentMedia[]; // 添付メディア
  
  // いいね機能
  likes: number; // いいね数（統計用）
  likedBy: string[]; // いいねしたユーザーID一覧
  
  // 統計情報
  stats: ICommentStats;
  
  // モデレーション
  isEdited: boolean; // 編集済みフラグ
  editedAt?: Date; // 編集日時
  isDeleted: boolean; // 論理削除
  deletedAt?: Date; // 削除日時
  reportCount: number; // 報告回数
  isHidden: boolean; // 非表示フラグ（モデレーション用）
  hiddenReason?: string; // 非表示理由
  
  // メタデータ
  language?: string; // コメント言語
  isPinned: boolean; // ピン留め（投稿者が特定コメントを上位表示）
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  
  // メソッド
  extractHashtags(): string[];
  extractMentions(): ICommentMention[];
  updateStats(): Promise<void>;
  canUserView(userId?: string): Promise<boolean>;
  canUserEdit(userId?: string): boolean;
  canUserDelete(userId?: string): Promise<boolean>;
  getReplies(): Promise<IComment[]>;
  getThread(): Promise<IComment[]>;
}

const CommentSchema: Schema = new Schema({
  // 基本情報
  content: {
    type: String,
    required: [true, 'コメント内容は必須です'],
    maxlength: [500, 'コメントは500文字以内で入力してください'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return v.length > 0;
      },
      message: 'コメント内容を入力してください'
    }
  },
  type: {
    type: String,
    enum: ['comment', 'reply'],
    default: 'comment',
    required: [true, 'コメントタイプは必須です']
  },
  
  // 関連性
  postId: {
    type: String,
    required: [true, '投稿IDは必須です'],
    validate: {
      validator: function(v: string) {
        return /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効な投稿IDです'
    }
  },
  parentId: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効な親コメントIDです'
    }
  },
  threadId: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効なスレッドIDです'
    }
  },
  depth: {
    type: Number,
    default: 0,
    min: [0, 'コメントの深さは0以上である必要があります'],
    max: [10, 'コメントの深さは10以下である必要があります'] // 深すぎるネストを防ぐ
  },
  
  // 作成者情報
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
  authorName: {
    type: String,
    required: [true, '作成者名は必須です'],
    maxlength: [100, '作成者名は100文字以内で入力してください'],
    trim: true
  },
  
  // SNS機能
  hashtags: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr: string[]) {
        return arr.length <= 5 && arr.every(tag => 
          typeof tag === 'string' && 
          tag.length <= 50 && 
          /^[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(tag)
        );
      },
      message: 'ハッシュタグは5個以下、各50文字以内で、英数字・ひらがな・カタカナ・漢字・アンダースコアのみ使用可能です'
    }
  },
  mentions: [{
    userId: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^[0-9a-fA-F]{24}$/.test(v);
        },
        message: '無効なユーザーIDです'
      }
    },
    username: {
      type: String,
      required: true,
      maxlength: [30, 'ユーザー名は30文字以内である必要があります']
    },
    startIndex: {
      type: Number,
      required: true,
      min: 0
    },
    endIndex: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif'],
      required: true
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^https:\/\/res\.cloudinary\.com\//.test(v);
        },
        message: '無効なメディアURLです'
      }
    },
    thumbnailUrl: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https:\/\/res\.cloudinary\.com\//.test(v);
        },
        message: '無効なサムネイルURLです'
      }
    },
    alt: {
      type: String,
      maxlength: [200, '代替テキストは200文字以内で入力してください']
    },
    width: {
      type: Number,
      min: 1,
      max: 4000
    },
    height: {
      type: Number,
      min: 1,
      max: 4000
    },
    size: {
      type: Number,
      min: 0,
      max: 10 * 1024 * 1024 // 10MB制限（コメント用なので投稿より小さく）
    }
  }],
  
  // いいね機能
  likes: {
    type: Number,
    default: 0,
    min: [0, 'いいね数は0以上である必要があります']
  },
  likedBy: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr: string[]) {
        return arr.every(userId => /^[0-9a-fA-F]{24}$/.test(userId));
      },
      message: 'いいねユーザーIDは有効なMongoDBのObjectId形式である必要があります'
    }
  },
  
  // 統計情報
  stats: {
    likes: { type: Number, default: 0, min: 0 },
    replies: { type: Number, default: 0, min: 0 },
    reports: { type: Number, default: 0, min: 0 }
  },
  
  // モデレーション
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  reportCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  hiddenReason: {
    type: String,
    maxlength: [200, '非表示理由は200文字以内で入力してください']
  },
  
  // メタデータ
  language: {
    type: String,
    default: 'ja',
    maxlength: [10, '言語コードは10文字以内で入力してください']
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'comments',
  versionKey: false
});

// バリデーション：返信の場合はparentIdが必須
CommentSchema.pre('save', function (next) {
  if (this.type === 'reply' && !this.parentId) {
    return next(new Error('返信の場合、親コメントIDは必須です'));
  }
  
  if (this.type === 'comment' && this.parentId) {
    return next(new Error('最上位コメントには親コメントIDを設定できません'));
  }
  
  next();
});

// ミドルウェア：保存前処理
CommentSchema.pre('save', async function (next) {
  try {
    // ハッシュタグとメンションを自動抽出
    if (this.isModified('content')) {
      this.hashtags = this.extractHashtags();
      this.mentions = this.extractMentions();
    }
    
    // 統計情報を同期
    this.likes = this.stats.likes;
    
    // 編集フラグの設定
    if (this.isModified('content') && !this.isNew) {
      this.isEdited = true;
      this.editedAt = new Date();
    }
    
    // 返信の場合、スレッドIDと深さを設定
    if (this.type === 'reply' && this.parentId) {
      const parentComment = await mongoose.models.Comment.findById(this.parentId);
      if (parentComment) {
        this.threadId = parentComment.threadId || parentComment._id;
        this.depth = (parentComment.depth || 0) + 1;
      }
    } else if (this.type === 'comment') {
      this.threadId = this._id;
      this.depth = 0;
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ハッシュタグ抽出メソッド
CommentSchema.methods.extractHashtags = function (): string[] {
  if (!this.content) return [];
  
  const hashtagRegex = /#([a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/g;
  const hashtags: string[] = [];
  let match;
  
  while ((match = hashtagRegex.exec(this.content)) !== null) {
    const tag = match[1].toLowerCase();
    if (tag.length <= 50 && !hashtags.includes(tag)) {
      hashtags.push(tag);
    }
  }
  
  return hashtags.slice(0, 5); // 最大5個まで
};

// メンション抽出メソッド
CommentSchema.methods.extractMentions = function (): ICommentMention[] {
  if (!this.content) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions: ICommentMention[] = [];
  let match;
  
  while ((match = mentionRegex.exec(this.content)) !== null) {
    const username = match[1].toLowerCase();
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    mentions.push({
      userId: '', // 後でAPIで解決
      username,
      startIndex,
      endIndex
    });
  }
  
  return mentions;
};

// 統計情報更新メソッド
CommentSchema.methods.updateStats = async function (): Promise<void> {
  try {
    // いいね数
    this.stats.likes = this.likedBy.length;
    this.likes = this.stats.likes;
    
    // 返信数
    this.stats.replies = await mongoose.models.Comment.countDocuments({
      parentId: this._id,
      isDeleted: { $ne: true }
    });
    
    // 報告数
    this.stats.reports = this.reportCount;
    
    await this.save();
  } catch (error) {
    console.error('コメント統計情報の更新に失敗しました:', error);
  }
};

// ユーザーがコメントを閲覧できるかチェック
CommentSchema.methods.canUserView = async function (userId?: string): Promise<boolean> {
  // 削除済みコメントは閲覧不可
  if (this.isDeleted) return false;
  
  // 非表示コメントは管理者・モデレーター・作成者のみ閲覧可能
  if (this.isHidden) {
    if (!userId) return false;
    
    const User = mongoose.models.User;
    if (User) {
      const user = await User.findById(userId);
      if (user && (user.role === 'admin' || user.role === 'moderator' || this.userId === userId)) {
        return true;
      }
    }
    return false;
  }
  
  // 投稿の閲覧権限もチェック
  const Post = mongoose.models.Post;
  if (Post) {
    const post = await Post.findById(this.postId);
    if (post) {
      return post.canUserView(userId);
    }
  }
  
  return true;
};

// ユーザーがコメントを編集できるかチェック
CommentSchema.methods.canUserEdit = function (userId?: string): boolean {
  if (!userId) return false;
  return this.userId === userId;
};

// ユーザーがコメントを削除できるかチェック
CommentSchema.methods.canUserDelete = async function (userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  // 作成者は常に削除可能
  if (this.userId === userId) return true;
  
  // 管理者・モデレーターは削除可能
  const User = mongoose.models.User;
  if (User) {
    const user = await User.findById(userId);
    if (user && (user.role === 'admin' || user.role === 'moderator')) {
      return true;
    }
  }
  
  // 投稿者もコメントを削除可能
  const Post = mongoose.models.Post;
  if (Post) {
    const post = await Post.findById(this.postId);
    if (post && post.userId === userId) {
      return true;
    }
  }
  
  return false;
};

// コメントの返信一覧を取得
CommentSchema.methods.getReplies = async function (): Promise<IComment[]> {
  return mongoose.models.Comment.find({
    parentId: this._id,
    isDeleted: { $ne: true }
  }).sort({ createdAt: 1 });
};

// コメントスレッド全体を取得
CommentSchema.methods.getThread = async function (): Promise<IComment[]> {
  const threadId = this.threadId || this._id;
  return mongoose.models.Comment.find({
    $or: [
      { _id: threadId },
      { threadId: threadId }
    ],
    isDeleted: { $ne: true }
  }).sort({ createdAt: 1 });
};

// パフォーマンス最適化インデックス
CommentSchema.index({ postId: 1, createdAt: -1 }); // 投稿のコメント一覧
CommentSchema.index({ userId: 1, createdAt: -1 }); // ユーザーのコメント一覧
CommentSchema.index({ parentId: 1, createdAt: 1 }); // 返信一覧
CommentSchema.index({ threadId: 1, createdAt: 1 }); // スレッド表示
CommentSchema.index({ hashtags: 1 }); // ハッシュタグ検索
CommentSchema.index({ 'mentions.userId': 1 }); // メンション検索

// 複合インデックス
CommentSchema.index({ postId: 1, depth: 1, createdAt: 1 }); // 階層別コメント表示
CommentSchema.index({ isDeleted: 1, createdAt: -1 }); // 削除状態別
CommentSchema.index({ isHidden: 1, reportCount: -1 }); // モデレーション用
CommentSchema.index({ 'stats.likes': -1 }); // 人気コメント
CommentSchema.index({ type: 1, postId: 1, createdAt: -1 }); // タイプ別コメント

// テキスト検索用
CommentSchema.index({ 
  content: 'text', 
  hashtags: 'text' 
}, {
  weights: {
    content: 2,
    hashtags: 1
  },
  name: 'comment_text_search'
});

// 静的メソッド：投稿のコメント数取得
CommentSchema.statics.getCommentCount = async function(postId: string): Promise<number> {
  return this.countDocuments({ 
    postId, 
    isDeleted: { $ne: true },
    isHidden: { $ne: true }
  });
};

// 静的メソッド：投稿のコメントツリー取得
CommentSchema.statics.getCommentTree = async function(postId: string): Promise<any[]> {
  const comments = await this.find({
    postId,
    isDeleted: { $ne: true },
    isHidden: { $ne: true }
  }).sort({ createdAt: 1 });
  
  // ツリー構造に変換
  const commentMap = new Map();
  const rootComments: any[] = [];
  
  comments.forEach((comment: any) => {
    commentMap.set(comment._id.toString(), { ...comment.toObject(), replies: [] });
  });
  
  comments.forEach((comment: any) => {
    const commentObj = commentMap.get(comment._id.toString());
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId.toString());
      if (parent) {
        parent.replies.push(commentObj);
      }
    } else {
      rootComments.push(commentObj);
    }
  });
  
  return rootComments;
};

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);