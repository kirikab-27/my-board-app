import mongoose, { Document, Schema } from 'mongoose';

// 認証コード種別の定義
export type VerificationType =
  | 'admin_registration'
  | 'password_reset'
  | '2fa'
  | 'email_verification';

// VerificationCode インターフェース
export interface IVerificationCode extends Document {
  email: string;
  code: string;
  type: VerificationType;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  usedAt?: Date;
  attempts: number;
  lastAttemptAt?: Date;
  lockedUntil?: Date;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;

  // メソッド
  isExpired(): boolean;
  isLocked(): boolean;
  canAttempt(): boolean;
  incrementAttempts(): void;
  markAsUsed(): void;
  lockCode(duration: number): void;
}

// VerificationCode スキーマ
const VerificationCodeSchema: Schema<IVerificationCode> = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 6,
      match: /^[0-9]{6}$/,
    },
    type: {
      type: String,
      required: true,
      enum: ['admin_registration', 'password_reset', '2fa', 'email_verification'],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10分後
      index: { expireAfterSeconds: 0 },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: (doc, ret: any) => {
        delete ret.code;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 複合インデックス（パフォーマンス最適化）
VerificationCodeSchema.index({ email: 1, type: 1, used: 1 });
VerificationCodeSchema.index({ email: 1, code: 1, used: 1 });
VerificationCodeSchema.index({ ipAddress: 1, createdAt: 1 });
VerificationCodeSchema.index({ createdAt: 1, expiresAt: 1 });

// インスタンスメソッド
VerificationCodeSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

VerificationCodeSchema.methods.isLocked = function (): boolean {
  return this.lockedUntil && new Date() < this.lockedUntil;
};

VerificationCodeSchema.methods.canAttempt = function (): boolean {
  return !this.used && !this.isExpired() && !this.isLocked() && this.attempts < 3;
};

VerificationCodeSchema.methods.incrementAttempts = function (): void {
  this.attempts += 1;
  this.lastAttemptAt = new Date();

  // 3回失敗で15分ロック
  if (this.attempts >= 3) {
    this.lockCode(15 * 60 * 1000); // 15分
  }
};

VerificationCodeSchema.methods.markAsUsed = function (): void {
  this.used = true;
  this.usedAt = new Date();
};

VerificationCodeSchema.methods.lockCode = function (duration: number): void {
  this.lockedUntil = new Date(Date.now() + duration);
};

// スタティックメソッド
VerificationCodeSchema.statics.findActiveCode = function (
  email: string,
  code: string,
  type: VerificationType
) {
  return this.findOne({
    email: email.toLowerCase(),
    code,
    type,
    used: false,
    expiresAt: { $gt: new Date() },
  });
};

VerificationCodeSchema.statics.countRecentAttempts = function (
  email: string,
  type: VerificationType,
  minutes: number = 10
) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  return this.countDocuments({
    email: email.toLowerCase(),
    type,
    createdAt: { $gte: cutoff },
  });
};

VerificationCodeSchema.statics.countRecentIPAttempts = function (
  ipAddress: string,
  minutes: number = 10
) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  return this.countDocuments({
    ipAddress,
    createdAt: { $gte: cutoff },
  });
};

VerificationCodeSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { used: true, usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // 使用済みは24時間後削除
    ],
  });
};

// プリフック
VerificationCodeSchema.pre('save', async function (next) {
  // コード重複チェック（同時生成対策）
  if (this.isNew) {
    const existingCodeQuery = {
      code: this.code,
      type: this.type,
      used: false,
      expiresAt: { $gt: new Date() },
      _id: { $ne: this._id },
    };

    try {
      const existing = await (this.constructor as any).findOne(existingCodeQuery).exec();
      if (existing) {
        const error = new Error('同じコードが既に存在します');
        return next(error);
      }
      next();
    } catch (err) {
      return next(err as Error);
    }
  } else {
    next();
  }
});

// ポストフック（統計用）
VerificationCodeSchema.post('save', function (doc) {
  if (doc.used && doc.usedAt) {
    console.log(`✅ 認証コード使用: ${doc.email} (${doc.type})`);
  }
});

const VerificationCode =
  mongoose.models.VerificationCode ||
  mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);

export default VerificationCode;
