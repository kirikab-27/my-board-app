import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  content: string;
  likes: number;
  likedBy: string[]; // IPアドレスの配列
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  content: {
    type: String,
    required: [true, '投稿内容は必須です'],
    maxlength: [200, '投稿は200文字以内で入力してください'],
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
        return arr.every(ip => typeof ip === 'string' && ip.length > 0);
      },
      message: 'likedByには有効なIPアドレス文字列のみ含めることができます'
    }
  }
}, {
  timestamps: true
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);