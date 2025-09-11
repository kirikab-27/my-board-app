/**
 * セキュリティ監査ログモデル
 * Issue #55: 監査ログシステム
 * セキュリティイベントの記録と分析（HMAC-SHA256改ざん防止機能付き）
 */

import mongoose from 'mongoose';
import crypto from 'crypto';

export interface IAuditLog extends mongoose.Document {
  _id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;

  // 改ざん防止フィールド（Issue #55追加）
  hash: string; // 現在のレコードのHMAC-SHA256ハッシュ
  previousHash?: string; // 前のレコードのハッシュ（チェーン構造）
  signature?: string; // デジタル署名（重要ログ用）

  // アーカイブ管理（Issue #55追加）
  archived: boolean; // アーカイブ済みフラグ
  archivedAt?: Date; // アーカイブ日時
  retentionDate: Date; // 保持期限（7年）

  createdAt: Date;
  updatedAt: Date;

  // インスタンスメソッド
  generateHash(): string;
  verifyHash(): boolean;
  generateSignature(): string;
}

export interface IAuditLogModel extends mongoose.Model<IAuditLog> {
  getSecuritySummary(days?: number): Promise<any[]>;
  getTopThreats(days?: number): Promise<any[]>;
  verifyChain(startDate?: Date, endDate?: Date): Promise<{ valid: boolean; brokenAt?: string }>;
  detectAnomalies(userId: string, timeWindow?: number): Promise<IAuditLog[]>;
  archiveOldLogs(daysOld?: number): Promise<number>;
}

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'PERMISSION_DENIED'
  | 'XSS_ATTEMPT'
  | 'CSRF_VIOLATION'
  | 'RATE_LIMIT'
  | 'SUSPICIOUS_ACTIVITY'
  | 'SQL_INJECTION'
  | 'FILE_ACCESS_VIOLATION'
  | 'BRUTE_FORCE'
  | 'ACCOUNT_LOCKOUT'
  | 'UNUSUAL_ACCESS_PATTERN'
  | 'CSP_VIOLATION';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const AuditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    type: {
      type: String,
      enum: [
        'AUTH_FAILURE',
        'PERMISSION_DENIED',
        'XSS_ATTEMPT',
        'CSRF_VIOLATION',
        'RATE_LIMIT',
        'SUSPICIOUS_ACTIVITY',
        'SQL_INJECTION',
        'FILE_ACCESS_VIOLATION',
        'BRUTE_FORCE',
        'ACCOUNT_LOCKOUT',
        'UNUSUAL_ACCESS_PATTERN',
        'CSP_VIOLATION',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    ip: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      required: true,
      maxlength: 500,
    },
    path: {
      type: String,
      required: true,
      maxlength: 200,
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      maxlength: 1000,
      default: null,
    },

    // 改ざん防止フィールド（Issue #55追加）
    hash: {
      type: String,
      required: false, // Pre-save hook will set this
      unique: true,
      index: true,
    },
    previousHash: {
      type: String,
      default: null,
    },
    signature: {
      type: String,
      default: null,
    },

    // アーカイブ管理（Issue #55追加）
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    retentionDate: {
      type: Date,
      required: false, // Pre-save hook will set this
    },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

// インデックスの設定
AuditLogSchema.index({ timestamp: -1 }); // 日時降順
AuditLogSchema.index({ type: 1, severity: 1 }); // タイプ・重要度
AuditLogSchema.index({ ip: 1, timestamp: -1 }); // IP別時系列
AuditLogSchema.index({ userId: 1, timestamp: -1 }); // ユーザー別時系列

// TTLインデックス（7年後に自動削除 - コンプライアンス対応）
AuditLogSchema.index({ retentionDate: 1 }, { expireAfterSeconds: 0 });
AuditLogSchema.index({ archived: 1, timestamp: -1 });

// スタティックメソッド
AuditLogSchema.statics.getSecuritySummary = async function (days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const summary = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          severity: '$severity',
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return summary;
};

AuditLogSchema.statics.getTopThreats = async function (days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const threats = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        severity: { $in: ['HIGH', 'CRITICAL'] },
      },
    },
    {
      $group: {
        _id: '$ip',
        count: { $sum: 1 },
        types: { $addToSet: '$type' },
        lastActivity: { $max: '$timestamp' },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  return threats;
};

// HMAC-SHA256ハッシュ生成（インスタンスメソッド）
AuditLogSchema.methods.generateHash = function (): string {
  const data = {
    timestamp: this.timestamp,
    type: this.type,
    severity: this.severity,
    userId: this.userId,
    ip: this.ip,
    path: this.path,
    method: this.method,
    details: this.details,
    previousHash: this.previousHash,
  };

  const secret = process.env.AUDIT_LOG_SECRET || 'default-audit-secret-key';
  return crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex');
};

// ハッシュ検証（インスタンスメソッド）
AuditLogSchema.methods.verifyHash = function (): boolean {
  const calculatedHash = this.generateHash();
  return calculatedHash === this.hash;
};

// 署名生成（インスタンスメソッド）
AuditLogSchema.methods.generateSignature = function (): string {
  const privateKey = process.env.AUDIT_LOG_PRIVATE_KEY || 'default-private-key';
  const sign = crypto.createSign('SHA256');
  sign.update(this.hash);
  sign.end();
  // 簡易実装（本番環境では適切な鍵管理が必要）
  return crypto.createHmac('sha256', privateKey).update(this.hash).digest('hex');
};

// チェーン検証（静的メソッド）
AuditLogSchema.statics.verifyChain = async function (
  startDate?: Date,
  endDate?: Date
): Promise<{ valid: boolean; brokenAt?: string }> {
  const query: any = {};
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  const logs = await this.find(query).sort({ timestamp: 1 }).select('hash previousHash timestamp');

  for (let i = 1; i < logs.length; i++) {
    if (logs[i].previousHash !== logs[i - 1].hash) {
      return {
        valid: false,
        brokenAt: logs[i]._id.toString(),
      };
    }
  }

  return { valid: true };
};

// 異常検知（静的メソッド）
AuditLogSchema.statics.detectAnomalies = async function (
  userId: string,
  timeWindow: number = 3600000 // 1時間
): Promise<IAuditLog[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindow);

  const recentLogs = await this.find({
    userId,
    timestamp: { $gte: windowStart },
  }).sort({ timestamp: -1 });

  const anomalies: IAuditLog[] = [];

  // 異常パターンのチェック
  const failedAttempts = recentLogs.filter(
    (l: IAuditLog) => l.severity === 'HIGH' || l.severity === 'CRITICAL'
  ).length;
  if (failedAttempts > 5) {
    anomalies.push(...recentLogs.slice(0, 5));
  }

  return anomalies;
};

// アーカイブ処理（静的メソッド）
AuditLogSchema.statics.archiveOldLogs = async function (daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.updateMany(
    {
      timestamp: { $lt: cutoffDate },
      archived: false,
    },
    {
      $set: {
        archived: true,
        archivedAt: new Date(),
      },
    }
  );

  return result.modifiedCount;
};

// 保存前フック（ハッシュ生成）
AuditLogSchema.pre('save', async function (next) {
  // detailsのデフォルト値を設定
  if (!this.details) {
    this.details = {};
  }

  if (this.isNew) {
    // timestampのデフォルト値
    if (!this.timestamp) {
      this.timestamp = new Date();
    }

    // 前のログのハッシュを取得
    const previousLog = await mongoose
      .model('AuditLog')
      .findOne()
      .sort({ timestamp: -1 })
      .select('hash');

    if (previousLog) {
      this.previousHash = previousLog.hash;
    }

    // 保持期限を設定（7年）
    this.retentionDate = new Date(this.timestamp.getTime() + 7 * 365 * 24 * 60 * 60 * 1000);

    // ハッシュを生成
    this.hash = this.generateHash();

    // 重要なログには署名を生成
    if (this.severity === 'CRITICAL' || this.type === 'PERMISSION_DENIED') {
      this.signature = this.generateSignature();
    }
  }
  next();
});

export default (mongoose.models.AuditLog as unknown as IAuditLogModel) ||
  mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', AuditLogSchema);
