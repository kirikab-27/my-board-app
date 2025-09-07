/**
 * 暗号化キー管理システム
 * Issue #52: 環境変数・秘密鍵管理システム
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { SecretsCipher } from './cipher';

export class KeyManager {
  private static instance: KeyManager;
  private masterKey: string | null = null;
  private readonly keyFilePath: string;
  private readonly lockFilePath: string;

  private constructor() {
    // キーファイルのパス設定
    const keyDir = process.env.KEY_STORAGE_PATH || path.join(process.cwd(), '.keys');
    this.keyFilePath = path.join(keyDir, 'master.key.enc');
    this.lockFilePath = path.join(keyDir, '.lock');
  }

  /**
   * シングルトンインスタンスの取得
   */
  static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  /**
   * マスターキーの初期化
   */
  async initialize(): Promise<void> {
    // 環境変数からマスターキーを取得
    const envKey = process.env.ENCRYPTION_MASTER_KEY;
    
    if (envKey) {
      this.masterKey = envKey;
      console.log('✅ マスターキーを環境変数から読み込みました');
      return;
    }

    // キーファイルが存在する場合は読み込み
    try {
      const keyData = await this.loadKeyFile();
      if (keyData) {
        this.masterKey = keyData;
        console.log('✅ マスターキーをファイルから読み込みました');
        return;
      }
    } catch (error) {
      // キーファイルが存在しない場合は新規生成
    }

    // 新しいマスターキーを生成
    await this.generateNewMasterKey();
  }

  /**
   * 新しいマスターキーを生成
   */
  private async generateNewMasterKey(): Promise<void> {
    console.log('🔑 新しいマスターキーを生成中...');
    
    // 256ビットのランダムキーを生成
    const newKey = SecretsCipher.generateSecureKey(32);
    
    // キーを保存
    await this.saveKeyFile(newKey);
    
    this.masterKey = newKey;
    console.log('✅ 新しいマスターキーを生成・保存しました');
    console.log('⚠️  重要: 以下のキーを環境変数 ENCRYPTION_MASTER_KEY に設定してください:');
    console.log(`ENCRYPTION_MASTER_KEY="${newKey}"`);
  }

  /**
   * キーファイルを読み込み
   */
  private async loadKeyFile(): Promise<string | null> {
    try {
      const keyData = await fs.readFile(this.keyFilePath, 'utf8');
      
      // パスフレーズが設定されている場合は復号化
      const passphrase = process.env.KEY_PASSPHRASE;
      if (passphrase) {
        const decrypted = this.decryptWithPassphrase(keyData, passphrase);
        return decrypted;
      }
      
      return keyData;
    } catch (error) {
      return null;
    }
  }

  /**
   * キーファイルを保存
   */
  private async saveKeyFile(key: string): Promise<void> {
    // ディレクトリを作成
    const keyDir = path.dirname(this.keyFilePath);
    await fs.mkdir(keyDir, { recursive: true });
    
    // パスフレーズが設定されている場合は暗号化
    const passphrase = process.env.KEY_PASSPHRASE;
    let dataToSave = key;
    
    if (passphrase) {
      dataToSave = this.encryptWithPassphrase(key, passphrase);
    }
    
    // キーファイルを保存（権限: 600）
    await fs.writeFile(this.keyFilePath, dataToSave, { mode: 0o600 });
    
    // .gitignoreに追加
    await this.updateGitignore();
  }

  /**
   * パスフレーズで暗号化
   */
  private encryptWithPassphrase(data: string, passphrase: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(passphrase, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * パスフレーズで復号化
   */
  private decryptWithPassphrase(encryptedData: string, passphrase: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(passphrase, 'salt', 32);
    
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * .gitignoreを更新
   */
  private async updateGitignore(): Promise<void> {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    
    try {
      let content = await fs.readFile(gitignorePath, 'utf8');
      
      // .keysディレクトリが含まれていない場合は追加
      if (!content.includes('.keys/')) {
        content += '\n# Encryption keys\n.keys/\n*.key\n*.key.enc\n';
        await fs.writeFile(gitignorePath, content);
      }
    } catch (error) {
      // .gitignoreが存在しない場合は作成
      const content = '# Encryption keys\n.keys/\n*.key\n*.key.enc\n';
      await fs.writeFile(gitignorePath, content);
    }
  }

  /**
   * マスターキーを取得
   */
  getMasterKey(): string {
    if (!this.masterKey) {
      throw new Error('マスターキーが初期化されていません');
    }
    return this.masterKey;
  }

  /**
   * キーのローテーション
   */
  async rotateKey(): Promise<string> {
    console.log('🔄 マスターキーをローテーション中...');
    
    // 新しいキーを生成
    const newKey = SecretsCipher.generateSecureKey(32);
    
    // 古いキーをバックアップ
    if (this.masterKey) {
      const backupPath = this.keyFilePath + `.backup.${Date.now()}`;
      await fs.writeFile(backupPath, this.masterKey, { mode: 0o600 });
    }
    
    // 新しいキーを保存
    await this.saveKeyFile(newKey);
    this.masterKey = newKey;
    
    console.log('✅ マスターキーのローテーションが完了しました');
    return newKey;
  }

  /**
   * キーの検証
   */
  validateKey(key: string): boolean {
    // Base64形式の検証
    try {
      const decoded = Buffer.from(key, 'base64');
      return decoded.length >= 32; // 最低256ビット
    } catch {
      return false;
    }
  }
}

export default KeyManager;