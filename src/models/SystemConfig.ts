import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

// 設定の環境タイプ
export type Environment = 'development' | 'staging' | 'production';

// 設定の値タイプ
export type ConfigValueType = string | number | boolean | object | null;

// 設定項目のインターフェース
export interface ISystemConfig extends Document {
  key: string; // 設定キー（例: 'MAX_UPLOAD_SIZE'）
  value: ConfigValueType; // 設定値
  encryptedValue?: string; // 暗号化された値（秘密情報用）
  description: string; // 設定の説明
  category: string; // カテゴリー（例: 'security', 'email', 'features'）
  environment: Environment; // 環境（development/staging/production）
  dataType: string; // データ型（'string', 'number', 'boolean', 'json'）
  isSecret: boolean; // 秘密情報かどうか
  isHotReloadable: boolean; // ホットリロード可能かどうか
  validationRules?: object; // バリデーションルール
  defaultValue?: ConfigValueType; // デフォルト値
  allowedValues?: ConfigValueType[]; // 許可される値のリスト
  dependencies?: string[]; // 依存する他の設定
  lastModifiedBy: string; // 最終更新者
  lastModifiedAt: Date; // 最終更新日時
  version: number; // バージョン番号（変更履歴用）
  isActive: boolean; // 有効/無効フラグ
  metadata?: object; // その他のメタデータ
  createdAt: Date;
  updatedAt: Date;
}

// 設定変更履歴のインターフェース
export interface IConfigHistory extends Document {
  configId: mongoose.Types.ObjectId;
  key: string;
  previousValue: ConfigValueType;
  newValue: ConfigValueType;
  environment: Environment;
  changedBy: string;
  changeReason?: string;
  changeType: 'create' | 'update' | 'delete' | 'rollback';
  version: number;
  timestamp: Date;
  metadata?: object;
}

// 暗号化キー（環境変数から取得、なければデフォルト）
const ENCRYPTION_KEY =
  process.env.CONFIG_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

// 暗号化関数
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(64);
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 2145, 32, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

// 復号化関数
function decrypt(encryptedData: string): string {
  const bData = Buffer.from(encryptedData, 'base64');
  const salt = bData.subarray(0, 64);
  const iv = bData.subarray(64, 80);
  const tag = bData.subarray(80, 96);
  const text = bData.subarray(96);

  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 2145, 32, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(text) + decipher.final('utf8');
}

// システム設定スキーマ
const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    key: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      default: null,
    },
    encryptedValue: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      required: true,
      index: true,
    },
    dataType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'json'],
      required: true,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    isHotReloadable: {
      type: Boolean,
      default: false,
    },
    validationRules: {
      type: Schema.Types.Mixed,
    },
    defaultValue: {
      type: Schema.Types.Mixed,
    },
    allowedValues: [
      {
        type: Schema.Types.Mixed,
      },
    ],
    dependencies: [
      {
        type: String,
      },
    ],
    lastModifiedBy: {
      type: String,
      required: true,
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// 複合インデックス（環境とキーの組み合わせでユニーク）
SystemConfigSchema.index({ key: 1, environment: 1 }, { unique: true });

// 設定値の暗号化（保存前）
SystemConfigSchema.pre('save', function (next) {
  if (this.isSecret && this.value) {
    const valueStr = typeof this.value === 'string' ? this.value : JSON.stringify(this.value);
    this.encryptedValue = encrypt(valueStr);
    this.value = null; // 平文は保存しない
  }
  next();
});

// 設定値の復号化（取得時）
SystemConfigSchema.methods.getDecryptedValue = function (): ConfigValueType {
  if (this.isSecret && this.encryptedValue) {
    const decrypted = decrypt(this.encryptedValue);

    // データ型に応じて変換
    switch (this.dataType) {
      case 'json':
        return JSON.parse(decrypted);
      case 'number':
        return Number(decrypted);
      case 'boolean':
        return decrypted === 'true';
      default:
        return decrypted;
    }
  }
  return this.value;
};

// バリデーション
SystemConfigSchema.methods.validate = function (): boolean {
  const value = this.isSecret ? this.getDecryptedValue() : this.value;

  // データ型チェック
  if (this.dataType === 'number' && typeof value !== 'number') {
    return false;
  }
  if (this.dataType === 'boolean' && typeof value !== 'boolean') {
    return false;
  }

  // 許可値チェック
  if (this.allowedValues && this.allowedValues.length > 0) {
    return this.allowedValues.includes(value);
  }

  // カスタムバリデーションルール
  if (this.validationRules) {
    // TODO: カスタムバリデーションロジック実装
  }

  return true;
};

// 設定変更履歴スキーマ
const ConfigHistorySchema = new Schema<IConfigHistory>({
  configId: {
    type: Schema.Types.ObjectId,
    ref: 'SystemConfig',
    required: true,
    index: true,
  },
  key: {
    type: String,
    required: true,
    index: true,
  },
  previousValue: {
    type: Schema.Types.Mixed,
  },
  newValue: {
    type: Schema.Types.Mixed,
  },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    required: true,
    index: true,
  },
  changedBy: {
    type: String,
    required: true,
  },
  changeReason: String,
  changeType: {
    type: String,
    enum: ['create', 'update', 'delete', 'rollback'],
    required: true,
  },
  version: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
});

// TTLインデックス（90日後に自動削除）
ConfigHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const SystemConfig =
  mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
export const ConfigHistory =
  mongoose.models.ConfigHistory ||
  mongoose.model<IConfigHistory>('ConfigHistory', ConfigHistorySchema);
