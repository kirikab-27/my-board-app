/**
 * セキュア環境変数ローダー
 * Issue #52: 環境変数・秘密鍵管理システム
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { SecretsVault } from '../encryption/vault';
import { SecretsCipher } from '../encryption/cipher';

export interface EnvironmentConfig {
  [key: string]: string;
}

export class SecureEnvLoader {
  private vault: SecretsVault;
  private environment: string;
  private config: EnvironmentConfig = {};
  private encryptedKeys: Set<string> = new Set();

  constructor(environment?: string) {
    this.vault = new SecretsVault();
    this.environment = environment || process.env.NODE_ENV || 'development';
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    await this.vault.initialize();
    console.log(`📦 環境変数ローダーを初期化しました (環境: ${this.environment})`);
  }

  /**
   * 環境変数をロード
   */
  async load(options: {
    filePath?: string;
    encrypted?: boolean;
    override?: boolean;
  } = {}): Promise<EnvironmentConfig> {
    const {
      filePath = this.getDefaultEnvPath(),
      encrypted = false,
      override = false,
    } = options;

    try {
      // ファイルから環境変数を読み込み
      if (encrypted) {
        await this.loadEncryptedFile(filePath);
      } else {
        await this.loadPlainFile(filePath);
      }

      // Vaultから環境別の秘密情報を取得
      const vaultSecrets = await this.vault.getAllByEnvironment(this.environment);
      
      // マージ（Vaultの値を優先）
      this.config = { ...this.config, ...vaultSecrets };

      // process.envに適用
      if (override) {
        this.applyToProcess();
      }

      console.log(`✅ 環境変数をロードしました (${Object.keys(this.config).length}個)`);
      return this.config;
    } catch (error) {
      console.error('❌ 環境変数のロードに失敗しました:', error);
      throw error;
    }
  }

  /**
   * 平文の.envファイルを読み込み
   */
  private async loadPlainFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = dotenv.parse(content);
      this.config = { ...this.config, ...parsed };
    } catch (error) {
      // ファイルが存在しない場合は無視
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * 暗号化された.env.vaultファイルを読み込み
   */
  private async loadEncryptedFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const vaultData = JSON.parse(content);

      // マスターキーを取得
      const masterKey = process.env.DOTENV_KEY || process.env.ENCRYPTION_MASTER_KEY;
      if (!masterKey) {
        throw new Error('暗号化キーが設定されていません (DOTENV_KEY or ENCRYPTION_MASTER_KEY)');
      }

      // 各環境の設定を復号化
      if (vaultData[this.environment]) {
        const encryptedData = vaultData[this.environment];
        const decrypted = SecretsCipher.decrypt(encryptedData, masterKey);
        const parsed = dotenv.parse(decrypted);
        this.config = { ...this.config, ...parsed };

        // 暗号化されたキーを記録
        Object.keys(parsed).forEach(key => this.encryptedKeys.add(key));
      }
    } catch (error) {
      // ファイルが存在しない場合は無視
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * 環境変数を暗号化して保存
   */
  async saveEncrypted(options: {
    outputPath?: string;
    keys?: string[];
  } = {}): Promise<void> {
    const {
      outputPath = '.env.vault',
      keys,
    } = options;

    // マスターキーを取得または生成
    let masterKey = process.env.DOTENV_KEY || process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKey) {
      masterKey = SecretsCipher.generateSecureKey(32);
      console.log('🔑 新しい暗号化キーを生成しました:');
      console.log(`DOTENV_KEY="${masterKey}"`);
    }

    // 保存する設定を選択
    const configToSave = keys
      ? Object.fromEntries(
          Object.entries(this.config).filter(([key]) => keys.includes(key))
        )
      : this.config;

    // 環境変数を文字列に変換
    const envString = Object.entries(configToSave)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');

    // 暗号化
    const encrypted = SecretsCipher.encrypt(envString, masterKey);

    // 既存のvaultファイルを読み込み（存在する場合）
    let vaultData: any = {};
    try {
      const existing = await fs.readFile(outputPath, 'utf8');
      vaultData = JSON.parse(existing);
    } catch {
      // ファイルが存在しない場合は新規作成
    }

    // 現在の環境の設定を更新
    vaultData[this.environment] = encrypted;

    // ファイルに保存
    await fs.writeFile(
      outputPath,
      JSON.stringify(vaultData, null, 2),
      { mode: 0o600 }
    );

    console.log(`✅ 環境変数を暗号化して保存しました: ${outputPath}`);
  }

  /**
   * 特定の環境変数を取得
   */
  get(key: string): string | undefined {
    return this.config[key];
  }

  /**
   * 特定の環境変数を設定
   */
  set(key: string, value: string): void {
    this.config[key] = value;
  }

  /**
   * 環境変数をVaultに保存
   */
  async storeInVault(
    key: string,
    value: string,
    options: {
      category?: string;
      description?: string;
      userId?: string;
    } = {}
  ): Promise<void> {
    await this.vault.store(key, value, {
      environment: this.environment,
      ...options,
      encrypt: true,
    });
    
    // ローカルキャッシュも更新
    this.config[key] = value;
    this.encryptedKeys.add(key);
  }

  /**
   * process.envに適用
   */
  private applyToProcess(): void {
    Object.entries(this.config).forEach(([key, value]) => {
      if (!process.env[key] || process.env[key] !== value) {
        process.env[key] = value;
      }
    });
  }

  /**
   * デフォルトの環境変数ファイルパスを取得
   */
  private getDefaultEnvPath(): string {
    const envFiles = [
      `.env.${this.environment}.local`,
      `.env.${this.environment}`,
      '.env.local',
      '.env',
    ];

    // 最初に見つかったファイルを使用
    for (const file of envFiles) {
      const filePath = path.join(process.cwd(), file);
      try {
        // ファイルの存在確認（同期的）
        require('fs').accessSync(filePath);
        return filePath;
      } catch {
        continue;
      }
    }

    return path.join(process.cwd(), '.env');
  }

  /**
   * 環境変数の検証
   */
  validate(requiredKeys: string[]): { valid: boolean; missing: string[] } {
    const missing = requiredKeys.filter(key => !this.config[key]);
    
    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * 環境変数のマスク表示（ログ用）
   */
  getMasked(): Record<string, string> {
    const masked: Record<string, string> = {};
    
    Object.entries(this.config).forEach(([key, value]) => {
      // 暗号化されたキーまたはセンシティブなキーはマスク
      if (
        this.encryptedKeys.has(key) ||
        key.includes('SECRET') ||
        key.includes('KEY') ||
        key.includes('PASSWORD') ||
        key.includes('TOKEN')
      ) {
        masked[key] = value.substring(0, 4) + '****' + value.substring(value.length - 4);
      } else {
        masked[key] = value;
      }
    });
    
    return masked;
  }

  /**
   * 環境変数のエクスポート（バックアップ用）
   */
  async export(options: {
    outputPath?: string;
    format?: 'json' | 'env';
    includeSecrets?: boolean;
  } = {}): Promise<void> {
    const {
      outputPath = `backup-${this.environment}-${Date.now()}.env`,
      format = 'env',
      includeSecrets = false,
    } = options;

    const dataToExport = includeSecrets ? this.config : this.getMasked();

    let content: string;
    if (format === 'json') {
      content = JSON.stringify(dataToExport, null, 2);
    } else {
      content = Object.entries(dataToExport)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n');
    }

    await fs.writeFile(outputPath, content, { mode: 0o600 });
    console.log(`✅ 環境変数をエクスポートしました: ${outputPath}`);
  }
}

export default SecureEnvLoader;