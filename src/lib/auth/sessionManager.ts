/**
 * セッション管理サービス
 * Issue #54: セキュアセッション管理システム
 */

import { connectDB } from '@/lib/mongodb';
import Session, { ISession } from '@/models/Session';
import crypto from 'crypto';

export interface SessionConfig {
  maxSessions?: number;           // 最大同時セッション数（デフォルト: 5）
  sessionDuration?: number;        // セッション有効期間（ミリ秒、デフォルト: 24時間）
  allowMultipleDevices?: boolean; // 複数デバイスからのログイン許可
  detectSuspicious?: boolean;      // 不審なアクティビティ検出
}

export class SessionManager {
  private static readonly DEFAULT_MAX_SESSIONS = 5;
  private static readonly DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24時間
  private static readonly ACTIVITY_THRESHOLD = 15 * 60 * 1000; // 15分

  /**
   * 新しいセッションを作成
   */
  static async createSession(
    userId: string,
    deviceInfo: {
      userAgent: string;
      ipAddress: string;
      deviceId?: string;
    },
    config: SessionConfig = {}
  ): Promise<ISession> {
    await connectDB();

    // デバイス情報の解析
    const deviceType = this.detectDeviceType(deviceInfo.userAgent);
    const { browser, os } = this.parseUserAgent(deviceInfo.userAgent);

    // 既存セッション数の確認
    const activeSessionCount = await (Session as any).getActiveSessionCount(userId);
    const maxSessions = config.maxSessions || this.DEFAULT_MAX_SESSIONS;

    // 最大セッション数を超える場合、古いセッションを無効化
    if (activeSessionCount >= maxSessions) {
      await (Session as any).cleanupOldSessions(userId, maxSessions - 1);
    }

    // 不審なアクティビティチェック
    let suspicious = false;
    let suspiciousReason = '';
    
    if (config.detectSuspicious !== false) {
      suspicious = await (Session as any).checkSuspiciousActivity(userId, deviceInfo);
      if (suspicious) {
        suspiciousReason = '短時間に複数の異なる場所からのアクセスを検出';
      }
    }

    // セッショントークン生成
    const sessionToken = this.generateSecureToken();

    // セッション作成
    const session = await Session.create({
      userId,
      sessionToken,
      deviceInfo: {
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        deviceType,
        browser,
        os,
        deviceId: deviceInfo.deviceId,
      },
      expiresAt: new Date(
        Date.now() + (config.sessionDuration || this.DEFAULT_SESSION_DURATION)
      ),
      securityFlags: {
        suspicious,
        suspiciousReason,
      },
    });

    return session;
  }

  /**
   * セッションを検証
   */
  static async validateSession(sessionToken: string): Promise<ISession | null> {
    await connectDB();

    const session = await Session.findOne({
      sessionToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return null;
    }

    // 最終アクティビティを更新（15分ごと）
    const timeSinceLastActivity = Date.now() - session.lastActivity.getTime();
    if (timeSinceLastActivity > this.ACTIVITY_THRESHOLD) {
      session.lastActivity = new Date();
      await session.save();
    }

    return session;
  }

  /**
   * セッションを無効化
   */
  static async invalidateSession(sessionToken: string, reason?: string): Promise<boolean> {
    await connectDB();

    const session = await Session.findOne({ sessionToken });
    if (!session) {
      return false;
    }

    session.isActive = false;
    if (reason) {
      session.securityFlags.blocked = true;
      session.securityFlags.blockedReason = reason;
    }
    await session.save();
    return true;
  }

  /**
   * ユーザーのすべてのセッションを無効化
   */
  static async invalidateAllUserSessions(userId: string, reason?: string): Promise<number> {
    await connectDB();

    const result = await Session.updateMany(
      { userId, isActive: true },
      {
        $set: {
          isActive: false,
          'securityFlags.blocked': true,
          'securityFlags.blockedReason': reason || 'All sessions invalidated',
        },
      }
    );

    return result.modifiedCount;
  }

  /**
   * ユーザーのアクティブセッション一覧取得
   */
  static async getUserSessions(userId: string): Promise<ISession[]> {
    await connectDB();

    return Session.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActivity: -1 });
  }

  /**
   * 特定のデバイスセッションを無効化
   */
  static async invalidateDeviceSession(
    userId: string,
    deviceId: string,
    reason?: string
  ): Promise<boolean> {
    await connectDB();

    const session = await Session.findOne({
      userId,
      'deviceInfo.deviceId': deviceId,
      isActive: true,
    });

    if (!session) {
      return false;
    }

    session.isActive = false;
    if (reason) {
      session.securityFlags.blocked = true;
      session.securityFlags.blockedReason = reason;
    }
    await session.save();
    return true;
  }

  /**
   * セッションの延長
   */
  static async extendSession(
    sessionToken: string,
    duration: number = 24 * 60 * 60 * 1000
  ): Promise<ISession | null> {
    await connectDB();

    const session = await Session.findOne({
      sessionToken,
      isActive: true,
    });

    if (!session) {
      return null;
    }

    session.expiresAt = new Date(Date.now() + duration);
    await session.save();

    return session;
  }

  /**
   * 不審なセッションをブロック
   */
  static async blockSuspiciousSessions(userId: string): Promise<number> {
    await connectDB();

    const result = await Session.updateMany(
      {
        userId,
        isActive: true,
        'securityFlags.suspicious': true,
      },
      {
        $set: {
          isActive: false,
          'securityFlags.blocked': true,
          'securityFlags.blockedReason': 'Suspicious activity detected',
        },
      }
    );

    return result.modifiedCount;
  }

  /**
   * セキュアなトークン生成
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * デバイスタイプ検出
   */
  private static detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    const ua = userAgent.toLowerCase();
    
    if (/tablet|ipad/i.test(ua)) {
      return 'tablet';
    }
    
    if (/mobile|android|iphone|ipod/i.test(ua)) {
      return 'mobile';
    }
    
    if (/windows|mac|linux/i.test(ua)) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  /**
   * UserAgentパース
   */
  private static parseUserAgent(userAgent: string): { browser: string; os: string } {
    const ua = userAgent.toLowerCase();
    
    // ブラウザ検出
    let browser = 'unknown';
    if (ua.includes('edge')) {
      browser = 'Edge';
    } else if (ua.includes('chrome')) {
      browser = 'Chrome';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('opera') || ua.includes('opr')) {
      browser = 'Opera';
    }

    // OS検出
    let os = 'unknown';
    if (ua.includes('windows')) {
      os = 'Windows';
    } else if (ua.includes('mac')) {
      os = 'macOS';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    } else if (ua.includes('android')) {
      os = 'Android';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
    }

    return { browser, os };
  }

  /**
   * IPアドレスから位置情報を推定（簡易版）
   * 注: 実際の実装では外部APIを使用
   */
  static async getLocationFromIP(ipAddress: string): Promise<any> {
    // 簡易実装（実際はIPジオロケーションAPIを使用）
    if (ipAddress.startsWith('192.168.') || ipAddress === '::1') {
      return {
        country: 'Local',
        city: 'Local',
      };
    }

    // TODO: 実際のIPジオロケーションAPIを統合
    return {
      country: 'Unknown',
      city: 'Unknown',
    };
  }
}

export default SessionManager;