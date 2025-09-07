/**
 * 秘密情報保管庫システム
 * Issue #52: 環境変数・秘密鍵管理システム
 */

import { SecretsCipher } from './cipher';
import { KeyManager } from './keyManager';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// 秘密情報のスキーマ
const SecretSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: String,
    required: true,
  },
  metadata: {
    encrypted: String,
    salt: String,
    iv: String,
    tag: String,
  },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production', 'all'],
    default: 'all',
  },
  category: {
    type: String,
    enum: ['api_key', 'database', 'auth', 'email', 'payment', 'other'],
    default: 'other',
  },
  description: String,
  rotationPolicy: {
    enabled: { type: Boolean, default: false },
    intervalDays: { type: Number, default: 90 },
    lastRotated: Date,
    nextRotation: Date,
  },
  accessLog: [{
    userId: String,
    action: {
      type: String,
      enum: ['read', 'write', 'update', 'delete', 'rotate'],
    },
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
  }],
  createdBy: String,
  updatedBy: String,
}, {
  timestamps: true,
});

// 仮想フィールド: 暗号化されているかどうか
SecretSchema.virtual('isEncrypted').get(function() {
  return !!this.metadata?.encrypted;
});

const Secret = mongoose.models.Secret || mongoose.model('Secret', SecretSchema);

export class SecretsVault {
  private keyManager: KeyManager;
  private cache: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分

  constructor() {
    this.keyManager = KeyManager.getInstance();
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    await connectDB();
    await this.keyManager.initialize();
  }

  /**
   * 秘密情報を保存
   */
  async store(
    key: string,
    value: string,
    options: {
      environment?: string;
      category?: string;
      description?: string;
      userId?: string;
      ipAddress?: string;
      encrypt?: boolean;
    } = {}
  ): Promise<void> {
    const { encrypt = true, userId, ipAddress, ...metadata } = options;

    let secretData: any = {
      key,
      value,
      ...metadata,
      createdBy: userId,
      updatedBy: userId,
    };

    // 暗号化が有効な場合
    if (encrypt) {
      const masterKey = this.keyManager.getMasterKey();
      const encrypted = SecretsCipher.encrypt(value, masterKey);
      
      secretData = {
        ...secretData,
        value: '', // 平文は保存しない
        metadata: encrypted,
      };
    }

    // アクセスログを追加
    const accessLog = {
      userId,
      action: 'write',
      ipAddress,
      timestamp: new Date(),
    };

    // MongoDBに保存
    await Secret.findOneAndUpdate(
      { key },
      {
        $set: secretData,
        $push: { accessLog },
      },
      { upsert: true, new: true }
    );

    // キャッシュをクリア
    this.cache.delete(key);

    console.log(`✅ 秘密情報を保存しました: ${key} (暗号化: ${encrypt})`);
  }

  /**
   * 秘密情報を取得
   */
  async retrieve(
    key: string,
    options: {
      userId?: string;
      ipAddress?: string;
      decrypt?: boolean;
    } = {}
  ): Promise<string | null> {
    const { decrypt = true, userId, ipAddress } = options;

    // キャッシュチェック
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    // データベースから取得
    const secret = await Secret.findOne({ key });
    
    if (!secret) {
      return null;
    }

    // アクセスログを記録
    await Secret.updateOne(
      { key },
      {
        $push: {
          accessLog: {
            userId,
            action: 'read',
            ipAddress,
            timestamp: new Date(),
          },
        },
      }
    );

    let value = secret.value;

    // 暗号化されている場合は復号化
    if (secret.isEncrypted && decrypt) {
      const masterKey = this.keyManager.getMasterKey();
      value = SecretsCipher.decrypt(secret.metadata, masterKey);
    }

    // キャッシュに保存
    this.cache.set(key, { value, timestamp: Date.now() });

    return value;
  }

  /**
   * 秘密情報を更新
   */
  async update(
    key: string,
    value: string,
    options: {
      userId?: string;
      ipAddress?: string;
      encrypt?: boolean;
    } = {}
  ): Promise<void> {
    const { encrypt = true, userId, ipAddress } = options;

    const existing = await Secret.findOne({ key });
    if (!existing) {
      throw new Error(`秘密情報が見つかりません: ${key}`);
    }

    let updateData: any = {
      value,
      updatedBy: userId,
    };

    // 暗号化が有効な場合
    if (encrypt) {
      const masterKey = this.keyManager.getMasterKey();
      const encrypted = SecretsCipher.encrypt(value, masterKey);
      
      updateData = {
        value: '', // 平文は保存しない
        metadata: encrypted,
        updatedBy: userId,
      };
    }

    // 更新とログ記録
    await Secret.findOneAndUpdate(
      { key },
      {
        $set: updateData,
        $push: {
          accessLog: {
            userId,
            action: 'update',
            ipAddress,
            timestamp: new Date(),
          },
        },
      }
    );

    // キャッシュをクリア
    this.cache.delete(key);

    console.log(`✅ 秘密情報を更新しました: ${key}`);
  }

  /**
   * 秘密情報を削除
   */
  async delete(
    key: string,
    options: {
      userId?: string;
      ipAddress?: string;
    } = {}
  ): Promise<void> {
    const { userId, ipAddress } = options;

    // 削除前にログを記録
    await Secret.updateOne(
      { key },
      {
        $push: {
          accessLog: {
            userId,
            action: 'delete',
            ipAddress,
            timestamp: new Date(),
          },
        },
      }
    );

    // 削除実行
    await Secret.deleteOne({ key });

    // キャッシュをクリア
    this.cache.delete(key);

    console.log(`✅ 秘密情報を削除しました: ${key}`);
  }

  /**
   * 環境別の秘密情報を一括取得
   */
  async getAllByEnvironment(environment: string): Promise<Record<string, string>> {
    const secrets = await Secret.find({
      $or: [
        { environment },
        { environment: 'all' },
      ],
    });

    const result: Record<string, string> = {};
    const masterKey = this.keyManager.getMasterKey();

    for (const secret of secrets) {
      let value = secret.value;
      
      // 暗号化されている場合は復号化
      if (secret.isEncrypted) {
        value = SecretsCipher.decrypt(secret.metadata, masterKey);
      }
      
      result[secret.key] = value;
    }

    return result;
  }

  /**
   * 秘密情報のローテーション
   */
  async rotate(
    key: string,
    newValue: string,
    options: {
      userId?: string;
      ipAddress?: string;
    } = {}
  ): Promise<void> {
    const { userId, ipAddress } = options;

    // 現在の値をバックアップ
    const current = await this.retrieve(key, { decrypt: false });
    if (current) {
      // バックアップキーで保存
      await this.store(
        `${key}.backup.${Date.now()}`,
        current,
        {
          category: 'other',
          description: `Backup of ${key} before rotation`,
          userId,
        }
      );
    }

    // 新しい値で更新
    await this.update(key, newValue, { userId, ipAddress, encrypt: true });

    // ローテーション情報を更新
    await Secret.updateOne(
      { key },
      {
        $set: {
          'rotationPolicy.lastRotated': new Date(),
          'rotationPolicy.nextRotation': new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        $push: {
          accessLog: {
            userId,
            action: 'rotate',
            ipAddress,
            timestamp: new Date(),
          },
        },
      }
    );

    console.log(`✅ 秘密情報をローテーションしました: ${key}`);
  }

  /**
   * アクセスログを取得
   */
  async getAccessLog(key: string, limit: number = 100): Promise<any[]> {
    const secret = await Secret.findOne({ key });
    if (!secret) {
      return [];
    }

    return secret.accessLog
      .slice(-limit)
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
  }

  /**
   * 統計情報を取得
   */
  async getStatistics(): Promise<{
    totalSecrets: number;
    encryptedSecrets: number;
    byCategory: Record<string, number>;
    byEnvironment: Record<string, number>;
    recentAccess: any[];
    rotationDue: any[];
  }> {
    const [
      totalSecrets,
      encryptedSecrets,
      byCategory,
      byEnvironment,
      rotationDue,
    ] = await Promise.all([
      Secret.countDocuments(),
      Secret.countDocuments({ 'metadata.encrypted': { $exists: true } }),
      Secret.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Secret.aggregate([
        { $group: { _id: '$environment', count: { $sum: 1 } } },
      ]),
      Secret.find({
        'rotationPolicy.enabled': true,
        'rotationPolicy.nextRotation': { $lte: new Date() },
      }).select('key rotationPolicy'),
    ]);

    // 最近のアクセスログ
    const recentAccess = await Secret.aggregate([
      { $unwind: '$accessLog' },
      { $sort: { 'accessLog.timestamp': -1 } },
      { $limit: 10 },
      {
        $project: {
          key: 1,
          action: '$accessLog.action',
          userId: '$accessLog.userId',
          timestamp: '$accessLog.timestamp',
        },
      },
    ]);

    return {
      totalSecrets,
      encryptedSecrets,
      byCategory: Object.fromEntries(
        byCategory.map((item: any) => [item._id || 'other', item.count])
      ),
      byEnvironment: Object.fromEntries(
        byEnvironment.map((item: any) => [item._id || 'all', item.count])
      ),
      recentAccess,
      rotationDue,
    };
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ 秘密情報のキャッシュをクリアしました');
  }
}

export default SecretsVault;