/**
 * セキュリティ監査ログモデル
 * セキュリティイベントの記録と分析
 */

import mongoose from 'mongoose';

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
  createdAt: Date;
  updatedAt: Date;
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

const AuditLogSchema = new mongoose.Schema<IAuditLog>({
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
      'CSP_VIOLATION'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
    index: true
  },
  userId: {
    type: String,
    default: null,
    index: true
  },
  ip: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true,
    maxlength: 500
  },
  path: {
    type: String,
    required: true,
    maxlength: 200
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: null
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// インデックスの設定
AuditLogSchema.index({ timestamp: -1 }); // 日時降順
AuditLogSchema.index({ type: 1, severity: 1 }); // タイプ・重要度
AuditLogSchema.index({ ip: 1, timestamp: -1 }); // IP別時系列
AuditLogSchema.index({ userId: 1, timestamp: -1 }); // ユーザー別時系列

// TTLインデックス（90日後に自動削除）
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// スタティックメソッド
AuditLogSchema.statics.getSecuritySummary = async function(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const summary = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          severity: '$severity'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return summary;
};

AuditLogSchema.statics.getTopThreats = async function(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const threats = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        severity: { $in: ['HIGH', 'CRITICAL'] }
      }
    },
    {
      $group: {
        _id: '$ip',
        count: { $sum: 1 },
        types: { $addToSet: '$type' },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);
  
  return threats;
};

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);