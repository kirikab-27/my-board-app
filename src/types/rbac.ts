/**
 * RBAC（Role-Based Access Control）型定義
 * Issue #47: 企業級権限管理システム
 */

import type { AdminRole } from '@/models/AdminUser';

// 権限定義
export interface Permission {
  resource: string;             // users, posts, system, admins
  action: string;              // read, create, update, delete, suspend
  displayName: string;
  description: string;
  conditions?: PermissionCondition[];
}

// 権限条件（条件付き権限）
export interface PermissionCondition {
  type: 'time' | 'ip' | 'approval' | 'custom';
  value: any;
  description: string;
}

// 権限マトリックス
export const PERMISSION_MATRIX: Record<AdminRole, string[]> = {
  super_admin: [
    // システム権限
    'system.read', 'system.write', 'system.backup', 'system.restore',
    'system.settings', 'system.logs',
    
    // 管理者管理
    'admins.read', 'admins.create', 'admins.update', 'admins.delete',
    'admins.suspend', 'admins.role_change',
    
    // ユーザー管理
    'users.read', 'users.update', 'users.suspend', 'users.delete',
    'users.role_change', 'users.export',
    
    // 投稿管理
    'posts.read', 'posts.update', 'posts.delete', 'posts.restore',
    'posts.moderate', 'posts.export',
    
    // 分析・監査
    'analytics.read', 'analytics.export', 'analytics.advanced',
    'audit.read', 'audit.export', 'audit.delete'
  ],
  
  admin: [
    // ユーザー管理
    'users.read', 'users.update', 'users.suspend', 'users.delete',
    'users.export',
    
    // 投稿管理
    'posts.read', 'posts.update', 'posts.delete', 'posts.restore',
    'posts.moderate', 'posts.export',
    
    // 分析・監査
    'analytics.read', 'analytics.export',
    'audit.read'
  ],
  
  moderator: [
    // 投稿管理のみ
    'posts.read', 'posts.update', 'posts.delete', 'posts.restore',
    'posts.moderate',
    
    // 基本分析
    'analytics.read'
  ]
};

// 権限チェック関数
export class RBACService {
  static hasPermission(
    userRole: AdminRole, 
    userPermissions: string[], 
    requiredPermission: string
  ): boolean {
    // 個別権限チェック
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }
    
    // ロール由来権限チェック
    const rolePermissions = PERMISSION_MATRIX[userRole] || [];
    return rolePermissions.includes(requiredPermission);
  }
  
  static canAccess(
    userRole: AdminRole,
    userPermissions: string[],
    resource: string,
    action: string
  ): boolean {
    const permission = `${resource}.${action}`;
    return this.hasPermission(userRole, userPermissions, permission);
  }
  
  static getHighestRole(roles: AdminRole[]): AdminRole {
    const rolePriority = {
      super_admin: 3,
      admin: 2,
      moderator: 1
    };
    
    return roles.reduce((highest, current) => 
      rolePriority[current] > rolePriority[highest] ? current : highest
    );
  }
  
  static getAllowedActions(
    userRole: AdminRole,
    userPermissions: string[],
    resource: string
  ): string[] {
    const allPermissions = [
      ...userPermissions,
      ...(PERMISSION_MATRIX[userRole] || [])
    ];
    
    return allPermissions
      .filter(p => p.startsWith(`${resource}.`))
      .map(p => p.split('.')[1]);
  }
}

// TypeScript型ガード
export function isValidAdminRole(role: string): role is AdminRole {
  return ['super_admin', 'admin', 'moderator'].includes(role);
}

export function isValidPermission(permission: string): boolean {
  return /^[a-z_]+\.[a-z_]+$/.test(permission);
}

// 権限要求デコレータ用型
export interface RequirePermissionOptions {
  permissions: string[];
  requireAll?: boolean;         // 全権限必要 vs いずれか1つ
  fallbackRole?: AdminRole;     // 権限不足時の最小ロール
}

// セッション拡張型
export interface AdminSessionData {
  adminUserId: string;
  adminRole: AdminRole;
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  expiresAt: Date;
  deviceFingerprint: string;
}

// API認証レスポンス型
export interface RBACCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions: string[];
  userPermissions: string[];
  userRole: AdminRole;
}