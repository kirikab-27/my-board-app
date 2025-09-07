/**
 * 2段階認証（2FA）モデル
 * Issue #53: 2FA管理者ログインシステム
 */

import mongoose, { Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface ITwoFactorAuth extends Document {
  userId: mongoose.Types.ObjectId;
  secret: string;
  backupCodes: string[];
  isEnabled: boolean;
  lastUsedBackupCode?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TwoFactorAuthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  secret: {
    type: String,
    required: true,
  },
  backupCodes: [{
    type: String,
    required: true,
  }],
  isEnabled: {
    type: Boolean,
    default: false,
  },
  lastUsedBackupCode: {
    type: String,
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// インデックス
TwoFactorAuthSchema.index({ userId: 1, isEnabled: 1 });
TwoFactorAuthSchema.index({ createdAt: -1 });

// バックアップコード生成（静的メソッド）
TwoFactorAuthSchema.statics.generateBackupCodes = function(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // 8文字のランダムコード生成（英数字大文字）
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
};

// バックアップコード検証（インスタンスメソッド）
TwoFactorAuthSchema.methods.verifyBackupCode = function(code: string): boolean {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  const index = this.backupCodes.findIndex((c: string) => 
    c.toUpperCase().replace(/\s+/g, '') === normalizedCode
  );
  
  if (index !== -1) {
    // 使用済みバックアップコードを削除
    this.backupCodes.splice(index, 1);
    this.lastUsedBackupCode = normalizedCode;
    return true;
  }
  
  return false;
};

// シークレット暗号化（保存前）
TwoFactorAuthSchema.pre('save', function(next) {
  if (this.isModified('secret') && !this.secret.startsWith('encrypted:')) {
    // 簡易暗号化（本番環境では環境変数からキーを取得）
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key';
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(this.secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    this.secret = `encrypted:${encrypted}`;
  }
  next();
});

// シークレット復号化（取得時）
TwoFactorAuthSchema.methods.getDecryptedSecret = function(): string {
  if (!this.secret.startsWith('encrypted:')) {
    return this.secret;
  }
  
  const encryptedSecret = this.secret.replace('encrypted:', '');
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key';
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const TwoFactorAuth: Model<ITwoFactorAuth> = 
  mongoose.models.TwoFactorAuth || 
  mongoose.model<ITwoFactorAuth>('TwoFactorAuth', TwoFactorAuthSchema);

export default TwoFactorAuth;