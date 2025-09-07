/**
 * 2段階認証（2FA）ユーティリティ
 * Issue #53: 2FA管理者ログインシステム
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import TwoFactorAuth from '@/models/TwoFactorAuth';
import { connectDB } from '@/lib/mongodb';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class TwoFactorAuthService {
  /**
   * 2FAセットアップ情報を生成
   */
  static async generateSetup(
    userId: string,
    userEmail: string
  ): Promise<TwoFactorSetup> {
    await connectDB();
    
    // シークレット生成
    const secret = speakeasy.generateSecret({
      name: `BoardApp (${userEmail})`,
      issuer: 'BoardApp Admin',
      length: 32,
    });

    // QRコード生成
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // バックアップコード生成
    const backupCodes = (TwoFactorAuth as any).generateBackupCodes(10);

    // データベースに保存（未検証状態）
    await TwoFactorAuth.findOneAndUpdate(
      { userId },
      {
        userId,
        secret: secret.base32,
        backupCodes,
        isEnabled: false,
        verifiedAt: null,
      },
      { upsert: true, new: true }
    );

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * 2FA有効化（初回検証）
   */
  static async enable(
    userId: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    await connectDB();

    const twoFactor = await TwoFactorAuth.findOne({ userId });
    if (!twoFactor) {
      return { success: false, error: '2FA設定が見つかりません' };
    }

    // トークン検証
    // シークレットの復号化
    let decryptedSecret = twoFactor.secret;
    if (twoFactor.secret.startsWith('encrypted:')) {
      const encryptedSecret = twoFactor.secret.replace('encrypted:', '');
      const key = process.env.ENCRYPTION_KEY || 'default-encryption-key';
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      decryptedSecret = decrypted;
    }
    
    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 2, // 前後2つの時間窓を許容
    });

    if (!isValid) {
      return { success: false, error: '無効な認証コードです' };
    }

    // 2FA有効化
    twoFactor.isEnabled = true;
    twoFactor.verifiedAt = new Date();
    await twoFactor.save();

    return { success: true };
  }

  /**
   * 2FA無効化
   */
  static async disable(userId: string): Promise<void> {
    await connectDB();
    await TwoFactorAuth.findOneAndUpdate(
      { userId },
      { isEnabled: false }
    );
  }

  /**
   * 2FAトークン検証
   */
  static async verifyToken(
    userId: string,
    token: string
  ): Promise<{ success: boolean; isBackupCode?: boolean; error?: string }> {
    await connectDB();

    const twoFactor = await TwoFactorAuth.findOne({ userId, isEnabled: true });
    if (!twoFactor) {
      return { success: false, error: '2FAが有効になっていません' };
    }

    // 通常のTOTPトークン検証
    // シークレットの復号化
    let decryptedSecret = twoFactor.secret;
    if (twoFactor.secret.startsWith('encrypted:')) {
      const encryptedSecret = twoFactor.secret.replace('encrypted:', '');
      const key = process.env.ENCRYPTION_KEY || 'default-encryption-key';
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      decryptedSecret = decrypted;
    }
    
    const isValidToken = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (isValidToken) {
      return { success: true, isBackupCode: false };
    }

    // バックアップコード検証
    const hashedCode = crypto.createHash('sha256').update(token).digest('hex');
    const backupCodeIndex = twoFactor.backupCodes.findIndex(
      code => code === hashedCode
    );
    
    if (backupCodeIndex !== -1) {
      // 使用済みバックアップコードを削除
      twoFactor.backupCodes.splice(backupCodeIndex, 1);
      twoFactor.lastUsedBackupCode = hashedCode;
      await twoFactor.save();
      return { success: true, isBackupCode: true };
    }

    return { success: false, error: '無効な認証コードです' };
  }

  /**
   * 2FA状態確認
   */
  static async isEnabled(userId: string): Promise<boolean> {
    await connectDB();
    const twoFactor = await TwoFactorAuth.findOne({ userId });
    return twoFactor?.isEnabled || false;
  }

  /**
   * バックアップコード再生成
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    await connectDB();

    const twoFactor = await TwoFactorAuth.findOne({ userId });
    if (!twoFactor) {
      throw new Error('2FA設定が見つかりません');
    }

    const newCodes = (TwoFactorAuth as any).generateBackupCodes(10);
    twoFactor.backupCodes = newCodes;
    await twoFactor.save();

    return newCodes;
  }

  /**
   * 残りのバックアップコード数取得
   */
  static async getRemainingBackupCodes(userId: string): Promise<number> {
    await connectDB();
    const twoFactor = await TwoFactorAuth.findOne({ userId });
    return twoFactor?.backupCodes.length || 0;
  }
}

export default TwoFactorAuthService;