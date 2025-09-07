/**
 * 2FA（2段階認証）チェック用カスタムフック
 * 管理者ページで2FA検証状態を確認し、必要に応じてリダイレクト
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Use2FACheckResult {
  isChecking: boolean;
  is2FAEnabled: boolean;
  is2FAVerified: boolean;
  requiresVerification: boolean;
}

export function use2FACheck(): Use2FACheckResult {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    const check2FAStatus = async () => {
      if (!session?.user) {
        setIsChecking(false);
        return;
      }

      // 管理者・モデレーターのみ2FAチェック
      const userRole = (session.user as any)?.role;
      if (!['admin', 'moderator'].includes(userRole)) {
        setIsChecking(false);
        return;
      }

      try {
        // 2FAステータスを確認
        const response = await fetch('/api/admin/2fa/status');
        if (response.ok) {
          const data = await response.json();
          setIs2FAEnabled(data.enabled);
          setIs2FAVerified(data.verified || false);

          // 2FAが有効で未検証の場合、検証ページへリダイレクト
          if (data.enabled && !data.verified) {
            const currentPath = window.location.pathname;
            // 2FA関連ページ以外からのアクセスの場合のみリダイレクト
            if (!currentPath.includes('/auth/2fa') && !currentPath.includes('/admin/security/2fa')) {
              router.push(`/auth/2fa?callbackUrl=${encodeURIComponent(currentPath)}`);
            }
          }
        }
      } catch (error) {
        console.error('2FA status check failed:', error);
      } finally {
        setIsChecking(false);
      }
    };

    check2FAStatus();
  }, [session, status, router]);

  return {
    isChecking,
    is2FAEnabled,
    is2FAVerified,
    requiresVerification: is2FAEnabled && !is2FAVerified,
  };
}

/**
 * 管理者ページで2FAを要求するためのラッパーフック
 * ページコンポーネントの最初で呼び出す
 */
export function useRequire2FA() {
  const { isChecking, requiresVerification } = use2FACheck();
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && requiresVerification) {
      const currentPath = window.location.pathname;
      router.push(`/auth/2fa?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [isChecking, requiresVerification, router]);

  return { isChecking, requiresVerification };
}