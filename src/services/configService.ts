import {
  SystemConfig,
  ConfigHistory,
  ISystemConfig,
  Environment,
  ConfigValueType,
} from '@/models/SystemConfig';
import EventEmitter from 'events';

// 設定変更イベントエミッター（ホットリロード用）
class ConfigEventEmitter extends EventEmitter {}
const configEmitter = new ConfigEventEmitter();

// 設定キャッシュ
const configCache = new Map<string, { value: ConfigValueType; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分

export class ConfigService {
  private static instance: ConfigService;
  private environment: Environment;

  private constructor() {
    this.environment = (process.env.NODE_ENV as Environment) || 'development';
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // 設定値の取得
  async get(key: string, environment?: Environment): Promise<ConfigValueType> {
    const env = environment || this.environment;
    const cacheKey = `${env}:${key}`;

    // キャッシュチェック
    const cached = configCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    // DBから取得
    const config = await SystemConfig.findOne({ key, environment: env, isActive: true });
    if (!config) {
      return null;
    }

    const value = config.isSecret ? config.getDecryptedValue() : config.value;

    // キャッシュに保存
    configCache.set(cacheKey, { value, timestamp: Date.now() });

    return value;
  }

  // 複数の設定値を一括取得
  async getMultiple(
    keys: string[],
    environment?: Environment
  ): Promise<Record<string, ConfigValueType>> {
    const env = environment || this.environment;
    const configs = await SystemConfig.find({
      key: { $in: keys },
      environment: env,
      isActive: true,
    });

    const result: Record<string, ConfigValueType> = {};
    for (const config of configs) {
      result[config.key] = config.isSecret ? config.getDecryptedValue() : config.value;
    }

    return result;
  }

  // カテゴリー別に設定を取得
  async getByCategory(category: string, environment?: Environment): Promise<ISystemConfig[]> {
    const env = environment || this.environment;
    return SystemConfig.find({
      category,
      environment: env,
      isActive: true,
    });
  }

  // 設定値の更新
  async set(
    key: string,
    value: ConfigValueType,
    options: {
      environment?: Environment;
      changedBy: string;
      changeReason?: string;
      description?: string;
      category?: string;
      dataType?: string;
      isSecret?: boolean;
      isHotReloadable?: boolean;
    }
  ): Promise<ISystemConfig> {
    const env = options.environment || this.environment;

    // 既存の設定を取得
    let config = await SystemConfig.findOne({ key, environment: env });

    if (config) {
      // 履歴を保存
      await this.saveHistory(config, value, options.changedBy, 'update', options.changeReason);

      // 更新
      config.value = value;
      config.lastModifiedBy = options.changedBy;
      config.lastModifiedAt = new Date();
      config.version += 1;

      if (options.description) config.description = options.description;
      if (options.category) config.category = options.category;
      if (options.dataType) config.dataType = options.dataType;
      if (options.isSecret !== undefined) config.isSecret = options.isSecret;
      if (options.isHotReloadable !== undefined) config.isHotReloadable = options.isHotReloadable;
    } else {
      // 新規作成
      config = new SystemConfig({
        key,
        value,
        environment: env,
        description: options.description || `Configuration for ${key}`,
        category: options.category || 'general',
        dataType: options.dataType || this.detectDataType(value),
        isSecret: options.isSecret || false,
        isHotReloadable: options.isHotReloadable || false,
        lastModifiedBy: options.changedBy,
        lastModifiedAt: new Date(),
        version: 1,
        isActive: true,
      });

      // 履歴を保存
      await this.saveHistory(config, value, options.changedBy, 'create', options.changeReason);
    }

    await config.save();

    // キャッシュクリア
    this.clearCache(key, env);

    // ホットリロード可能な場合はイベント発火
    if (config.isHotReloadable) {
      configEmitter.emit('configChanged', { key, value, environment: env });
    }

    return config;
  }

  // 設定の削除
  async delete(key: string, environment: Environment, deletedBy: string): Promise<boolean> {
    const config = await SystemConfig.findOne({ key, environment, isActive: true });
    if (!config) {
      return false;
    }

    // 履歴を保存
    await this.saveHistory(config, null, deletedBy, 'delete');

    // 論理削除
    config.isActive = false;
    config.lastModifiedBy = deletedBy;
    config.lastModifiedAt = new Date();
    await config.save();

    // キャッシュクリア
    this.clearCache(key, environment);

    return true;
  }

  // 設定のロールバック
  async rollback(
    key: string,
    environment: Environment,
    version: number,
    rolledBackBy: string
  ): Promise<ISystemConfig | null> {
    // 履歴から指定バージョンを取得
    const history = await ConfigHistory.findOne({
      key,
      environment,
      version,
    });

    if (!history) {
      return null;
    }

    // 設定を復元
    const config = await this.set(key, history.previousValue, {
      environment,
      changedBy: rolledBackBy,
      changeReason: `Rollback to version ${version}`,
    });

    return config;
  }

  // 設定の検証
  async validate(
    key: string,
    value: ConfigValueType,
    environment?: Environment
  ): Promise<{ valid: boolean; errors: string[] }> {
    const env = environment || this.environment;
    const config = await SystemConfig.findOne({ key, environment: env });

    const errors: string[] = [];

    if (!config) {
      errors.push(`Configuration ${key} not found`);
      return { valid: false, errors };
    }

    // データ型チェック
    const actualType = this.detectDataType(value);
    if (actualType !== config.dataType) {
      errors.push(`Invalid data type. Expected ${config.dataType}, got ${actualType}`);
    }

    // 許可値チェック
    if (config.allowedValues && config.allowedValues.length > 0) {
      if (!config.allowedValues.includes(value)) {
        errors.push(`Value not in allowed list: ${config.allowedValues.join(', ')}`);
      }
    }

    // 依存関係チェック
    if (config.dependencies && config.dependencies.length > 0) {
      for (const dep of config.dependencies) {
        const depConfig = await SystemConfig.findOne({
          key: dep,
          environment: env,
          isActive: true,
        });
        if (!depConfig) {
          errors.push(`Dependency ${dep} is not configured`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // 設定のエクスポート
  async export(environment?: Environment): Promise<Record<string, any>> {
    const env = environment || this.environment;
    const configs = await SystemConfig.find({ environment: env, isActive: true });

    const result: Record<string, any> = {};
    for (const config of configs) {
      if (!config.isSecret) {
        result[config.key] = {
          value: config.value,
          description: config.description,
          category: config.category,
          dataType: config.dataType,
          isHotReloadable: config.isHotReloadable,
          version: config.version,
        };
      }
    }

    return result;
  }

  // 設定のインポート
  async import(
    data: Record<string, any>,
    environment: Environment,
    importedBy: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [key, config] of Object.entries(data)) {
      try {
        await this.set(key, config.value, {
          environment,
          changedBy: importedBy,
          changeReason: 'Imported from backup',
          description: config.description,
          category: config.category,
          dataType: config.dataType,
          isHotReloadable: config.isHotReloadable,
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`Failed to import ${key}: ${error}`);
      }
    }

    return { success, failed, errors };
  }

  // 環境間の差分表示
  async diff(
    env1: Environment,
    env2: Environment
  ): Promise<
    Array<{
      key: string;
      env1Value: ConfigValueType;
      env2Value: ConfigValueType;
      difference: 'missing_in_env1' | 'missing_in_env2' | 'different_value' | 'same';
    }>
  > {
    const configs1 = await SystemConfig.find({ environment: env1, isActive: true });
    const configs2 = await SystemConfig.find({ environment: env2, isActive: true });

    const map1 = new Map(
      configs1.map((c) => [c.key, c.isSecret ? c.getDecryptedValue() : c.value])
    );
    const map2 = new Map(
      configs2.map((c) => [c.key, c.isSecret ? c.getDecryptedValue() : c.value])
    );

    const allKeys = new Set([...map1.keys(), ...map2.keys()]);
    const result = [];

    for (const key of allKeys) {
      const val1 = map1.get(key);
      const val2 = map2.get(key);

      let difference: 'missing_in_env1' | 'missing_in_env2' | 'different_value' | 'same';

      if (val1 === undefined) {
        difference = 'missing_in_env1';
      } else if (val2 === undefined) {
        difference = 'missing_in_env2';
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        difference = 'different_value';
      } else {
        difference = 'same';
      }

      result.push({
        key,
        env1Value: val1,
        env2Value: val2,
        difference,
      });
    }

    return result;
  }

  // ホットリロードリスナー登録
  onConfigChange(
    callback: (data: { key: string; value: ConfigValueType; environment: Environment }) => void
  ): void {
    configEmitter.on('configChanged', callback);
  }

  // ホットリロードリスナー解除
  offConfigChange(
    callback: (data: { key: string; value: ConfigValueType; environment: Environment }) => void
  ): void {
    configEmitter.off('configChanged', callback);
  }

  // プライベートメソッド
  private async saveHistory(
    config: ISystemConfig,
    newValue: ConfigValueType,
    changedBy: string,
    changeType: 'create' | 'update' | 'delete' | 'rollback',
    changeReason?: string
  ): Promise<void> {
    const history = new ConfigHistory({
      configId: config._id,
      key: config.key,
      previousValue: config.value,
      newValue,
      environment: config.environment,
      changedBy,
      changeReason,
      changeType,
      version: config.version,
      timestamp: new Date(),
    });

    await history.save();
  }

  private clearCache(key: string, environment: Environment): void {
    const cacheKey = `${environment}:${key}`;
    configCache.delete(cacheKey);
  }

  private detectDataType(value: ConfigValueType): string {
    if (value === null || value === undefined) return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'object') return 'json';
    return 'string';
  }
}

// シングルトンインスタンスをエクスポート
export const configService = ConfigService.getInstance();
