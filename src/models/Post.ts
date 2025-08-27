import mongoose, { Document, Schema } from 'mongoose';

// SNS用のタイプ定義
export type PostType = 'post' | 'repost' | 'quote' | 'reply';
export type PostPrivacy = 'public' | 'followers' | 'friends' | 'private';
export type MediaType = 'image' | 'video' | 'gif';

export interface IPostMedia {
  mediaId: string; // メディアID
  type: MediaType;
  url: string; // Cloudinary URL
  thumbnailUrl?: string; // サムネイル（動画用）
  publicId?: string; // Cloudinary公開ID
  title?: string; // ファイルタイトル
  alt?: string; // 代替テキスト
  width?: number;
  height?: number;
  size?: number; // ファイルサイズ（bytes）
  mimeType?: string; // MIMEタイプ
  hash?: string; // SHA-256 ハッシュ値（重複防止用）
}

export interface IPostLocation {
  name: string; // 場所名
  latitude?: number;
  longitude?: number;
  accuracy?: number; // 精度（meters）
}

export interface IPostStats {
  likes: number;
  comments: number;
  reposts: number;
  quotes: number;
  views: number;
  shares: number;
}

export interface IPostMention {
  userId: string;
  username: string;
  startIndex: number;
  endIndex: number;
}

export interface IPost extends Document {
  // 基本情報
  title?: string; // 投稿タイトル（Phase 4.5追加・最大100文字）
  content: string;
  type: PostType; // 投稿タイプ

  // 作成者情報
  userId?: string; // 投稿者のユーザーID（認証ユーザーの場合）
  authorName?: string; // 投稿者名（表示用・匿名対応）
  authorRole?: string; // 投稿者の役割（'user' | 'moderator' | 'admin'）

  // SNS機能
  hashtags: string[]; // ハッシュタグ（#なし）
  mentions: IPostMention[]; // メンション機能
  media: IPostMedia[]; // 添付メディア
  location?: IPostLocation; // 位置情報

  // プライバシー・公開設定
  privacy: PostPrivacy;
  isPublic: boolean; // 既存互換性のため残す

  // いいね機能（拡張）
  likes: number; // 統計用（既存互換性）
  likedBy: string[]; // ユーザーIDの配列（既存互換性）

  // 統計情報
  stats: IPostStats;

  // リポスト・引用機能
  originalPostId?: string; // 元投稿ID（リポスト・引用時）
  quotedPostId?: string; // 引用投稿ID
  replyToId?: string; // 返信先投稿ID

  // メタデータ
  language?: string; // 投稿言語
  isEdited: boolean; // 編集済みフラグ
  editedAt?: Date; // 編集日時
  isPinned: boolean; // ピン留め

  // モデレーション
  isDeleted: boolean; // 論理削除
  deletedAt?: Date;
  reportCount: number; // 報告回数

  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;

  // メソッド
  extractHashtags(): string[];
  extractMentions(): IPostMention[];
  updateStats(): Promise<void>;
  canUserView(userId?: string): Promise<boolean>;
  canUserEdit(userId?: string): boolean;
}

const PostSchema: Schema = new Schema(
  {
    // 基本情報
    title: {
      type: String,
      required: false,
      maxlength: [100, 'タイトルは100文字以内で入力してください'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, '投稿内容は必須です'],
      maxlength: [1000, '投稿は1000文字以内で入力してください'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['post', 'repost', 'quote', 'reply'],
      default: 'post',
      required: [true, '投稿タイプは必須です'],
    },

    // 作成者情報
    userId: {
      type: String,
      required: false,
      validate: {
        validator: function (v: string) {
          return !v || /^[0-9a-fA-F]{24}$/.test(v); // MongoDB ObjectId形式
        },
        message: 'userIdは有効なMongoDBのObjectId形式である必要があります',
      },
    },
    authorName: {
      type: String,
      required: false,
      maxlength: [100, '作者名は100文字以内で入力してください'],
      trim: true,
    },
    authorRole: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
      required: false,
    },

    // SNS機能
    hashtags: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr: string[]) {
          return (
            arr.length <= 10 &&
            arr.every(
              (tag) =>
                typeof tag === 'string' &&
                tag.length <= 50 &&
                /^[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(tag)
            )
          );
        },
        message: 'ハッシュタグは10個まで、各タグは50文字以内で入力してください',
      },
    },
    mentions: {
      type: [
        {
          userId: String,
          username: String,
          startIndex: Number,
          endIndex: Number,
        },
      ],
      default: [],
    },
    media: {
      type: [
        {
          mediaId: String,
          type: {
            type: String,
            enum: ['image', 'video', 'gif'],
          },
          url: String,
          thumbnailUrl: String,
          publicId: String,
          title: String,
          alt: String,
          width: Number,
          height: Number,
          size: Number,
          mimeType: String,
          hash: String,
        },
      ],
      default: [],
    },
    location: {
      name: String,
      latitude: Number,
      longitude: Number,
      accuracy: Number,
    },

    // プライバシー・公開設定
    privacy: {
      type: String,
      enum: ['public', 'followers', 'friends', 'private'],
      default: 'public',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },

    // いいね機能（拡張）
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: {
      type: [String],
      default: [],
    },

    // 統計情報
    stats: {
      likes: {
        type: Number,
        default: 0,
        min: 0,
      },
      comments: {
        type: Number,
        default: 0,
        min: 0,
      },
      reposts: {
        type: Number,
        default: 0,
        min: 0,
      },
      quotes: {
        type: Number,
        default: 0,
        min: 0,
      },
      views: {
        type: Number,
        default: 0,
        min: 0,
      },
      shares: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // リポスト・引用機能
    originalPostId: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[0-9a-fA-F]{24}$/.test(v);
        },
        message: 'originalPostIdは有効なMongoDBのObjectId形式である必要があります',
      },
    },
    quotedPostId: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[0-9a-fA-F]{24}$/.test(v);
        },
        message: 'quotedPostIdは有効なMongoDBのObjectId形式である必要があります',
      },
    },
    replyToId: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[0-9a-fA-F]{24}$/.test(v);
        },
        message: 'replyToIdは有効なMongoDBのObjectId形式である必要があります',
      },
    },

    // メタデータ
    language: {
      type: String,
      maxlength: [10, '言語コードは10文字以内で入力してください'],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },

    // モデレーション
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ハッシュタグ抽出メソッド
PostSchema.methods.extractHashtags = function (): string[] {
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

  return hashtags.slice(0, 10); // 最大10個まで
};

// メンション抽出メソッド
PostSchema.methods.extractMentions = function (): IPostMention[] {
  if (!this.content) return [];

  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions: IPostMention[] = [];
  let match;

  while ((match = mentionRegex.exec(this.content)) !== null) {
    const username = match[1].toLowerCase();
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;

    // ユーザーIDは実際のクエリで解決される
    mentions.push({
      userId: '', // 後でAPIで解決
      username,
      startIndex,
      endIndex,
    });
  }

  return mentions;
};

// ユーザーが投稿を閲覧できるかチェック
PostSchema.methods.canUserView = async function (userId?: string): Promise<boolean> {
  // 削除済み投稿は閲覧不可
  if (this.isDeleted) return false;

  // 公開投稿は誰でも閲覧可能
  if (this.privacy === 'public') return true;

  // ログインしていない場合は公開投稿のみ
  if (!userId) return false;

  // 投稿者自身は常に閲覧可能
  if (this.userId === userId) return true;

  // プライベート投稿は投稿者のみ
  if (this.privacy === 'private') return false;

  // フォロワー限定の場合、フォロー関係をチェック
  if (this.privacy === 'followers') {
    const Follow = mongoose.models.Follow;
    if (Follow) {
      const isFollowing = await Follow.findOne({
        follower: userId,
        following: this.userId,
      });
      return !!isFollowing;
    }
  }

  // 友達限定の場合、相互フォローをチェック
  if (this.privacy === 'friends') {
    const Follow = mongoose.models.Follow;
    if (Follow) {
      const [following, follower] = await Promise.all([
        Follow.findOne({ follower: userId, following: this.userId }),
        Follow.findOne({ follower: this.userId, following: userId }),
      ]);
      return !!(following && follower);
    }
  }

  return false;
};

// ユーザーが投稿を編集できるかチェック
PostSchema.methods.canUserEdit = function (userId?: string): boolean {
  if (!userId) return false;
  return this.userId === userId;
};

// パフォーマンス最適化インデックス
PostSchema.index({ userId: 1, createdAt: -1 }); // ユーザーの投稿タイムライン
PostSchema.index({ createdAt: -1 }); // 全体タイムライン
PostSchema.index({ hashtags: 1 }); // ハッシュタグ検索
PostSchema.index({ 'mentions.userId': 1 }); // メンション検索
PostSchema.index({ 'stats.likes': -1 }); // 人気投稿
PostSchema.index({ type: 1, createdAt: -1 }); // 投稿タイプ別
PostSchema.index({ authorRole: 1, createdAt: -1 }); // 投稿者役割別

// 複合インデックス
PostSchema.index({ privacy: 1, createdAt: -1 }); // プライバシー設定別
PostSchema.index({ isDeleted: 1, createdAt: -1 }); // 削除状態別
PostSchema.index({ originalPostId: 1, type: 1 }); // リポスト・引用検索
PostSchema.index({ replyToId: 1 }); // 返信チェーン

// 位置情報検索用（2dsphere）
PostSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// テキスト検索用
PostSchema.index(
  {
    title: 'text',
    content: 'text',
    hashtags: 'text',
  },
  {
    weights: {
      title: 3,
      content: 2,
      hashtags: 1,
    },
    name: 'post_text_search',
  }
);

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
