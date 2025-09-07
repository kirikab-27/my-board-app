/**
 * 監査ログサービス
 * Issue #55: 監査ログシステム
 * 
 * すべての管理操作をログに記録し、改ざん防止機能を提供
 */

import AuditLog, { IAuditLog, SecurityEventType, SecuritySeverity } from '@/models/AuditLog';
import { connectDB } from '@/lib/mongodb';

export interface AuditLogOptions {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  ip: string;
  userAgent: string;
  sessionId?: string;
  path: string;
  method: string;
  targetId?: string;
  targetType?: string;
  description: string;
  details?: any;
  success: boolean;
  errorMessage?: string;
}

class AuditLogger {
  private static instance: AuditLogger;
  
  private constructor() {}
  
  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }
  
  /**
   * 監査ログを記録
   */
  async log(options: AuditLogOptions): Promise<IAuditLog> {
    await connectDB();
    
    try {
      const auditLog = new AuditLog({
        type: options.type,
        severity: options.severity,
        userId: options.userId,
        userEmail: options.userEmail,
        userName: options.userName,
        userRole: options.userRole,
        ip: options.ip,
        userAgent: options.userAgent,
        sessionId: options.sessionId,
        path: options.path,
        method: options.method,
        targetId: options.targetId,
        targetType: options.targetType,
        details: options.details,
        timestamp: new Date(),
        success: options.success,
        errorMessage: options.errorMessage,
        resolved: false,
      });
      
      // 保存（モデルのpre saveフックでハッシュが自動生成される）
      await auditLog.save();
      
      // 異常検知チェック（CRITICALレベルの場合）
      if (options.severity === 'CRITICAL' && options.userId) {
        const anomalies = await AuditLog.detectAnomalies(options.userId);
        if (anomalies.length > 0) {
          await this.handleAnomalies(anomalies);
        }
      }
      
      return auditLog;
    } catch (error) {
      console.error('監査ログ記録エラー:', error);
      throw error;
    }
  }
  
  /**
   * ログイン成功を記録
   */
  async logLogin(
    userId: string,
    email: string,
    ip: string,
    userAgent: string,
    sessionId?: string
  ): Promise<void> {
    await this.log({
      type: 'AUTH_FAILURE',
      severity: 'LOW',
      userId,
      userEmail: email,
      ip,
      userAgent,
      sessionId,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      description: `ユーザー ${email} がログインしました`,
      success: true,
    });
  }
  
  /**
   * ログイン失敗を記録
   */
  async logLoginFailure(
    email: string,
    ip: string,
    userAgent: string,
    reason: string
  ): Promise<void> {
    await this.log({
      type: 'AUTH_FAILURE',
      severity: 'MEDIUM',
      userEmail: email,
      ip,
      userAgent,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      description: `ログイン失敗: ${email}`,
      details: { reason },
      success: false,
      errorMessage: reason,
    });
  }
  
  /**
   * 管理者アクセスを記録
   */
  async logAdminAccess(
    userId: string,
    email: string,
    role: string,
    ip: string,
    userAgent: string,
    path: string,
    action: string
  ): Promise<void> {
    await this.log({
      type: 'PERMISSION_DENIED',
      severity: 'MEDIUM',
      userId,
      userEmail: email,
      userRole: role,
      ip,
      userAgent,
      path,
      method: 'GET',
      description: `管理者 ${email} が ${action} を実行`,
      success: true,
    });
  }
  
  /**
   * セキュリティ違反を記録
   */
  async logSecurityViolation(
    type: SecurityEventType,
    severity: SecuritySeverity,
    ip: string,
    userAgent: string,
    path: string,
    method: string,
    details: any
  ): Promise<void> {
    await this.log({
      type,
      severity,
      ip,
      userAgent,
      path,
      method,
      description: `セキュリティ違反: ${type}`,
      details,
      success: false,
      errorMessage: 'Security violation detected',
    });
  }
  
  /**
   * データ操作を記録
   */
  async logDataOperation(
    userId: string,
    email: string,
    operation: string,
    targetType: string,
    targetId: string,
    ip: string,
    userAgent: string,
    success: boolean,
    details?: any
  ): Promise<void> {
    await this.log({
      type: 'PERMISSION_DENIED',
      severity: success ? 'LOW' : 'MEDIUM',
      userId,
      userEmail: email,
      ip,
      userAgent,
      path: `/api/${targetType}/${targetId}`,
      method: operation === 'CREATE' ? 'POST' : operation === 'DELETE' ? 'DELETE' : 'PUT',
      targetId,
      targetType,
      description: `${email} が ${targetType} (ID: ${targetId}) を ${operation}`,
      details,
      success,
    });
  }
  
  /**
   * 異常検知アラートの処理
   */
  private async handleAnomalies(anomalies: IAuditLog[]): Promise<void> {
    console.error('🚨 異常検知アラート:', {
      count: anomalies.length,
      firstEvent: anomalies[0],
    });
    
    // TODO: 実際の運用では以下を実装
    // - Slackやメールで管理者に通知
    // - 自動的にアカウントをロック
    // - IPアドレスをブロック
  }
  
  /**
   * 監査ログチェーンの検証
   */
  async verifyChain(
    startDate?: Date,
    endDate?: Date
  ): Promise<{ valid: boolean; brokenAt?: string }> {
    await connectDB();
    return AuditLog.verifyChain(startDate, endDate);
  }
  
  /**
   * 古いログのアーカイブ
   */
  async archiveOldLogs(daysOld: number = 90): Promise<number> {
    await connectDB();
    return AuditLog.archiveOldLogs(daysOld);
  }
  
  /**
   * セキュリティサマリーの取得
   */
  async getSecuritySummary(days: number = 7): Promise<any[]> {
    await connectDB();
    return AuditLog.getSecuritySummary(days);
  }
  
  /**
   * トップ脅威の取得
   */
  async getTopThreats(days: number = 7): Promise<any[]> {
    await connectDB();
    return AuditLog.getTopThreats(days);
  }
}

export default AuditLogger.getInstance();