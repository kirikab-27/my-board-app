import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

/**
 * 管理者セッション管理モデル
 * Issue #47: セッション制限・JWT管理・セキュリティ強化
 */

export interface IAdminSession extends Document {
  _id: mongoose.Types.ObjectId;
  
  // セッション基本情報
  adminUserId: mongoose.Types.ObjectId;
  sessionToken: string;         // JWT ID
  refreshToken: string;         // リフレッシュトークン
  
  // セキュリティ情報
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;    // デバイス識別
  
  // ライフサイクル
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;              // JWT期限（24時間）
  refreshExpiresAt: Date;       // リフレッシュ期限（7日）
  
  // セッション状態
  isActive: boolean;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revokedReason?: string;
  
  // セキュリティイベント
  loginAttempts: number;        // ログイン試行回数
  lastFailedAt?: Date;
  suspiciousActivity: boolean;
  
  // メソッド
  generateTokens(): { sessionToken: string; refreshToken: string; };
  isExpired(): boolean;
  canRefresh(): boolean;
  revoke(reason: string, revokedBy?: mongoose.Types.ObjectId): Promise<void>;
}

const AdminSessionSchema = new Schema<IAdminSession>({
  // セッション基本情報
  adminUserId: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true,
    index: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
    select: false  // 通常クエリでは除外
  },
  
  // セキュリティ情報
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  deviceFingerprint: {
    type: String,
    required: true,
    index: true
  },
  
  // ライフサイクル
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  refreshExpiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  
  // セッション状態
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  revokedAt: Date,
  revokedBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  revokedReason: String,
  
  // セキュリティ
  loginAttempts: {
    type: Number,
    default: 1,
    min: 0
  },
  lastFailedAt: Date,
  suspiciousActivity: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: false  // カスタムタイムスタンプ使用
});

// 複合インデックス
AdminSessionSchema.index({ adminUserId: 1, isActive: 1 });
AdminSessionSchema.index({ sessionToken: 1, isActive: 1 });
AdminSessionSchema.index({ ipAddress: 1, createdAt: -1 });

// インスタンスメソッド
AdminSessionSchema.methods.generateTokens = function() {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  
  this.sessionToken = sessionToken;
  this.refreshToken = refreshToken;
  
  return { sessionToken, refreshToken };
};

AdminSessionSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

AdminSessionSchema.methods.canRefresh = function(): boolean {
  return !this.isExpired() && new Date() < this.refreshExpiresAt && this.isActive;
};

AdminSessionSchema.methods.revoke = async function(
  reason: string, 
  revokedBy?: mongoose.Types.ObjectId
): Promise<void> {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  if (revokedBy) this.revokedBy = revokedBy;
  
  await this.save();
  
  // AdminUserのアクティブセッション数を減算
  await mongoose.models.AdminUser.findByIdAndUpdate(
    this.adminUserId,
    { $inc: { activeSessions: -1 } }
  );
};

// スタティックメソッド
AdminSessionSchema.statics.cleanupExpiredSessions = async function() {
  const expiredSessions = await this.find({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { refreshExpiresAt: { $lt: new Date() } }
    ],
    isActive: true
  });

  for (const session of expiredSessions) {
    await session.revoke('expired', null);
  }
  
  return expiredSessions.length;
};

AdminSessionSchema.statics.revokeUserSessions = async function(
  adminUserId: mongoose.Types.ObjectId,
  reason: string = 'admin_action'
) {
  const sessions = await this.find({ 
    adminUserId, 
    isActive: true 
  });
  
  for (const session of sessions) {
    await session.revoke(reason);
  }
  
  return sessions.length;
};

export default mongoose.models.AdminSession || mongoose.model<IAdminSession>('AdminSession', AdminSessionSchema);