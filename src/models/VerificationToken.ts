import mongoose from 'mongoose';

export interface IVerificationToken extends mongoose.Document {
  _id: string;
  identifier: string; // メールアドレス
  token: string;      // ユニークトークン
  expires: Date;      // 有効期限
  type: 'email-verification' | 'password-reset'; // トークンタイプ
  createdAt: Date;
  updatedAt: Date;
}

// スタティックメソッドのインターface定義
export interface IVerificationTokenModel extends mongoose.Model<IVerificationToken> {
  createEmailVerificationToken(email: string, expiresInHours?: number): Promise<IVerificationToken>;
  createPasswordResetToken(email: string, expiresInHours?: number): Promise<IVerificationToken>;
  cleanExpired(): Promise<any>;
}

const VerificationTokenSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expires: {
    type: Date,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['email-verification', 'password-reset'],
    required: true,
  },
}, {
  timestamps: true,
});

// 有効期限でのインデックス（自動削除用）
VerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

// 複合インデックス（検索効率化）
VerificationTokenSchema.index({ identifier: 1, type: 1 });
VerificationTokenSchema.index({ token: 1, type: 1 });

// トークン生成用のスタティックメソッド
VerificationTokenSchema.statics.createEmailVerificationToken = async function(
  email: string, 
  expiresInHours: number = 24
) {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  
  return this.create({
    identifier: email,
    token,
    expires,
    type: 'email-verification',
  });
};

VerificationTokenSchema.statics.createPasswordResetToken = async function(
  email: string,
  expiresInHours: number = 1
) {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  
  return this.create({
    identifier: email,
    token,
    expires,
    type: 'password-reset',
  });
};

// 期限切れトークンの削除
VerificationTokenSchema.statics.cleanExpired = async function() {
  return this.deleteMany({ expires: { $lt: new Date() } });
};

export default (mongoose.models.VerificationToken || 
  mongoose.model<IVerificationToken, IVerificationTokenModel>('VerificationToken', VerificationTokenSchema)) as IVerificationTokenModel;