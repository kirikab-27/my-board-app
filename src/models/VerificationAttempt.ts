import mongoose, { Document, Schema } from 'mongoose';
import { VerificationType } from './VerificationCode';

// 検証試行結果の定義
export type AttemptResult =
  | 'success'
  | 'invalid_code'
  | 'expired'
  | 'locked'
  | 'rate_limited'
  | 'used';

// VerificationAttempt インターフェース
export interface IVerificationAttempt extends Document {
  email: string;
  type: VerificationType;
  attemptedCode: string;
  result: AttemptResult;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  responseTime: number;
  sessionId?: string;
  riskScore?: number;
  metadata?: Record<string, any>;

  // メソッド
  isSuccessful(): boolean;
  isSuspicious(): boolean;
  calculateRiskScore(): number;
}

// VerificationAttempt スキーマ
const VerificationAttemptSchema: Schema<IVerificationAttempt> = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['admin_registration', 'password_reset', '2fa', 'email_verification'],
      index: true,
    },
    attemptedCode: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 6,
      // セキュリティ上、暗号化して保存
      set: function (code: string) {
        // 実際の実装では暗号化を推奨
        return code;
      },
    },
    result: {
      type: String,
      required: true,
      enum: ['success', 'invalid_code', 'expired', 'locked', 'rate_limited', 'used'],
      index: true,
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
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    responseTime: {
      type: Number,
      required: true,
      min: 0,
      max: 10000, // 10秒上限
    },
    sessionId: {
      type: String,
      index: true,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
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
        delete ret.attemptedCode; // セキュリティ上削除
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 複合インデックス（分析・監視用）
VerificationAttemptSchema.index({ email: 1, result: 1, timestamp: -1 });
VerificationAttemptSchema.index({ ipAddress: 1, result: 1, timestamp: -1 });
VerificationAttemptSchema.index({ type: 1, result: 1, timestamp: -1 });
VerificationAttemptSchema.index({ timestamp: -1, riskScore: -1 });

// TTLインデックス（古いログ自動削除）
VerificationAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30日

// インスタンスメソッド
VerificationAttemptSchema.methods.isSuccessful = function (): boolean {
  return this.result === 'success';
};

VerificationAttemptSchema.methods.isSuspicious = function (): boolean {
  return this.riskScore > 70 || this.result === 'rate_limited';
};

VerificationAttemptSchema.methods.calculateRiskScore = function (): number {
  let score = 0;

  // 失敗回数によるスコア
  if (this.result === 'invalid_code') score += 30;
  if (this.result === 'expired') score += 10;
  if (this.result === 'used') score += 20;
  if (this.result === 'rate_limited') score += 50;

  // レスポンス時間による怪しさ（自動化検知）
  if (this.responseTime < 100) score += 25; // 100ms未満は怪しい
  if (this.responseTime < 50) score += 25; // 50ms未満は非常に怪しい

  // User-Agent分析
  if (!this.userAgent || this.userAgent.length < 10) score += 20;

  // 時間帯分析（深夜の大量試行）
  const hour = this.timestamp.getHours();
  if (hour >= 2 && hour <= 5) score += 10;

  return Math.min(score, 100);
};

// スタティックメソッド
VerificationAttemptSchema.statics.getFailureRate = function (
  email: string,
  type: VerificationType,
  hours: number = 1
) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        email: email.toLowerCase(),
        type,
        timestamp: { $gte: cutoff },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        failures: {
          $sum: {
            $cond: [{ $ne: ['$result', 'success'] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        failureRate: {
          $cond: [{ $gt: ['$total', 0] }, { $divide: ['$failures', '$total'] }, 0],
        },
        total: 1,
        failures: 1,
      },
    },
  ]);
};

VerificationAttemptSchema.statics.getSuspiciousActivity = function (hours: number = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: cutoff },
        $or: [{ riskScore: { $gte: 70 } }, { result: 'rate_limited' }],
      },
    },
    {
      $group: {
        _id: {
          ipAddress: '$ipAddress',
          email: '$email',
        },
        attemptCount: { $sum: 1 },
        avgRiskScore: { $avg: '$riskScore' },
        results: { $push: '$result' },
        timestamps: { $push: '$timestamp' },
      },
    },
    {
      $match: {
        attemptCount: { $gte: 3 },
      },
    },
    {
      $sort: { avgRiskScore: -1, attemptCount: -1 },
    },
  ]);
};

VerificationAttemptSchema.statics.getHourlyStats = function (hours: number = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: cutoff },
      },
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          result: '$result',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.hour',
        results: {
          $push: {
            result: '$_id.result',
            count: '$count',
          },
        },
        total: { $sum: '$count' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

// プリフック（リスクスコア計算）
VerificationAttemptSchema.pre('save', function (next) {
  if (this.isNew) {
    this.riskScore = this.calculateRiskScore();
  }
  next();
});

// ポストフック（アラート）
VerificationAttemptSchema.post('save', function (doc) {
  // 高リスクスコアのアラート
  if (doc.riskScore && doc.riskScore > 80) {
    console.warn(
      `🚨 高リスク認証試行: ${doc.email} (Risk: ${doc.riskScore}, IP: ${doc.ipAddress})`
    );
  }

  // レート制限アラート
  if (doc.result === 'rate_limited') {
    console.warn(`⚠️ レート制限発動: ${doc.email} (IP: ${doc.ipAddress})`);
  }
});

const VerificationAttempt =
  mongoose.models.VerificationAttempt ||
  mongoose.model<IVerificationAttempt>('VerificationAttempt', VerificationAttemptSchema);

export default VerificationAttempt;
