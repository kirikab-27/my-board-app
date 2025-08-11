import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title?: string; // 投稿タイトル（Phase 4.5追加・最大100文字）
  content: string;
  likes: number;
  likedBy: string[]; // ユーザーIDの配列（認証ユーザー用）・IPアドレス配列（匿名用・後方互換性）
  userId?: string; // 投稿者のユーザーID（認証ユーザーの場合）
  authorName?: string; // 投稿者名（表示用・匿名対応）
  isPublic: boolean; // 公開設定（会員限定機能）
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  title: {
    type: String,
    required: false,
    maxlength: [100, 'タイトルは100文字以内で入力してください'],
    trim: true
  },
  content: {
    type: String,
    required: [true, '投稿内容は必須です'],
    maxlength: [1000, '投稿は1000文字以内で入力してください'],
    trim: true
  },
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
        return arr.every(item => typeof item === 'string' && item.length > 0);
      },
      message: 'likedByには有効な文字列のみ含めることができます'
    }
  },
  // 認証ユーザー情報
  userId: {
    type: String,
    required: false,
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9a-fA-F]{24}$/.test(v); // MongoDB ObjectId形式
      },
      message: 'userIdは有効なMongoDBのObjectId形式である必要があります'
    }
  },
  authorName: {
    type: String,
    required: false,
    maxlength: [100, '作者名は100文字以内で入力してください'],
    trim: true
  },
  // 公開設定
  isPublic: {
    type: Boolean,
    default: true, // 既存投稿の互換性のため初期値はtrue
    required: [true, '公開設定は必須です']
  }
}, {
  timestamps: true
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);