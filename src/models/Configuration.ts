import mongoose, { Document, Schema, Model } from 'mongoose';
import crypto from 'crypto';

/**
 * Configuration model for system settings
 * Issue #61: System Configuration Management
 */

// Encryption key from environment variable
const ENCRYPTION_KEY =
  process.env.CONFIG_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

export interface IConfiguration extends Document {
  key: string;
  value: any;
  environment: 'development' | 'staging' | 'production';
  description?: string;
  isEncrypted: boolean;
  isSecret: boolean;
  isLocked: boolean;
  category?: string;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
  dependencies?: string[];
  lastModified: Date;
  modifiedBy: string;
  version: number;
  history: Array<{
    value: any;
    modifiedAt: Date;
    modifiedBy: string;
    version: number;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface IConfigurationMethods {
  encrypt(): void;
  decrypt(): any;
  validate(): boolean;
  incrementVersion(): void;
  addToHistory(modifiedBy: string, reason?: string): void;
}

interface IConfigurationModel extends Model<IConfiguration & IConfigurationMethods> {
  findByEnvironment(environment: string): Promise<IConfiguration[]>;
  findByKey(key: string, environment: string): Promise<IConfiguration | null>;
  updateValue(
    key: string,
    value: any,
    environment: string,
    modifiedBy: string
  ): Promise<IConfiguration>;
  bulkUpdate(configs: any[], environment: string, modifiedBy: string): Promise<void>;
  getDecrypted(key: string, environment: string): Promise<any>;
  createDefault(): Promise<void>;
}

const ConfigurationSchema = new Schema<IConfiguration & IConfigurationMethods>(
  {
    key: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    environment: {
      type: String,
      required: true,
      enum: ['development', 'staging', 'production'],
      index: true,
    },
    description: {
      type: String,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: 'general',
    },
    dataType: {
      type: String,
      required: true,
      enum: ['string', 'number', 'boolean', 'object', 'array'],
      default: 'string',
    },
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      enum: [Schema.Types.Mixed],
    },
    dependencies: [
      {
        type: String,
      },
    ],
    lastModified: {
      type: Date,
      default: Date.now,
    },
    modifiedBy: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    history: [
      {
        value: Schema.Types.Mixed,
        modifiedAt: Date,
        modifiedBy: String,
        version: Number,
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound unique index
ConfigurationSchema.index({ key: 1, environment: 1 }, { unique: true });

// Instance methods
ConfigurationSchema.methods.encrypt = function () {
  if (this.isSecret && !this.isEncrypted) {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(JSON.stringify(this.value), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    this.value = {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
    this.isEncrypted = true;
  }
};

ConfigurationSchema.methods.decrypt = function () {
  if (this.isEncrypted && this.value.encrypted) {
    try {
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const iv = Buffer.from(this.value.iv, 'hex');
      const authTag = Buffer.from(this.value.authTag, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(this.value.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }
  return this.value;
};

ConfigurationSchema.methods.validate = function () {
  if (!this.validation) return true;

  const value = this.isEncrypted ? this.decrypt() : this.value;

  if (this.validation.min !== undefined && value < this.validation.min) {
    return false;
  }

  if (this.validation.max !== undefined && value > this.validation.max) {
    return false;
  }

  if (this.validation.pattern) {
    const regex = new RegExp(this.validation.pattern);
    if (!regex.test(value)) {
      return false;
    }
  }

  if (this.validation.enum && !this.validation.enum.includes(value)) {
    return false;
  }

  return true;
};

ConfigurationSchema.methods.incrementVersion = function () {
  this.version = (this.version || 0) + 1;
};

ConfigurationSchema.methods.addToHistory = function (modifiedBy: string, reason?: string) {
  if (!this.history) {
    this.history = [];
  }

  // Keep only last 50 history entries
  if (this.history.length >= 50) {
    this.history.shift();
  }

  this.history.push({
    value: this.value,
    modifiedAt: new Date(),
    modifiedBy,
    version: this.version,
    reason,
  });
};

// Static methods
ConfigurationSchema.statics.findByEnvironment = async function (environment: string) {
  return this.find({ environment }).sort({ key: 1 });
};

ConfigurationSchema.statics.findByKey = async function (key: string, environment: string) {
  return this.findOne({ key, environment });
};

ConfigurationSchema.statics.updateValue = async function (
  key: string,
  value: any,
  environment: string,
  modifiedBy: string
) {
  const config = await this.findOne({ key, environment });

  if (!config) {
    throw new Error(`Configuration ${key} not found in ${environment}`);
  }

  if (config.isLocked && environment === 'production') {
    throw new Error(`Configuration ${key} is locked in production`);
  }

  // Save to history
  config.addToHistory(modifiedBy, 'Updated via admin panel');

  // Update value
  config.value = value;
  config.modifiedBy = modifiedBy;
  config.lastModified = new Date();
  config.incrementVersion();

  // Encrypt if secret
  if (config.isSecret) {
    config.encrypt();
  }

  // Validate
  if (!config.validate()) {
    throw new Error(`Validation failed for ${key}`);
  }

  await config.save();
  return config;
};

ConfigurationSchema.statics.bulkUpdate = async function (
  configs: any[],
  environment: string,
  modifiedBy: string
) {
  const operations = configs.map((config) => ({
    updateOne: {
      filter: { key: config.key, environment },
      update: {
        $set: {
          value: config.value,
          description: config.description,
          isSecret: config.isSecret,
          isLocked: config.isLocked,
          category: config.category,
          dataType: config.dataType,
          validation: config.validation,
          dependencies: config.dependencies,
          modifiedBy,
          lastModified: new Date(),
          $inc: { version: 1 },
        },
      },
      upsert: true,
    },
  }));

  await this.bulkWrite(operations);
};

ConfigurationSchema.statics.getDecrypted = async function (key: string, environment: string) {
  const config = await this.findOne({ key, environment });
  if (!config) return null;

  return config.isEncrypted ? config.decrypt() : config.value;
};

ConfigurationSchema.statics.createDefault = async function () {
  const defaultConfigs = [
    {
      key: 'app.name',
      value: 'My Board App',
      environment: 'development',
      description: 'アプリケーション名',
      category: 'general',
      dataType: 'string',
      modifiedBy: 'system',
    },
    {
      key: 'app.version',
      value: '1.0.0',
      environment: 'development',
      description: 'アプリケーションバージョン',
      category: 'general',
      dataType: 'string',
      modifiedBy: 'system',
    },
    {
      key: 'session.timeout',
      value: 3600,
      environment: 'development',
      description: 'セッションタイムアウト（秒）',
      category: 'security',
      dataType: 'number',
      validation: { min: 300, max: 86400 },
      modifiedBy: 'system',
    },
    {
      key: 'rate_limit.max_requests',
      value: 100,
      environment: 'development',
      description: 'レート制限：最大リクエスト数',
      category: 'security',
      dataType: 'number',
      validation: { min: 10, max: 1000 },
      modifiedBy: 'system',
    },
    {
      key: 'features.enable_2fa',
      value: true,
      environment: 'development',
      description: '2要素認証の有効化',
      category: 'features',
      dataType: 'boolean',
      modifiedBy: 'system',
    },
    {
      key: 'features.enable_social_login',
      value: true,
      environment: 'development',
      description: 'ソーシャルログインの有効化',
      category: 'features',
      dataType: 'boolean',
      modifiedBy: 'system',
    },
    {
      key: 'email.smtp_host',
      value: 'smtp.example.com',
      environment: 'development',
      description: 'SMTPサーバーホスト',
      category: 'email',
      dataType: 'string',
      isSecret: true,
      modifiedBy: 'system',
    },
    {
      key: 'maintenance.mode',
      value: false,
      environment: 'development',
      description: 'メンテナンスモード',
      category: 'maintenance',
      dataType: 'boolean',
      modifiedBy: 'system',
    },
  ];

  // Create default configs for all environments
  const environments = ['development', 'staging', 'production'];

  for (const env of environments) {
    for (const config of defaultConfigs) {
      const exists = await this.findOne({ key: config.key, environment: env });
      if (!exists) {
        await this.create({ ...config, environment: env });
      }
    }
  }
};

// Pre-save middleware for encryption
ConfigurationSchema.pre('save', function (next) {
  if (this.isSecret && !this.isEncrypted) {
    this.encrypt();
  }
  next();
});

// Export the model
const Configuration =
  (mongoose.models.Configuration as IConfigurationModel) ||
  mongoose.model<IConfiguration & IConfigurationMethods, IConfigurationModel>(
    'Configuration',
    ConfigurationSchema
  );

export default Configuration;
