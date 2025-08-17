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

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, '名前は必須です'],
      trim: true,
      maxlength: [50, '名前は50文字以内で入力してください'],
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

// メールアドレスのインデックス（schemaでunique: trueが設定済みのため削除）
// UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
