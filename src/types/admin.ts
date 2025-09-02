/**
 * 管理者機能用TypeScript型定義
 * Issue #45 Phase 3: 基本型構造
 */

import { ObjectId } from 'mongodb';

// 管理者権限レベル
export type AdminLevel = 'admin' | 'moderator' | 'audit';

// 管理者ユーザー拡張
export interface IAdminUser {
  _id: ObjectId | string;
  userId: ObjectId | string; // 元のユーザーIDへの参照
  adminLevel: AdminLevel;
  adminMetadata: {
    lastAdminLogin: Date;
    loginCount: number;
    allowedIPs: string[];
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    emergencyCode?: string;
    isActive: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 監査ログ
export interface IAuditLog {
  _id: ObjectId | string;
  adminUserId: ObjectId | string;
  action: AdminAction;
  targetType: AdminTargetType;
  targetId?: ObjectId | string;
  metadata: {
    ipAddress: string;
    userAgent: string;
    requestData?: Record<string, unknown>;
    changes?: Record<string, unknown>;
    sessionId: string;
  };
  result: 'success' | 'failure' | 'partial';
  timestamp: Date;
}

// 管理者操作タイプ
export type AdminAction = 
  // ユーザー管理
  | 'user.view' | 'user.edit' | 'user.suspend' | 'user.delete' | 'user.role_change'
  // 投稿管理
  | 'post.view' | 'post.edit' | 'post.hide' | 'post.delete' | 'post.restore'
  // システム管理
  | 'system.login' | 'system.logout' | 'system.settings' | 'system.backup'
  // 分析・レポート
  | 'analytics.view' | 'analytics.export' | 'report.generate';

// 管理対象タイプ
export type AdminTargetType = 'user' | 'post' | 'comment' | 'system' | 'report';

// 管理者ダッシュボード統計
export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    suspended: number;
  };
  posts: {
    total: number;
    todayCount: number;
    reported: number;
    deleted: number;
  };
  engagement: {
    totalLikes: number;
    totalComments: number;
    activeUsers24h: number;
  };
  moderation: {
    pendingReports: number;
    resolvedToday: number;
    autoModerated: number;
  };
}

// ユーザー管理用拡張情報
export interface AdminUserView {
  _id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    likesReceived: number;
  };
  moderation: {
    reportCount: number;
    lastReportDate?: Date;
    suspensionHistory: Array<{
      date: Date;
      reason: string;
      adminId: string;
    }>;
  };
}

// 投稿管理用拡張情報  
export interface AdminPostView {
  _id: string;
  title?: string;
  content: string;
  authorId: string;
  authorName: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  moderation: {
    reportCount: number;
    isHidden: boolean;
    hiddenReason?: string;
    moderatedBy?: string;
    moderatedAt?: Date;
  };
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    publicId: string;
  }>;
}

// レポート・統計
export interface AdminReport {
  _id: string;
  type: 'user_activity' | 'content_moderation' | 'system_health' | 'security_audit';
  title: string;
  description: string;
  generatedBy: string;
  generatedAt: Date;
  data: Record<string, unknown>;
  format: 'json' | 'csv' | 'excel';
  downloadUrl?: string;
  expiresAt: Date;
}

// システム設定
export interface AdminSystemSettings {
  security: {
    adminSessionTimeout: number; // 分
    maxLoginAttempts: number;
    ipWhitelist: string[];
    twoFactorRequired: boolean;
  };
  moderation: {
    autoModerationEnabled: boolean;
    spamDetectionLevel: 'low' | 'medium' | 'high';
    autoDeleteThreshold: number;
    reportThreshold: number;
  };
  notifications: {
    emailAlerts: boolean;
    slackWebhook?: string;
    criticalAlerts: boolean;
  };
  maintenance: {
    lastBackup: Date;
    backupFrequency: 'daily' | 'weekly';
    systemHealthCheck: boolean;
  };
}