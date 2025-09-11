/**
 * RBAC（Role-Based Access Control）ミドルウェア
 * Issue #47: Enterprise級権限管理システム
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { connectDB } from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import AuditLog from '@/models/AuditLog';

export type PermissionCheck = {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
};

/**
 * 権限チェックミドルウェア
 * API RouteでRBACを実装
 */
export async function checkPermission(
  request: NextRequest,
  required: PermissionCheck | string
): Promise<{ allowed: boolean; user?: any; reason?: string }> {
  try {
    // セッション取得
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      await logSecurityEvent(request, 'AUTH_FAILURE', 'HIGH', {
        reason: 'No session found',
      });
      return { allowed: false, reason: 'Unauthorized: No session' };
    }

    await connectDB();

    // AdminUserの取得
    const adminUser = await AdminUser.findOne({
      userId: session.user.id,
      isActive: true,
    }).populate('userId');

    // AdminUserレコードがない場合でも、通常のユーザーロールで権限判定
    if (!adminUser) {
      const userRole = (session.user as any).role;

      // admin/super_adminロールの場合は暫定的に権限を付与
      if (userRole === 'admin' || userRole === 'super_admin') {
        console.warn(
          '⚠️ AdminUser record not found, using fallback permissions for',
          session.user.email
        );

        // super_adminには全権限を付与
        if (userRole === 'super_admin') {
          return {
            allowed: true,
            user: {
              userId: session.user.id,
              adminRole: 'super_admin',
              email: session.user.email,
              permissions: ['*'], // 全権限
            },
          };
        }

        // adminには基本的な管理権限を付与
        return {
          allowed: true,
          user: {
            userId: session.user.id,
            adminRole: 'admin',
            email: session.user.email,
            permissions: [
              'admins.read',
              'admins.update',
              'users.read',
              'users.update',
              'posts.read',
              'posts.update',
            ],
          },
        };
      }

      // moderatorロールの場合
      if (userRole === 'moderator') {
        return {
          allowed: true,
          user: {
            userId: session.user.id,
            adminRole: 'moderator',
            email: session.user.email,
            permissions: ['posts.read', 'posts.update', 'users.read'],
          },
        };
      }
    }

    if (!adminUser) {
      await logSecurityEvent(request, 'PERMISSION_DENIED', 'HIGH', {
        userId: session.user.id,
        reason: 'Not an admin user',
      });
      return { allowed: false, reason: 'Forbidden: Not an admin' };
    }

    // アカウント停止チェック
    if (adminUser.suspendedAt) {
      await logSecurityEvent(request, 'PERMISSION_DENIED', 'HIGH', {
        userId: session.user.id,
        reason: 'Account suspended',
        suspendedAt: adminUser.suspendedAt,
      });
      return { allowed: false, reason: 'Forbidden: Account suspended' };
    }

    // 権限期限チェック
    if (adminUser.expiresAt && new Date() > adminUser.expiresAt) {
      await logSecurityEvent(request, 'PERMISSION_DENIED', 'MEDIUM', {
        userId: session.user.id,
        reason: 'Admin privileges expired',
        expiredAt: adminUser.expiresAt,
      });
      return { allowed: false, reason: 'Forbidden: Privileges expired' };
    }

    // IP制限チェック
    if (adminUser.allowedIPs && adminUser.allowedIPs.length > 0) {
      const clientIP = getClientIP(request);
      if (!isIPAllowed(clientIP, adminUser.allowedIPs)) {
        await logSecurityEvent(request, 'PERMISSION_DENIED', 'HIGH', {
          userId: session.user.id,
          reason: 'IP not allowed',
          clientIP,
          allowedIPs: adminUser.allowedIPs,
        });
        return { allowed: false, reason: 'Forbidden: IP not allowed' };
      }
    }

    // 権限チェック
    let resource: string, action: string;

    if (typeof required === 'string') {
      // 文字列形式: "users.read"
      [resource, action] = required.split('.');
    } else {
      // オブジェクト形式
      resource = required.resource;
      action = required.action;
    }

    // super_adminは全権限を持つ
    if (adminUser.adminRole === 'super_admin') {
      return { allowed: true, user: adminUser };
    }

    // ロール権限の取得
    const role = await Role.findOne({
      name: adminUser.adminRole,
      isActive: true,
    });

    if (!role) {
      await logSecurityEvent(request, 'PERMISSION_DENIED', 'CRITICAL', {
        userId: session.user.id,
        reason: 'Role not found',
        role: adminUser.adminRole,
      });
      return { allowed: false, reason: 'Forbidden: Invalid role' };
    }

    // 全権限の計算（ロール権限 + 個別権限）
    const allPermissions = await role.getAllPermissions();
    const userPermissions = [...new Set([...allPermissions, ...adminUser.permissions])];

    const permissionString = `${resource}.${action}`;
    const hasPermission = userPermissions.includes(permissionString);

    if (!hasPermission) {
      await logSecurityEvent(request, 'PERMISSION_DENIED', 'MEDIUM', {
        userId: session.user.id,
        required: permissionString,
        userPermissions,
        role: adminUser.adminRole,
      });
      return {
        allowed: false,
        reason: `Forbidden: Missing permission ${permissionString}`,
      };
    }

    // 条件付き権限のチェック
    if (typeof required === 'object' && required.conditions) {
      const permission = await Permission.findOne({
        name: permissionString,
        isActive: true,
      });

      if (permission && permission.conditions) {
        const conditionCheck = permission.checkConditions({
          ...required.conditions,
          userId: session.user.id,
        });

        if (!conditionCheck) {
          await logSecurityEvent(request, 'PERMISSION_DENIED', 'MEDIUM', {
            userId: session.user.id,
            permission: permissionString,
            conditions: permission.conditions,
            context: required.conditions,
          });
          return {
            allowed: false,
            reason: 'Forbidden: Permission conditions not met',
          };
        }
      }
    }

    // 2FA必須チェック
    const permission = await Permission.findOne({
      name: permissionString,
      isActive: true,
    });

    if (permission?.requiresMFA && !adminUser.twoFactorEnabled) {
      await logSecurityEvent(request, 'PERMISSION_DENIED', 'HIGH', {
        userId: session.user.id,
        permission: permissionString,
        reason: '2FA required but not enabled',
      });
      return {
        allowed: false,
        reason: 'Forbidden: 2FA required for this action',
      };
    }

    // 成功ログ（重要な操作のみ）
    if (permission?.riskLevel === 'high' || permission?.riskLevel === 'critical') {
      await logSecurityEvent(
        request,
        'PERMISSION_GRANTED',
        'LOW',
        {
          userId: session.user.id,
          permission: permissionString,
          role: adminUser.adminRole,
        },
        session.user.id
      );
    }

    return { allowed: true, user: adminUser };
  } catch (error) {
    console.error('Permission check error:', error);
    await logSecurityEvent(request, 'PERMISSION_DENIED', 'CRITICAL', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { allowed: false, reason: 'Internal Server Error' };
  }
}

/**
 * 複数権限のチェック（AND条件）
 */
export async function checkPermissions(
  request: NextRequest,
  requirements: (PermissionCheck | string)[]
): Promise<{ allowed: boolean; user?: any; reason?: string }> {
  for (const requirement of requirements) {
    const result = await checkPermission(request, requirement);
    if (!result.allowed) {
      return result;
    }
  }

  // 最後のチェック結果を返す（userを含む）
  return await checkPermission(request, requirements[requirements.length - 1]);
}

/**
 * いずれかの権限を持っているかチェック（OR条件）
 */
export async function checkAnyPermission(
  request: NextRequest,
  requirements: (PermissionCheck | string)[]
): Promise<{ allowed: boolean; user?: any; reason?: string }> {
  const reasons: string[] = [];

  for (const requirement of requirements) {
    const result = await checkPermission(request, requirement);
    if (result.allowed) {
      return result;
    }
    if (result.reason) {
      reasons.push(result.reason);
    }
  }

  return {
    allowed: false,
    reason: `Forbidden: None of the required permissions found. ${reasons.join(', ')}`,
  };
}

/**
 * ロールベースのチェック
 */
export async function checkRole(
  request: NextRequest,
  requiredRoles: string[]
): Promise<{ allowed: boolean; user?: any; reason?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return { allowed: false, reason: 'Unauthorized: No session' };
    }

    await connectDB();

    const adminUser = await AdminUser.findOne({
      userId: session.user.id,
      isActive: true,
    });

    if (!adminUser) {
      return { allowed: false, reason: 'Forbidden: Not an admin' };
    }

    if (!requiredRoles.includes(adminUser.adminRole)) {
      await logSecurityEvent(request, 'PERMISSION_DENIED', 'MEDIUM', {
        userId: session.user.id,
        currentRole: adminUser.adminRole,
        requiredRoles,
      });
      return {
        allowed: false,
        reason: `Forbidden: Role ${adminUser.adminRole} not in required roles`,
      };
    }

    return { allowed: true, user: adminUser };
  } catch (error) {
    console.error('Role check error:', error);
    return { allowed: false, reason: 'Internal Server Error' };
  }
}

/**
 * セキュリティイベントのログ記録
 */
async function logSecurityEvent(
  request: NextRequest,
  type: string,
  severity: string,
  details: any,
  userId?: string
): Promise<void> {
  try {
    await connectDB();

    const auditLog = new AuditLog({
      type: type as any,
      severity: severity as any,
      userId: userId || null,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      path: request.nextUrl.pathname,
      method: request.method,
      details: details || {}, // detailsが確実に存在するように
      timestamp: new Date(),
      resolved: false,
      // retentionDateとhashはpre-saveフックで設定される
    });

    await auditLog.save();
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * クライアントIPの取得
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return '127.0.0.1';
}

/**
 * IP許可リストのチェック
 */
function isIPAllowed(clientIP: string, allowedIPs: string[]): boolean {
  // 簡易実装（本番環境ではCIDR記法のサポートが必要）
  return allowedIPs.some((allowedIP) => {
    if (allowedIP.includes('/')) {
      // CIDR記法のサポート（簡易版）
      console.warn('CIDR notation support is simplified');
      return allowedIP.startsWith(clientIP.split('.').slice(0, 3).join('.'));
    }
    return allowedIP === clientIP;
  });
}

/**
 * APIレスポンスヘルパー
 */
export function forbiddenResponse(reason?: string): NextResponse {
  return NextResponse.json({ error: reason || 'Forbidden' }, { status: 403 });
}

export function unauthorizedResponse(reason?: string): NextResponse {
  return NextResponse.json({ error: reason || 'Unauthorized' }, { status: 401 });
}
