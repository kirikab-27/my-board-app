import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { AdminLevel } from '@/types/admin';

interface UseAdminAuthOptions {
  requiredLevel?: AdminLevel[];
  redirectTo?: string;
}

/**
 * 管理者権限認証フック
 * Issue #45 Phase 3: セキュリティ基盤
 */
export function useAdminAuth(options: UseAdminAuthOptions = {}) {
  const { 
    requiredLevel = ['admin', 'moderator'], 
    redirectTo = '/dashboard?error=admin-required' 
  } = options;
  
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    // 未認証の場合
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // 管理者権限チェック
    const userRole = session.user.role as AdminLevel;
    if (!requiredLevel.includes(userRole)) {
      console.warn('管理者権限不足:', {
        userRole,
        requiredLevel,
        userId: session.user.id
      });
      router.push(redirectTo);
      return;
    }
  }, [session, status, router, requiredLevel, redirectTo]);

  return {
    session,
    isLoading: status === 'loading',
    isAdmin: session?.user?.role === 'admin',
    isModerator: session?.user?.role === 'moderator',
    isAudit: session?.user?.role === 'audit',
    hasAccess: session?.user ? requiredLevel.includes(session.user.role as AdminLevel) : false,
  };
}