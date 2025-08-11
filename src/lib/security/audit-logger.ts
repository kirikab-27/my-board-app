/**
 * セキュリティ監査ログシステム
 * セキュリティイベントの記録・分析・アラート
 */

import AuditLog, { type IAuditLog, type SecurityEventType, type SecuritySeverity } from '@/models/AuditLog';
import { getClientIP } from '@/lib/middleware/security';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  details: any;
  timestamp?: Date;
}

/**
 * セキュリティ監査ログ管理クラス
 */
export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  
  private constructor() {}
  
  public static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }
  
  /**
   * セキュリティイベントをログに記録
   */
  async log(event: SecurityEvent): Promise<void> {
    try {
      await dbConnect();
      
      const severity = this.calculateSeverity(event.type);
      const timestamp = event.timestamp || new Date();
      
      // ログエントリの作成
      const logEntry = new AuditLog({
        type: event.type,
        severity,
        userId: event.userId,
        ip: event.ip,
        userAgent: event.userAgent.substring(0, 500), // 長さ制限
        path: event.path.substring(0, 200), // 長さ制限
        method: event.method,
        details: event.details,
        timestamp,
        resolved: false
      });
      
      await logEntry.save();
      
      // 重大なイベントの場合はアラート送信
      if (this.isCritical(event.type)) {
        await this.sendSecurityAlert(logEntry);
      }
      
      // 開発環境では詳細ログ
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🛡️ セキュリティイベント [${severity}]:`, {
          type: event.type,
          ip: event.ip,
          path: event.path,
          details: event.details
        });
      }
      
    } catch (error) {
      console.error('セキュリティログ記録エラー:', error);
      
      // ログ記録に失敗してもメインプロセスは継続
      // フォールバックとして基本ログ出力
      console.error('🚨 SECURITY EVENT (FALLBACK):', {
        type: event.type,
        ip: event.ip,
        path: event.path,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * リクエストからセキュリティイベントを作成
   */
  createEventFromRequest(
    request: NextRequest, 
    type: SecurityEventType, 
    details: any,
    userId?: string
  ): SecurityEvent {
    return {
      type,
      userId,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      path: request.nextUrl.pathname,
      method: request.method,
      details,
      timestamp: new Date()
    };
  }
  
  /**
   * セキュリティイベントの重要度を計算
   */
  private calculateSeverity(type: SecurityEventType): SecuritySeverity {
    const severityMap: Record<SecurityEventType, SecuritySeverity> = {
      'AUTH_FAILURE': 'LOW',
      'PERMISSION_DENIED': 'MEDIUM',
      'XSS_ATTEMPT': 'HIGH',
      'CSRF_VIOLATION': 'HIGH',
      'RATE_LIMIT': 'MEDIUM',
      'SUSPICIOUS_ACTIVITY': 'HIGH',
      'SQL_INJECTION': 'CRITICAL',
      'FILE_ACCESS_VIOLATION': 'HIGH',
      'BRUTE_FORCE': 'HIGH',
      'ACCOUNT_LOCKOUT': 'MEDIUM',
      'UNUSUAL_ACCESS_PATTERN': 'MEDIUM',
      'CSP_VIOLATION': 'LOW'
    };
    
    return severityMap[type] || 'MEDIUM';
  }
  
  /**
   * 重要イベントかどうかの判定
   */
  private isCritical(type: SecurityEventType): boolean {
    const criticalTypes: SecurityEventType[] = [
      'XSS_ATTEMPT',
      'CSRF_VIOLATION', 
      'SQL_INJECTION',
      'SUSPICIOUS_ACTIVITY',
      'BRUTE_FORCE'
    ];
    
    return criticalTypes.includes(type);
  }
  
  /**
   * セキュリティアラート送信
   */
  private async sendSecurityAlert(logEntry: IAuditLog): Promise<void> {
    try {
      // 実際の実装では以下のような処理を行う：
      // 1. Slackへの通知
      // 2. メール送信
      // 3. 管理者ダッシュボードへのアラート
      // 4. PagerDuty等の外部サービス連携
      
      console.error('🚨 重要なセキュリティアラート:', {
        type: logEntry.type,
        severity: logEntry.severity,
        ip: logEntry.ip,
        path: logEntry.path,
        timestamp: logEntry.timestamp
      });
      
      // TODO: 実装例
      // await this.sendSlackNotification(logEntry);
      // await this.sendEmailAlert(logEntry);
      
    } catch (error) {
      console.error('セキュリティアラート送信エラー:', error);
    }
  }
  
  /**
   * セキュリティ統計の取得
   */
  async getSecurityStatistics(days: number = 7): Promise<any> {
    try {
      await dbConnect();
      
      const [summary, topThreats, recentEvents] = await Promise.all([
        AuditLog.getSecuritySummary(days),
        AuditLog.getTopThreats(days),
        AuditLog.find({
          timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
        })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean()
      ]);
      
      return {
        summary,
        topThreats,
        recentEvents,
        period: `${days} days`
      };
      
    } catch (error) {
      console.error('セキュリティ統計取得エラー:', error);
      throw error;
    }
  }
  
  /**
   * 特定IPの脅威レベル評価
   */
  async assessThreatLevel(ip: string, hours: number = 24): Promise<{
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    score: number;
    events: number;
    details: any[];
  }> {
    try {
      await dbConnect();
      
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const events = await AuditLog.find({
        ip,
        timestamp: { $gte: startTime }
      }).sort({ timestamp: -1 }).lean();
      
      // 脅威スコア計算
      let score = 0;
      events.forEach(event => {
        switch (event.severity) {
          case 'LOW': score += 1; break;
          case 'MEDIUM': score += 3; break;
          case 'HIGH': score += 7; break;
          case 'CRITICAL': score += 15; break;
        }
      });
      
      // 脅威レベル判定
      let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (score >= 50) level = 'CRITICAL';
      else if (score >= 20) level = 'HIGH';
      else if (score >= 5) level = 'MEDIUM';
      else level = 'LOW';
      
      return {
        level,
        score,
        events: events.length,
        details: events.map(e => ({
          type: e.type,
          severity: e.severity,
          timestamp: e.timestamp,
          path: e.path
        }))
      };
      
    } catch (error) {
      console.error('脅威レベル評価エラー:', error);
      return { level: 'LOW', score: 0, events: 0, details: [] };
    }
  }
  
  /**
   * セキュリティイベントの解決マーク
   */
  async resolveEvent(eventId: string, resolvedBy: string, notes?: string): Promise<void> {
    try {
      await dbConnect();
      
      await AuditLog.findByIdAndUpdate(eventId, {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        notes
      });
      
    } catch (error) {
      console.error('イベント解決エラー:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const auditLogger = SecurityAuditLogger.getInstance();

/**
 * 便利関数：リクエストベースでのログ記録
 */
export async function logSecurityEvent(
  request: NextRequest,
  type: SecurityEventType,
  details: any,
  userId?: string
): Promise<void> {
  const event = auditLogger.createEventFromRequest(request, type, details, userId);
  await auditLogger.log(event);
}

/**
 * 便利関数：XSS攻撃のログ記録
 */
export async function logXSSAttempt(
  request: NextRequest,
  maliciousContent: string,
  userId?: string
): Promise<void> {
  await logSecurityEvent(request, 'XSS_ATTEMPT', {
    maliciousContent: maliciousContent.substring(0, 500),
    detected: true,
    blocked: true
  }, userId);
}

/**
 * 便利関数：CSRF違反のログ記録
 */
export async function logCSRFViolation(
  request: NextRequest,
  reason: string,
  userId?: string
): Promise<void> {
  await logSecurityEvent(request, 'CSRF_VIOLATION', {
    reason,
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    blocked: true
  }, userId);
}

/**
 * 便利関数：レート制限のログ記録
 */
export async function logRateLimitExceeded(
  request: NextRequest,
  limit: string,
  userId?: string
): Promise<void> {
  await logSecurityEvent(request, 'RATE_LIMIT', {
    limit,
    blocked: true
  }, userId);
}