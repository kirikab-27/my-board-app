import { connectDB } from '@/lib/mongodb';
import VerificationCode, { VerificationType } from '@/models/VerificationCode';
import VerificationAttempt, { AttemptResult } from '@/models/VerificationAttempt';
import { SecureCodeGenerator } from '@/lib/crypto/secureRandom';

/**
 * 認証コード生成・管理サービス
 *
 * 🔐 セキュリティ要件:
 * - 暗号学的に安全な6桁コード生成
 * - レート制限（IP + メールベース）
 * - ブルートフォース攻撃対策
 * - タイミング攻撃対策
 * - 重複防止・自動クリーンアップ
 */

export interface CodeGenerationRequest {
  email: string;
  type: VerificationType;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface CodeVerificationRequest {
  email: string;
  code: string;
  type: VerificationType;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
}

export interface CodeGenerationResult {
  success: boolean;
  code?: string;
  expiresAt?: Date;
  error?: string;
  rateLimit?: {
    remaining: number;
    resetAt: Date;
  };
}

export interface CodeVerificationResult {
  success: boolean;
  error?: string;
  attempts?: number;
  lockedUntil?: Date;
  riskScore?: number;
}

export class VerificationCodeService {
  private static readonly MAX_EMAIL_CODES_PER_HOUR = 5;
  private static readonly MAX_IP_CODES_PER_HOUR = 10;
  private static readonly MAX_VERIFICATION_ATTEMPTS = 3;
  private static readonly LOCKOUT_DURATION_MINUTES = 15;

  /**
   * 認証コード生成
   */
  static async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    const startTime = Date.now();

    try {
      await connectDB();

      // レート制限チェック
      const rateLimitCheck = await this.checkRateLimit(request.email, request.ipAddress);
      if (!rateLimitCheck.allowed) {
        console.warn(`⚠️ レート制限: ${request.email} (IP: ${request.ipAddress})`);
        return {
          success: false,
          error: 'レート制限に達しました。しばらく待ってから再試行してください。',
          rateLimit: {
            remaining: 0,
            resetAt: rateLimitCheck.resetAt,
          },
        };
      }

      // 既存の未使用コードをクリーンアップ
      await this.cleanupUserCodes(request.email, request.type);

      // 重複チェック用関数
      const isDuplicate = async (code: string): Promise<boolean> => {
        try {
          const existing = await VerificationCode.findOne({
            code,
            type: request.type,
            used: false,
            expiresAt: { $gt: new Date() },
          }).exec();
          return !!existing;
        } catch (error) {
          console.error('重複チェックエラー:', error);
          return false;
        }
      };

      // 暗号学的に安全な一意コード生成
      const code = await SecureCodeGenerator.generateUniqueCode(isDuplicate);

      // コード保存
      const verificationCode = new VerificationCode({
        email: request.email.toLowerCase(),
        code,
        type: request.type,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        metadata: {
          ...request.metadata,
          sessionId: request.sessionId,
          generationTime: Date.now() - startTime,
        },
      });

      await verificationCode.save();

      console.log(`✅ 認証コード生成: ${request.email} (${request.type})`);

      return {
        success: true,
        code,
        expiresAt: verificationCode.expiresAt,
        rateLimit: {
          remaining: rateLimitCheck.remaining - 1,
          resetAt: rateLimitCheck.resetAt,
        },
      };
    } catch (error) {
      const err = error as Error;
      console.error('❌ 認証コード生成エラー:', {
        email: request.email,
        type: request.type,
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: '認証コードの生成に失敗しました',
      };
    }
  }

  /**
   * 認証コード検証
   */
  static async verifyCode(request: CodeVerificationRequest): Promise<CodeVerificationResult> {
    const startTime = Date.now();

    try {
      await connectDB();

      // 固定レスポンス時間でタイミング攻撃を防ぐ
      const minResponseTime = 500; // 500ms最低待機

      // メール形式の基本検証
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        await this.enforceMinResponseTime(startTime, minResponseTime);
        await this.logAttempt(request, 'invalid_code', Date.now() - startTime);
        return { success: false, error: 'Invalid request' };
      }

      // コード形式検証
      if (!/^[0-9]{6}$/.test(request.code)) {
        await this.enforceMinResponseTime(startTime, minResponseTime);
        await this.logAttempt(request, 'invalid_code', Date.now() - startTime);
        return { success: false, error: 'Invalid code format' };
      }

      // 該当コードを検索
      const verificationCode = await VerificationCode.findOne({
        email: request.email.toLowerCase(),
        type: request.type,
      })
        .sort({ createdAt: -1 })
        .exec(); // 最新のコードを取得

      if (!verificationCode) {
        await this.enforceMinResponseTime(startTime, minResponseTime);
        await this.logAttempt(request, 'invalid_code', Date.now() - startTime);
        return { success: false, error: 'Invalid code' };
      }

      // 使用済みチェック
      if (verificationCode.used) {
        await this.enforceMinResponseTime(startTime, minResponseTime);
        await this.logAttempt(request, 'used', Date.now() - startTime);
        return { success: false, error: 'Code already used' };
      }

      // 有効期限チェック
      if (verificationCode.isExpired()) {
        await this.enforceMinResponseTime(startTime, minResponseTime);
        await this.logAttempt(request, 'expired', Date.now() - startTime);
        return { success: false, error: 'Code expired' };
      }

      // ロック状態チェック
      if (verificationCode.isLocked()) {
        await this.enforceMinResponseTime(startTime, minResponseTime);
        await this.logAttempt(request, 'locked', Date.now() - startTime);
        return {
          success: false,
          error: 'Account temporarily locked',
          lockedUntil: verificationCode.lockedUntil,
        };
      }

      // コード一致確認（定数時間比較）
      const isValidCode = this.constantTimeCompare(request.code, verificationCode.code);

      if (!isValidCode) {
        // 試行回数を増やす
        verificationCode.incrementAttempts();
        await verificationCode.save();

        await this.enforceMinResponseTime(startTime, minResponseTime);
        await this.logAttempt(request, 'invalid_code', Date.now() - startTime);

        return {
          success: false,
          error:
            verificationCode.attempts >= 3
              ? 'Account locked due to multiple failures'
              : 'Invalid code',
          attempts: verificationCode.attempts,
          lockedUntil: verificationCode.lockedUntil,
        };
      }

      // 認証成功
      verificationCode.markAsUsed();
      await verificationCode.save();

      await this.enforceMinResponseTime(startTime, minResponseTime);
      await this.logAttempt(request, 'success', Date.now() - startTime);

      console.log(`✅ 認証コード検証成功: ${request.email} (${request.type})`);

      return {
        success: true,
        attempts: verificationCode.attempts,
      };
    } catch (error) {
      const err = error as Error;
      console.error('❌ 認証コード検証エラー:', {
        email: request.email,
        type: request.type,
        error: err.message,
        duration: Date.now() - startTime,
      });

      // エラー時も固定時間を守る
      await this.enforceMinResponseTime(startTime, 500);

      return {
        success: false,
        error: 'Verification failed',
      };
    }
  }

  /**
   * 認証コード再送信
   */
  static async resendCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    // 既存コードを無効化
    await this.invalidateUserCodes(request.email, request.type);

    // 新しいコードを生成
    return this.generateCode(request);
  }

  /**
   * レート制限チェック
   */
  private static async checkRateLimit(
    email: string,
    ipAddress: string
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // メールベースの制限チェック
    const emailCount = await VerificationCode.countDocuments({
      email: email.toLowerCase(),
      createdAt: { $gte: oneHourAgo },
    });

    // IPベースの制限チェック
    const ipCount = await VerificationCode.countDocuments({
      ipAddress,
      createdAt: { $gte: oneHourAgo },
    });

    const emailExceeded = emailCount >= this.MAX_EMAIL_CODES_PER_HOUR;
    const ipExceeded = ipCount >= this.MAX_IP_CODES_PER_HOUR;

    if (emailExceeded || ipExceeded) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60 * 60 * 1000),
      };
    }

    return {
      allowed: true,
      remaining: Math.min(
        this.MAX_EMAIL_CODES_PER_HOUR - emailCount,
        this.MAX_IP_CODES_PER_HOUR - ipCount
      ),
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }

  /**
   * 試行ログ記録
   */
  private static async logAttempt(
    request: CodeVerificationRequest,
    result: AttemptResult,
    responseTime: number
  ): Promise<void> {
    try {
      const attempt = new VerificationAttempt({
        email: request.email.toLowerCase(),
        type: request.type,
        attemptedCode: request.code,
        result,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        responseTime,
        sessionId: request.sessionId,
      });

      await attempt.save();
    } catch (error) {
      console.error('❌ 試行ログ記録エラー:', error);
    }
  }

  /**
   * ユーザーの未使用コードをクリーンアップ
   */
  private static async cleanupUserCodes(email: string, type: VerificationType): Promise<void> {
    await VerificationCode.deleteMany({
      email: email.toLowerCase(),
      type,
      used: false,
    }).exec();
  }

  /**
   * ユーザーの全コードを無効化
   */
  private static async invalidateUserCodes(email: string, type: VerificationType): Promise<void> {
    await VerificationCode.updateMany(
      {
        email: email.toLowerCase(),
        type,
        used: false,
      },
      {
        used: true,
        usedAt: new Date(),
      }
    ).exec();
  }

  /**
   * 定数時間文字列比較（タイミング攻撃対策）
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * 最小レスポンス時間の強制（タイミング攻撃対策）
   */
  private static async enforceMinResponseTime(startTime: number, minTime: number): Promise<void> {
    const elapsed = Date.now() - startTime;
    const remaining = minTime - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }

  /**
   * 期限切れコードの定期クリーンアップ
   */
  static async cleanupExpiredCodes(): Promise<{
    deletedCount: number;
    executionTime: number;
  }> {
    const startTime = Date.now();

    try {
      const result = await (VerificationCode as any).cleanupExpired();
      const executionTime = Date.now() - startTime;

      console.log(`🧹 期限切れコード削除: ${result.deletedCount}件 (${executionTime}ms)`);

      return {
        deletedCount: result.deletedCount,
        executionTime,
      };
    } catch (error) {
      console.error('❌ クリーンアップエラー:', error);
      return {
        deletedCount: 0,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 統計情報取得
   */
  static async getStatistics(hours: number = 24): Promise<{
    totalGenerated: number;
    totalVerified: number;
    successRate: number;
    averageAttempts: number;
    topFailureReasons: Array<{ reason: string; count: number }>;
  }> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const generated = await VerificationCode.countDocuments({
        createdAt: { $gte: cutoff },
      });

      const verified = await VerificationCode.countDocuments({
        createdAt: { $gte: cutoff },
        used: true,
      });

      const attempts = await VerificationAttempt.aggregate([
        { $match: { timestamp: { $gte: cutoff } } },
        {
          $group: {
            _id: '$result',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const totalAttempts = attempts.reduce((sum, item) => sum + item.count, 0);
      const successRate = totalAttempts > 0 ? verified / totalAttempts : 0;

      return {
        totalGenerated: generated,
        totalVerified: verified,
        successRate,
        averageAttempts: totalAttempts / Math.max(generated, 1),
        topFailureReasons: attempts
          .filter((item) => item._id !== 'success')
          .map((item) => ({
            reason: item._id,
            count: item.count,
          })),
      };
    } catch (error) {
      console.error('❌ 統計取得エラー:', error);
      throw error;
    }
  }
}

export default VerificationCodeService;
