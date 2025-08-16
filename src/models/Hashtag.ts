import mongoose, { Document, Schema } from 'mongoose';

// ハッシュタグ関連のタイプ定義
export type HashtagStatus = 'active' | 'blocked' | 'review' | 'deprecated';
export type HashtagCategory = 'general' | 'technology' | 'entertainment' | 'sports' | 'news' | 'lifestyle' | 'business' | 'education' | 'art' | 'food' | 'travel' | 'health' | 'fashion' | 'other';

// 統計情報の時系列データ
export interface IHashtagDailyStats {
  date: Date;
  postCount: number;
  commentCount: number;
  uniqueUsers: number;
  engagementScore: number; // エンゲージメントスコア
}

// ハッシュタグの統計情報
export interface IHashtagStats {
  totalPosts: number;           // 総投稿数
  totalComments: number;        // 総コメント数
  uniqueUsers: number;          // ユニークユーザー数
  weeklyGrowth: number;         // 週間成長率（%）
  monthlyGrowth: number;        // 月間成長率（%）
  peakUsage: Date;              // ピーク使用日時
  lastUsed: Date;               // 最後に使用された日時
  trendScore: number;           // トレンドスコア（0-100）
  dailyStats: IHashtagDailyStats[]; // 日別統計（直近30日）
}

// 関連ハッシュタグ情報
export interface IRelatedHashtag {
  tagName: string;
  correlation: number;          // 関連度（0-1）
  coOccurrenceCount: number;   // 共起回数
}

export interface IHashtag extends Document {
  // 基本情報
  name: string;                 // ハッシュタグ名（#なし、小文字）
  displayName: string;          // 表示用ハッシュタグ名（大文字小文字混在）
  description?: string;         // ハッシュタグの説明
  category: HashtagCategory;    // カテゴリ
  
  // 作成者・管理情報
  createdBy?: string;           // 作成者ユーザーID
  creatorName?: string;         // 作成者名
  moderatedBy?: string;         // モデレーターID
  
  // ステータス管理
  status: HashtagStatus;
  isOfficial: boolean;          // 公式ハッシュタグかどうか
  isTrending: boolean;          // トレンド中かどうか
  isBlocked: boolean;           // ブロック済みかどうか
  blockReason?: string;         // ブロック理由
  
  // 統計情報
  stats: IHashtagStats;
  
  // 関連情報
  relatedTags: IRelatedHashtag[]; // 関連ハッシュタグ
  synonyms: string[];             // 同義語
  
  // SEO・検索最適化
  searchTerms: string[];          // 検索に使用されるキーワード
  aliases: string[];              // エイリアス（別名）
  
  // イベント・キャンペーン関連
  isEvent: boolean;               // イベント関連タグかどうか
  eventStartDate?: Date;          // イベント開始日
  eventEndDate?: Date;            // イベント終了日
  campaignId?: string;            // キャンペーンID
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  
  // メソッド
  updateStats(): Promise<void>;
  calculateTrendScore(): Promise<number>;
  addRelatedTag(tagName: string, correlation: number): Promise<void>;
  block(reason: string, moderatorId: string): Promise<void>;
  unblock(): Promise<void>;
  getRecentActivity(days?: number): Promise<IHashtagDailyStats[]>;
  isValidHashtag(): boolean;
}

const HashtagSchema: Schema = new Schema({
  // 基本情報
  name: {
    type: String,
    required: [true, 'ハッシュタグ名は必須です'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [1, 'ハッシュタグは1文字以上である必要があります'],
    maxlength: [50, 'ハッシュタグは50文字以内で入力してください'],
    match: [/^[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/, 'ハッシュタグは英数字、ひらがな、カタカナ、漢字、アンダースコアのみ使用できます']
  },
  displayName: {
    type: String,
    required: [true, '表示名は必須です'],
    trim: true,
    maxlength: [50, '表示名は50文字以内で入力してください']
  },
  description: {
    type: String,
    maxlength: [200, 'ハッシュタグの説明は200文字以内で入力してください'],
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'technology', 'entertainment', 'sports', 'news', 'lifestyle', 'business', 'education', 'art', 'food', 'travel', 'health', 'fashion', 'other'],
    default: 'general',
    required: [true, 'カテゴリは必須です']
  },
  
  // 作成者・管理情報
  createdBy: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効な作成者IDです'
    }
  },
  creatorName: {
    type: String,
    maxlength: [100, '作成者名は100文字以内で入力してください'],
    trim: true
  },
  moderatedBy: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9a-fA-F]{24}$/.test(v);
      },
      message: '無効なモデレーターIDです'
    }
  },
  
  // ステータス管理
  status: {
    type: String,
    enum: ['active', 'blocked', 'review', 'deprecated'],
    default: 'active',
    required: [true, 'ステータスは必須です']
  },
  isOfficial: {
    type: Boolean,
    default: false
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    maxlength: [200, 'ブロック理由は200文字以内で入力してください']
  },
  
  // 統計情報
  stats: {
    totalPosts: { type: Number, default: 0, min: 0 },
    totalComments: { type: Number, default: 0, min: 0 },
    uniqueUsers: { type: Number, default: 0, min: 0 },
    weeklyGrowth: { type: Number, default: 0 },
    monthlyGrowth: { type: Number, default: 0 },
    peakUsage: { type: Date },
    lastUsed: { type: Date },
    trendScore: { type: Number, default: 0, min: 0, max: 100 },
    dailyStats: [{
      date: { type: Date, required: true },
      postCount: { type: Number, default: 0, min: 0 },
      commentCount: { type: Number, default: 0, min: 0 },
      uniqueUsers: { type: Number, default: 0, min: 0 },
      engagementScore: { type: Number, default: 0, min: 0 }
    }]
  },
  
  // 関連情報
  relatedTags: [{
    tagName: {
      type: String,
      required: true,
      maxlength: [50, 'タグ名は50文字以内である必要があります']
    },
    correlation: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    coOccurrenceCount: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  synonyms: [{
    type: String,
    maxlength: [50, '同義語は50文字以内である必要があります']
  }],
  
  // SEO・検索最適化
  searchTerms: [{
    type: String,
    maxlength: [100, '検索キーワードは100文字以内である必要があります']
  }],
  aliases: [{
    type: String,
    maxlength: [50, 'エイリアスは50文字以内である必要があります']
  }],
  
  // イベント・キャンペーン関連
  isEvent: {
    type: Boolean,
    default: false
  },
  eventStartDate: {
    type: Date
  },
  eventEndDate: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        return !v || !this.eventStartDate || v >= this.eventStartDate;
      },
      message: 'イベント終了日は開始日より後である必要があります'
    }
  },
  campaignId: {
    type: String,
    maxlength: [100, 'キャンペーンIDは100文字以内である必要があります']
  }
}, {
  timestamps: true,
  collection: 'hashtags',
  versionKey: false
});

// バリデーション：ブロック時はブロック理由が必須
HashtagSchema.pre('save', function (next) {
  if (this.isBlocked && !this.blockReason) {
    return next(new Error('ブロック時はブロック理由が必須です'));
  }
  
  if (this.status === 'blocked') {
    this.isBlocked = true;
  }
  
  next();
});

// ミドルウェア：保存前処理
HashtagSchema.pre('save', async function (next) {
  try {
    // displayNameが設定されていない場合、nameから生成
    if (!this.displayName && this.name) {
      this.displayName = this.name;
    }
    
    // 日別統計は直近30日分のみ保持
    if (this.stats.dailyStats.length > 30) {
      this.stats.dailyStats = this.stats.dailyStats
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 30);
    }
    
    // トレンドスコアを自動計算
    if (this.isModified('stats')) {
      this.stats.trendScore = await this.calculateTrendScore();
      this.isTrending = this.stats.trendScore > 70;
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 統計情報更新メソッド
HashtagSchema.methods.updateStats = async function (): Promise<void> {
  try {
    const Post = mongoose.models.Post;
    const Comment = mongoose.models.Comment;
    
    if (Post) {
      // 投稿数カウント
      this.stats.totalPosts = await Post.countDocuments({
        hashtags: this.name,
        isDeleted: { $ne: true }
      });
      
      // ユニークユーザー数カウント
      const uniquePostUsers = await Post.distinct('userId', {
        hashtags: this.name,
        isDeleted: { $ne: true }
      });
      
      // 最後の使用日時
      const lastPost = await Post.findOne({
        hashtags: this.name,
        isDeleted: { $ne: true }
      }).sort({ createdAt: -1 });
      
      if (lastPost) {
        this.stats.lastUsed = lastPost.createdAt;
      }
      
      this.stats.uniqueUsers = uniquePostUsers.length;
    }
    
    if (Comment) {
      // コメント数カウント
      this.stats.totalComments = await Comment.countDocuments({
        hashtags: this.name,
        isDeleted: { $ne: true }
      });
      
      // コメントの最後の使用日時もチェック
      const lastComment = await Comment.findOne({
        hashtags: this.name,
        isDeleted: { $ne: true }
      }).sort({ createdAt: -1 });
      
      if (lastComment && (!this.stats.lastUsed || lastComment.createdAt > this.stats.lastUsed)) {
        this.stats.lastUsed = lastComment.createdAt;
      }
      
      // コメントのユニークユーザーも含める
      const uniqueCommentUsers = await Comment.distinct('userId', {
        hashtags: this.name,
        isDeleted: { $ne: true }
      });
      
      const allUniqueUsers = new Set([
        ...uniquePostUsers || [],
        ...uniqueCommentUsers
      ]);
      this.stats.uniqueUsers = allUniqueUsers.size;
    }
    
    // 成長率計算
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (Post) {
      const weeklyPosts = await Post.countDocuments({
        hashtags: this.name,
        createdAt: { $gte: oneWeekAgo },
        isDeleted: { $ne: true }
      });
      
      const monthlyPosts = await Post.countDocuments({
        hashtags: this.name,
        createdAt: { $gte: oneMonthAgo },
        isDeleted: { $ne: true }
      });
      
      // 成長率計算（簡易版）
      const previousWeekPosts = this.stats.totalPosts - weeklyPosts;
      const previousMonthPosts = this.stats.totalPosts - monthlyPosts;
      
      this.stats.weeklyGrowth = previousWeekPosts > 0 ? (weeklyPosts / previousWeekPosts) * 100 : 0;
      this.stats.monthlyGrowth = previousMonthPosts > 0 ? (monthlyPosts / previousMonthPosts) * 100 : 0;
    }
    
    await this.save();
  } catch (error) {
    console.error('ハッシュタグ統計情報の更新に失敗しました:', error);
  }
};

// トレンドスコア計算メソッド
HashtagSchema.methods.calculateTrendScore = async function (): Promise<number> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 基本スコア要素
    let score = 0;
    
    // 1. 直近24時間の活動度（40点満点）
    const recentActivity = this.stats.dailyStats
      .filter(stat => stat.date >= oneDayAgo)
      .reduce((sum, stat) => sum + stat.postCount + stat.commentCount, 0);
    score += Math.min(recentActivity * 2, 40);
    
    // 2. 週間成長率（30点満点）
    if (this.stats.weeklyGrowth > 0) {
      score += Math.min(this.stats.weeklyGrowth / 10, 30);
    }
    
    // 3. ユニークユーザー数（20点満点）
    score += Math.min(this.stats.uniqueUsers / 5, 20);
    
    // 4. エンゲージメント率（10点満点）
    const totalPosts = this.stats.totalPosts;
    const totalComments = this.stats.totalComments;
    const engagementRate = totalPosts > 0 ? (totalComments / totalPosts) : 0;
    score += Math.min(engagementRate * 10, 10);
    
    return Math.min(Math.round(score), 100);
  } catch (error) {
    console.error('トレンドスコア計算に失敗しました:', error);
    return 0;
  }
};

// 関連タグ追加メソッド
HashtagSchema.methods.addRelatedTag = async function (tagName: string, correlation: number): Promise<void> {
  const existingIndex = this.relatedTags.findIndex((tag: IRelatedHashtag) => tag.tagName === tagName);
  
  if (existingIndex >= 0) {
    // 既存の関連タグの相関度を更新
    this.relatedTags[existingIndex].correlation = correlation;
    this.relatedTags[existingIndex].coOccurrenceCount += 1;
  } else {
    // 新しい関連タグを追加
    this.relatedTags.push({
      tagName,
      correlation,
      coOccurrenceCount: 1
    });
  }
  
  // 関連タグは最大10個まで、相関度が高い順に保持
  this.relatedTags = this.relatedTags
    .sort((a, b) => b.correlation - a.correlation)
    .slice(0, 10);
  
  await this.save();
};

// ブロックメソッド
HashtagSchema.methods.block = async function (reason: string, moderatorId: string): Promise<void> {
  this.status = 'blocked';
  this.isBlocked = true;
  this.blockReason = reason;
  this.moderatedBy = moderatorId;
  this.isTrending = false;
  await this.save();
};

// ブロック解除メソッド
HashtagSchema.methods.unblock = async function (): Promise<void> {
  this.status = 'active';
  this.isBlocked = false;
  this.blockReason = undefined;
  await this.save();
};

// 最近の活動取得メソッド
HashtagSchema.methods.getRecentActivity = async function (days: number = 7): Promise<IHashtagDailyStats[]> {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.stats.dailyStats
    .filter((stat: IHashtagDailyStats) => stat.date >= cutoffDate)
    .sort((a: IHashtagDailyStats, b: IHashtagDailyStats) => b.date.getTime() - a.date.getTime());
};

// ハッシュタグ有効性チェック
HashtagSchema.methods.isValidHashtag = function (): boolean {
  return this.status === 'active' && !this.isBlocked;
};

// パフォーマンス最適化インデックス
HashtagSchema.index({ name: 1 }, { unique: true }); // ハッシュタグ名での検索
HashtagSchema.index({ category: 1, 'stats.totalPosts': -1 }); // カテゴリ別人気順
HashtagSchema.index({ isTrending: 1, 'stats.trendScore': -1 }); // トレンド順
HashtagSchema.index({ 'stats.totalPosts': -1 }); // 人気順
HashtagSchema.index({ 'stats.lastUsed': -1 }); // 最近使用順
HashtagSchema.index({ status: 1 }); // ステータス別

// 複合インデックス
HashtagSchema.index({ status: 1, category: 1, 'stats.totalPosts': -1 }); // ステータス・カテゴリ・人気度
HashtagSchema.index({ isOfficial: 1, 'stats.totalPosts': -1 }); // 公式タグ・人気順
HashtagSchema.index({ createdAt: -1 }); // 作成日順
HashtagSchema.index({ 'stats.weeklyGrowth': -1 }); // 成長率順

// テキスト検索用
HashtagSchema.index({ 
  name: 'text', 
  displayName: 'text', 
  description: 'text',
  searchTerms: 'text',
  aliases: 'text'
}, {
  weights: {
    name: 5,
    displayName: 4,
    aliases: 3,
    searchTerms: 2,
    description: 1
  },
  name: 'hashtag_text_search'
});

// 静的メソッド：トレンドハッシュタグ取得
HashtagSchema.statics.getTrendingHashtags = async function(limit: number = 10): Promise<IHashtag[]> {
  return this.find({
    status: 'active',
    isBlocked: false,
    isTrending: true
  })
  .sort({ 'stats.trendScore': -1, 'stats.totalPosts': -1 })
  .limit(limit);
};

// 静的メソッド：カテゴリ別人気ハッシュタグ取得
HashtagSchema.statics.getPopularByCategory = async function(category: string, limit: number = 5): Promise<IHashtag[]> {
  return this.find({
    category,
    status: 'active',
    isBlocked: false
  })
  .sort({ 'stats.totalPosts': -1 })
  .limit(limit);
};

// 静的メソッド：ハッシュタグ検索（オートコンプリート）
HashtagSchema.statics.searchHashtags = async function(query: string, limit: number = 10): Promise<IHashtag[]> {
  const regex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { name: regex },
      { displayName: regex },
      { aliases: regex }
    ],
    status: 'active',
    isBlocked: false
  })
  .sort({ 'stats.totalPosts': -1 })
  .limit(limit);
};

// 静的メソッド：関連ハッシュタグ取得
HashtagSchema.statics.getRelatedHashtags = async function(tagName: string, limit: number = 5): Promise<string[]> {
  const hashtag = await this.findOne({ name: tagName.toLowerCase() });
  if (!hashtag) return [];
  
  return hashtag.relatedTags
    .sort((a: IRelatedHashtag, b: IRelatedHashtag) => b.correlation - a.correlation)
    .slice(0, limit)
    .map((tag: IRelatedHashtag) => tag.tagName);
};

// 静的メソッド：日別統計更新
HashtagSchema.statics.updateDailyStats = async function(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const hashtags = await this.find({ status: 'active' });
  
  for (const hashtag of hashtags) {
    // 今日の統計が既に存在するかチェック
    const existingStatIndex = hashtag.stats.dailyStats.findIndex(
      (stat: IHashtagDailyStats) => stat.date.getTime() === today.getTime()
    );
    
    const Post = mongoose.models.Post;
    const Comment = mongoose.models.Comment;
    
    let postCount = 0;
    let commentCount = 0;
    let uniqueUsers = new Set();
    
    if (Post) {
      const posts = await Post.find({
        hashtags: hashtag.name,
        createdAt: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        isDeleted: { $ne: true }
      });
      
      postCount = posts.length;
      posts.forEach((post: any) => {
        if (post.userId) uniqueUsers.add(post.userId);
      });
    }
    
    if (Comment) {
      const comments = await Comment.find({
        hashtags: hashtag.name,
        createdAt: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        isDeleted: { $ne: true }
      });
      
      commentCount = comments.length;
      comments.forEach((comment: any) => {
        if (comment.userId) uniqueUsers.add(comment.userId);
      });
    }
    
    const engagementScore = postCount > 0 ? (commentCount / postCount) * 10 : 0;
    
    const dailyStat: IHashtagDailyStats = {
      date: today,
      postCount,
      commentCount,
      uniqueUsers: uniqueUsers.size,
      engagementScore: Math.round(engagementScore * 100) / 100
    };
    
    if (existingStatIndex >= 0) {
      hashtag.stats.dailyStats[existingStatIndex] = dailyStat;
    } else {
      hashtag.stats.dailyStats.push(dailyStat);
    }
    
    await hashtag.save();
  }
};

export default mongoose.models.Hashtag || mongoose.model<IHashtag>('Hashtag', HashtagSchema);