import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

/**
 * 強化された監査ログモデル（改ざん防止・ハッシュチェーン）
 * Issue #47: enterprise級監査・透明性・改ざん防止
 */

export interface IAuditLogEnhanced extends Document {
  _id: mongoose.Types.ObjectId;
  
  // 基本監査情報
  adminUserId: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  targetId?: mongoose.Types.ObjectId;
  
  // 改ざん防止
  previousHash?: string;
  currentHash: string;
  signature: string;
  sequenceNumber: number;
  
  // 操作詳細
  changes: { before?: any; after?: any; };
  operationResult: 'success' | 'failure' | 'partial';
  
  // セッション情報
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  
  // タイムスタンプ
  timestamp: Date;
  ttl: Date;
}

const AuditLogEnhancedSchema = new Schema<IAuditLogEnhanced>({
  adminUserId: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resource: {
    type: String,
    required: true,
    enum: ['users', 'posts', 'system', 'admins'],
    index: true
  },
  targetId: Schema.Types.ObjectId,
  
  // 改ざん防止
  previousHash: String,
  currentHash: {
    type: String,
    required: true,
    unique: true
  },
  signature: {
    type: String,
    required: true
  },
  sequenceNumber: {
    type: Number,
    required: true,
    index: true
  },
  
  changes: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed
  },
  operationResult: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    required: true
  },
  
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: String,
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ttl: {
    type: Date,
    default: function() {
      const ttl = new Date();
      ttl.setDate(ttl.getDate() + 90);
      return ttl;
    },
    index: { expireAfterSeconds: 0 }
  }
});

// ハッシュチェーン実装
AuditLogEnhancedSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastLog = await this.model('AuditLogEnhanced')
      .findOne({}, {}, { sort: { sequenceNumber: -1 } });
    
    this.sequenceNumber = (lastLog?.sequenceNumber || 0) + 1;
    if (lastLog) this.previousHash = lastLog.currentHash;
    
    // ハッシュ計算
    const data = JSON.stringify({
      adminUserId: this.adminUserId,
      action: this.action,
      resource: this.resource,
      targetId: this.targetId,
      changes: this.changes,
      timestamp: this.timestamp,
      sequenceNumber: this.sequenceNumber,
      previousHash: this.previousHash
    });
    
    this.currentHash = crypto.createHash('sha256').update(data).digest('hex');
    
    // HMAC署名
    const secret = process.env.AUDIT_LOG_SECRET || 'change-in-production';
    this.signature = crypto.createHmac('sha256', secret).update(this.currentHash).digest('hex');
  }
  next();
});

export default mongoose.models.AuditLogEnhanced || 
  mongoose.model<IAuditLogEnhanced>('AuditLogEnhanced', AuditLogEnhancedSchema);