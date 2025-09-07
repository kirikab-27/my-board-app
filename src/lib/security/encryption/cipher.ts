/**
 * AES-256暗号化・復号化システム
 * Issue #52: 環境変数・秘密鍵管理システム
 */

import crypto from 'crypto';

export class SecretsCipher {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly ITERATIONS = 100000; // PBKDF2 iterations

  /**
   * マスターキーから派生キーを生成
   */
  private static deriveKey(masterKey: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      masterKey,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * データを暗号化
   */
  static encrypt(plaintext: string, masterKey: string): {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  } {
    // ランダムなソルトとIVを生成
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);

    // 派生キーを生成
    const key = this.deriveKey(masterKey, salt);

    // 暗号化
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // 認証タグを取得
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  /**
   * データを復号化
   */
  static decrypt(
    encryptedData: {
      encrypted: string;
      salt: string;
      iv: string;
      tag: string;
    },
    masterKey: string
  ): string {
    // バッファに変換
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');

    // 派生キーを生成
    const key = this.deriveKey(masterKey, salt);

    // 復号化
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 暗号化されたデータをJSON形式で保存可能な文字列に変換
   */
  static serialize(encryptedData: {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  }): string {
    return JSON.stringify(encryptedData);
  }

  /**
   * JSON文字列から暗号化データを復元
   */
  static deserialize(serialized: string): {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  } {
    return JSON.parse(serialized);
  }

  /**
   * セキュアなランダム文字列を生成（キー生成用）
   */
  static generateSecureKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * ハッシュ化（検証用）
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 定数時間比較（タイミング攻撃対策）
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    
    return crypto.timingSafeEqual(bufferA, bufferB);
  }
}

export default SecretsCipher;