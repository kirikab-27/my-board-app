'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type {
  UseRequireAuthOptions,
  UseRequireAuthReturn,
  AuthUser,
  UserRole,
  AuthFailureReason,
} from '@/types/auth';

/**
 * 認証必須フック - ページやコンポーネントで認証状態を管理
 *
 * @example
 * ```tsx
 * const { user, isLoading, error } = useRequireAuth({
 *   requiredRole: 'admin',
 *   requireEmailVerified: true
 * });
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <ProtectedContent user={user} />;
 * ```
 */
export const useRequireAuth = (options: UseRequireAuthOptions = {}): UseRequireAuthReturn => {
  const {
    requiredRole = 'user',
    requireEmailVerified = false,
    redirectTo = '/login',
    onUnauthorized,
    onLoading,
    customCheck,
  } = options;

  const { data: session, status, update: refreshSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [error, setError] = useState<AuthFailureReason | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  // セッションからAuthUserを変換
  const user: AuthUser | null = useMemo(() => {
    if (!session?.user) return null;

    return {
      id: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || '',
      role: (session.user as any).role || 'user',
      emailVerified: session.user.emailVerified || null,
      image: session.user.image || undefined,
      createdAt: new Date((session.user as any).createdAt || Date.now()),
      updatedAt: new Date((session.user as any).updatedAt || Date.now()),
    };
  }, [session]);

  // ロール階層の定義
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    moderator: 2,
    admin: 3,
  };

  // 権限チェック関数
  const checkPermissions = useCallback(
    (currentUser: AuthUser | null): AuthFailureReason | null => {
      if (!currentUser) {
        return 'not_authenticated';
      }

      // メール認証チェック
      if (requireEmailVerified && !currentUser.emailVerified) {
        return 'email_not_verified';
      }

      // ロール権限チェック
      const currentRoleLevel = roleHierarchy[currentUser.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (currentRoleLevel < requiredRoleLevel) {
        return 'insufficient_permissions';
      }

      // カスタムチェック
      if (customCheck && !customCheck(currentUser)) {
        return 'custom_check_failed';
      }

      return null;
    },
    [requireEmailVerified, requiredRole, customCheck, roleHierarchy]
  );

  // 認証状態の計算
  const isLoading = status === 'loading';
  const isAuthenticated = !!user && status === 'authenticated';
  const permissionError = useMemo(() => checkPermissions(user), [user, checkPermissions]);
  const hasRequiredPermission = !permissionError;

  // エラー状態の更新
  useEffect(() => {
    if (status === 'loading') {
      setError(null);
      return;
    }

    const currentError = checkPermissions(user);
    setError(currentError);
  }, [user, status, checkPermissions]);

  // 自動リダイレクト処理
  useEffect(() => {
    if (isLoading || hasRedirected) return;

    const currentError = checkPermissions(user);
    if (currentError) {
      onUnauthorized?.(currentError);

      // リダイレクト先の決定
      let redirectUrl = redirectTo;

      switch (currentError) {
        case 'not_authenticated':
          // ログインページにcallbackUrlを付与
          const callbackUrl = encodeURIComponent(pathname);
          redirectUrl = `${redirectTo}?callbackUrl=${callbackUrl}`;
          break;

        case 'email_not_verified':
          redirectUrl = '/auth/verify-email';
          break;

        case 'insufficient_permissions':
          redirectUrl = '/unauthorized';
          break;

        case 'custom_check_failed':
          redirectUrl = '/access-denied';
          break;
      }

      setHasRedirected(true);
      router.push(redirectUrl);
    }
  }, [
    user,
    status,
    isLoading,
    hasRedirected,
    router,
    pathname,
    redirectTo,
    onUnauthorized,
    checkPermissions,
  ]);

  // ローディング状態のコールバック
  useEffect(() => {
    if (isLoading) {
      onLoading?.();
    }
  }, [isLoading, onLoading]);

  // 手動認証チェック
  const recheckAuth = useCallback(() => {
    setError(null);
    setHasRedirected(false);
    const currentError = checkPermissions(user);
    setError(currentError);
  }, [user, checkPermissions]);

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRequiredPermission,
    error,
    recheckAuth,
    refreshSession: useCallback(async () => {
      await refreshSession();
    }, [refreshSession]),
  };
};

/**
 * 簡易版認証フック - 基本的な認証チェックのみ
 */
export const useAuth = () => {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
};

/**
 * 管理者権限チェックフック
 */
export const useRequireAdmin = (options?: Omit<UseRequireAuthOptions, 'requiredRole'>) => {
  return useRequireAuth({
    ...options,
    requiredRole: 'admin',
  });
};

/**
 * モデレーター権限チェックフック
 */
export const useRequireModerator = (options?: Omit<UseRequireAuthOptions, 'requiredRole'>) => {
  return useRequireAuth({
    ...options,
    requiredRole: 'moderator',
  });
};
