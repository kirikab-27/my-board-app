/**
 * セッション管理モデル
 * Issue #54: セキュアセッション管理システム
 */

import mongoose, { Document, Model } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionToken: string;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    browser: string;
    os: string;
    deviceId?: string;
  };
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  twoFactorVerified: boolean;
  loginLocation?: {
    country?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  securityFlags: {
    suspicious: boolean;
    suspiciousReason?: string;
    blocked: boolean;
    blockedReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  deviceInfo: {
    userAgent: { type: String, required: true },
    ipAddress: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: { type: String, default: 'unknown' },
    os: { type: String, default: 'unknown' },
    deviceId: { type: String },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  twoFactorVerified: {
    type: Boolean,
    default: false,
  },
  loginLocation: {
    country: { type: String },
    city: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  securityFlags: {
    suspicious: { type: Boolean, default: false },
    suspiciousReason: { type: String },
    blocked: { type: Boolean, default: false },
    blockedReason: { type: String },
  },
}, {
  timestamps: true,
});

// インデックス
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ userId: 1, deviceInfo: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // 自動削除
SessionSchema.index({ lastActivity: -1 });

// 有効期限チェック（インスタンスメソッド）
SessionSchema.methods.isExpired = function(): boolean {
  return this.expiresAt < new Date();
};

// アクティビティ更新（インスタンスメソッド）
SessionSchema.methods.updateActivity = function(): Promise<ISession> {
  this.lastActivity = new Date();
  return this.save();
};

// セッション無効化（インスタンスメソッド）
SessionSchema.methods.invalidate = function(reason?: string): Promise<ISession> {
  this.isActive = false;
  if (reason) {
    this.securityFlags.blocked = true;
    this.securityFlags.blockedReason = reason;
  }
  return this.save();
};

// 不審なアクティビティチェック（静的メソッド）
SessionSchema.statics.checkSuspiciousActivity = async function(
  userId: string,
  newDeviceInfo: any
): Promise<boolean> {
  // 最近のセッションを取得
  const recentSessions = await this.find({
    userId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24時間以内
  }).sort({ createdAt: -1 }).limit(5);

  // 短時間に複数の異なるIPからのログイン
  const uniqueIPs = new Set(recentSessions.map((s: ISession) => s.deviceInfo.ipAddress));
  if (uniqueIPs.size >= 3) {
    return true; // 不審
  }

  // 異なる国からの同時アクセス
  const uniqueCountries = new Set(
    recentSessions
      .filter((s: ISession) => s.loginLocation?.country)
      .map((s: ISession) => s.loginLocation!.country)
  );
  if (uniqueCountries.size >= 2) {
    return true; // 不審
  }

  return false;
};

// アクティブセッション数取得（静的メソッド）
SessionSchema.statics.getActiveSessionCount = async function(userId: string): Promise<number> {
  return this.countDocuments({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });
};

// 古いセッション削除（静的メソッド）
SessionSchema.statics.cleanupOldSessions = async function(userId: string, keepCount: number = 5) {
  const sessions = await this.find({ userId, isActive: true })
    .sort({ lastActivity: -1 })
    .skip(keepCount);
  
  const sessionIds = sessions.map((s: ISession) => s._id);
  if (sessionIds.length > 0) {
    await this.updateMany(
      { _id: { $in: sessionIds } },
      { $set: { isActive: false } }
    );
  }
};

const Session: Model<ISession> = 
  mongoose.models.Session || 
  mongoose.model<ISession>('Session', SessionSchema);

export default Session;