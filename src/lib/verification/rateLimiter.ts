/**
 * レート制限システム
 * 
 * 🛡️ 多層防御アプローチ:
 * - IP ベースレート制限
 * - メールベースレート制限
 * - セッションベースレート制限
 * - 動的制限（リスクスコアベース）
 * - 分散環境対応（Redis対応予定）
 */

import { connectDB } from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';
import VerificationAttempt from '@/models/VerificationAttempt';

/**
 * レート制限設定
 */
export interface RateLimitConfig {
  windowSizeMs: number;    // 時間窓（ミリ秒）
  maxRequests: number;     // 最大リクエスト数
  blockDurationMs: number; // ブロック期間（ミリ秒）
}

/**
 * レート制限結果
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  blockedUntil?: Date;
  reason?: string;
  riskScore?: number;
}

/**
 * レート制限チェック要求
 */
export interface RateLimitRequest {
  identifier: string;
  type: 'ip' | 'email' | 'session';
  action: 'generate' | 'verify' | 'resend';
  metadata?: {
    userAgent?: string;
    riskScore?: number;
    previousViolations?: number;
  };
}

/**
 * レート制限管理クラス
 */
export class RateLimiter {
  
  // デフォルト設定
  private static readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    // IP ベース制限
    'ip:generate': {
      windowSizeMs: 60 * 60 * 1000, // 1時間
      maxRequests: 10,
      blockDurationMs: 30 * 60 * 1000, // 30分
    },
    'ip:verify': {
      windowSizeMs: 10 * 60 * 1000, // 10分
      maxRequests: 20,
      blockDurationMs: 15 * 60 * 1000, // 15分
    },
    'ip:resend': {
      windowSizeMs: 10 * 60 * 1000, // 10分
      maxRequests: 5,
      blockDurationMs: 30 * 60 * 1000, // 30分
    },
    
    // メールベース制限
    'email:generate': {
      windowSizeMs: 60 * 60 * 1000, // 1時間
      maxRequests: 5,
      blockDurationMs: 60 * 60 * 1000, // 1時間
    },
    'email:verify': {
      windowSizeMs: 60 * 60 * 1000, // 1時間
      maxRequests: 10,
      blockDurationMs: 30 * 60 * 1000, // 30分
    },
    'email:resend': {
      windowSizeMs: 30 * 60 * 1000, // 30分
      maxRequests: 3,
      blockDurationMs: 60 * 60 * 1000, // 1時間
    },
    
    // セッションベース制限（厳格）
    'session:generate': {
      windowSizeMs: 30 * 60 * 1000, // 30分
      maxRequests: 3,
      blockDurationMs: 60 * 60 * 1000, // 1時間
    },
    'session:verify': {
      windowSizeMs: 10 * 60 * 1000, // 10分
      maxRequests: 5,
      blockDurationMs: 30 * 60 * 1000, // 30分
    },
    'session:resend': {
      windowSizeMs: 20 * 60 * 1000, // 20分
      maxRequests: 2,
      blockDurationMs: 60 * 60 * 1000, // 1時間
    },
  };
  
  /**
   * レート制限チェック
   */
  static async checkRateLimit(request: RateLimitRequest): Promise<RateLimitResult> {
    try {
      await connectDB();
      
      const configKey = `${request.type}:${request.action}`;
      const config = this.DEFAULT_CONFIGS[configKey];
      
      if (!config) {
        console.warn(`⚠️ レート制限設定が見つかりません: ${configKey}`);
        return {
          allowed: true,
          remaining: 999,
          resetAt: new Date(Date.now() + 60 * 60 * 1000),
        };
      }
      
      // リスクスコアベース調整
      const adjustedConfig = this.adjustConfigByRisk(config, request.metadata?.riskScore || 0);
      
      // 現在の使用量を取得
      const usage = await this.getCurrentUsage(request, adjustedConfig.windowSizeMs);
      
      // ブロック状態チェック
      const blockCheck = await this.checkActiveBlocks(request);
      if (blockCheck.isBlocked) {
        console.warn(`🚫 レート制限ブロック中: ${request.identifier} (${request.type}:${request.action})`);
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(Date.now() + adjustedConfig.windowSizeMs),
          blockedUntil: blockCheck.blockedUntil,
          reason: blockCheck.reason,
        };
      }
      
      const remaining = adjustedConfig.maxRequests - usage.count;
      const allowed = remaining > 0;
      
      // 制限超過時の処理
      if (!allowed) {
        await this.recordViolation(request, adjustedConfig);
        console.warn(`⚠️ レート制限超過: ${request.identifier} (${request.type}:${request.action}) - ${usage.count}/${adjustedConfig.maxRequests}`);
        
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(Date.now() + adjustedConfig.windowSizeMs),
          blockedUntil: new Date(Date.now() + adjustedConfig.blockDurationMs),
          reason: 'Rate limit exceeded',
          riskScore: request.metadata?.riskScore,
        };
      }
      
      return {
        allowed: true,
        remaining: remaining - 1, // 次回使用を考慮
        resetAt: new Date(Date.now() + adjustedConfig.windowSizeMs),
      };
      
    } catch (error) {
      console.error('❌ レート制限チェックエラー:', error);
      // エラー時は安全側に倒して制限
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60 * 60 * 1000),
        reason: 'Rate limit check failed',
      };
    }
  }
  
  /**
   * 複数レート制限チェック（IP + メール）
   */
  static async checkMultipleRateLimits(
    ipAddress: string,
    email: string,
    action: 'generate' | 'verify' | 'resend',
    metadata?: any
  ): Promise<{
    allowed: boolean;
    violations: Array<{ type: string; result: RateLimitResult }>;
    mostRestrictive: RateLimitResult;
  }> {
    const checks = [
      { type: 'ip', request: { identifier: ipAddress, type: 'ip' as const, action, metadata } },
      { type: 'email', request: { identifier: email.toLowerCase(), type: 'email' as const, action, metadata } },
    ];
    
    const results = await Promise.all(
      checks.map(async (check) => ({
        type: check.type,
        result: await this.checkRateLimit(check.request),
      }))
    );
    
    const violations = results.filter(r => !r.result.allowed);
    const allowed = violations.length === 0;
    
    // 最も制限的な結果を選択
    const mostRestrictive = results.reduce((most, current) => 
      (current.result.remaining < most.result.remaining) ? current : most
    ).result;
    
    return {
      allowed,
      violations,
      mostRestrictive,
    };
  }
  
  /**
   * リスクスコアによる設定調整
   */
  private static adjustConfigByRisk(config: RateLimitConfig, riskScore: number): RateLimitConfig {
    if (riskScore < 30) {
      return config; // 通常設定
    }
    
    // 高リスク時は制限を厳しく
    const riskMultiplier = Math.min(riskScore / 100, 0.8); // 最大80%削減
    
    return {
      windowSizeMs: config.windowSizeMs,
      maxRequests: Math.max(1, Math.floor(config.maxRequests * (1 - riskMultiplier))),
      blockDurationMs: Math.floor(config.blockDurationMs * (1 + riskMultiplier)),
    };
  }
  
  /**
   * 現在の使用量取得
   */
  private static async getCurrentUsage(
    request: RateLimitRequest,
    windowSizeMs: number
  ): Promise<{
    count: number;
    oldestRequestAt?: Date;
    latestRequestAt?: Date;
  }> {
    const windowStart = new Date(Date.now() - windowSizeMs);
    
    if (request.action === 'generate' || request.action === 'resend') {
      // 生成・再送信の場合は VerificationCode を参照
      const query = request.type === 'ip' 
        ? { ipAddress: request.identifier }
        : request.type === 'email'
        ? { email: request.identifier }
        : { 'metadata.sessionId': request.identifier };
      
      const codes = await VerificationCode.find({
        ...query,
        createdAt: { $gte: windowStart },
      }).sort({ createdAt: 1 });
      
      return {
        count: codes.length,
        oldestRequestAt: codes[0]?.createdAt,
        latestRequestAt: codes[codes.length - 1]?.createdAt,
      };
      
    } else {
      // 検証の場合は VerificationAttempt を参照
      const query = request.type === 'ip' 
        ? { ipAddress: request.identifier }
        : request.type === 'email'
        ? { email: request.identifier }
        : { sessionId: request.identifier };
      
      const attempts = await VerificationAttempt.find({
        ...query,
        timestamp: { $gte: windowStart },
      }).sort({ timestamp: 1 });
      
      return {
        count: attempts.length,
        oldestRequestAt: attempts[0]?.timestamp,
        latestRequestAt: attempts[attempts.length - 1]?.timestamp,
      };
    }
  }
  
  /**
   * アクティブブロックチェック
   */
  private static async checkActiveBlocks(request: RateLimitRequest): Promise<{
    isBlocked: boolean;
    blockedUntil?: Date;
    reason?: string;
  }> {
    // データベースからブロック情報を取得する実装
    // 現在はメモリベースの簡易実装
    // TODO: MongoDB コレクション 'RateLimit Blocks' を作成
    
    return {
      isBlocked: false,
    };
  }
  
  /**
   * 制限違反記録
   */
  private static async recordViolation(
    request: RateLimitRequest,
    config: RateLimitConfig
  ): Promise<void> {
    // 制限違反をログに記録
    console.warn(`🚫 レート制限違反記録: ${request.identifier} (${request.type}:${request.action})`, {
      config,
      timestamp: new Date().toISOString(),
      userAgent: request.metadata?.userAgent,
      riskScore: request.metadata?.riskScore,
    });
    
    // TODO: 違反情報をデータベースに保存
    // await RateLimitViolation.create({ ... });
  }
  
  /**
   * 制限リセット（管理者用）
   */
  static async resetRateLimit(
    identifier: string,
    type: 'ip' | 'email' | 'session',
    adminUser: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await connectDB();
      
      console.log(`🔄 レート制限リセット: ${identifier} (${type}) by ${adminUser}`);
      
      // 関連するレコードを削除またはリセット
      if (type === 'ip') {
        await VerificationCode.deleteMany({ ipAddress: identifier });
        await VerificationAttempt.deleteMany({ ipAddress: identifier });
      } else if (type === 'email') {
        await VerificationCode.deleteMany({ email: identifier.toLowerCase() });
        await VerificationAttempt.deleteMany({ email: identifier.toLowerCase() });
      }
      
      return {
        success: true,
        message: `Rate limit reset for ${type}: ${identifier}`,
      };
      
    } catch (error) {
      console.error('❌ レート制限リセットエラー:', error);
      return {
        success: false,
        message: 'Failed to reset rate limit',
      };
    }
  }
  
  /**
   * レート制限統計取得
   */
  static async getRateLimitStats(hours: number = 24): Promise<{
    totalRequests: number;
    blockedRequests: number;
    topBlockedIPs: Array<{ ip: string; count: number }>;
    topBlockedEmails: Array<{ email: string; count: number }>;
    hourlyBreakdown: Array<{ hour: number; requests: number; blocked: number }>;
  }> {
    try {
      await connectDB();
      
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      // 総リクエスト数
      const totalRequests = await VerificationAttempt.countDocuments({
        timestamp: { $gte: cutoff },
      });
      
      // ブロック数（rate_limitedの結果）
      const blockedRequests = await VerificationAttempt.countDocuments({
        timestamp: { $gte: cutoff },
        result: 'rate_limited',
      });
      
      // トップブロックIP
      const topBlockedIPs = await VerificationAttempt.aggregate([
        {
          $match: {
            timestamp: { $gte: cutoff },
            result: 'rate_limited',
          },
        },
        {
          $group: {
            _id: '$ipAddress',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            ip: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ]);
      
      // トップブロックメール
      const topBlockedEmails = await VerificationAttempt.aggregate([
        {
          $match: {
            timestamp: { $gte: cutoff },
            result: 'rate_limited',
          },
        },
        {
          $group: {
            _id: '$email',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            email: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ]);
      
      // 時間別統計
      const hourlyBreakdown = await VerificationAttempt.aggregate([
        {
          $match: {
            timestamp: { $gte: cutoff },
          },
        },
        {
          $group: {
            _id: {
              hour: { $hour: '$timestamp' },
              blocked: { $eq: ['$result', 'rate_limited'] },
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.hour',
            requests: {
              $sum: {
                $cond: [{ $eq: ['$_id.blocked', false] }, '$count', 0],
              },
            },
            blocked: {
              $sum: {
                $cond: [{ $eq: ['$_id.blocked', true] }, '$count', 0],
              },
            },
          },
        },
        {
          $project: {
            hour: '$_id',
            requests: { $add: ['$requests', '$blocked'] },
            blocked: 1,
            _id: 0,
          },
        },
        {
          $sort: { hour: 1 },
        },
      ]);
      
      return {
        totalRequests,
        blockedRequests,
        topBlockedIPs,
        topBlockedEmails,
        hourlyBreakdown,
      };
      
    } catch (error) {
      console.error('❌ レート制限統計取得エラー:', error);
      throw error;
    }
  }
}

export default RateLimiter;