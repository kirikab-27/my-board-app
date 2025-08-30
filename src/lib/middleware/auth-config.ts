/**
 * ミドルウェア認証設定
 * ルート保護・権限制御・リダイレクト設定
 */

import type { UserRole } from '@/types/auth';

export interface RouteConfig {
  /** 認証が必要なルート */
  protected: Record<
    string,
    {
      /** 必要な最小ロール */
      requiredRole?: UserRole;
      /** メール認証必須 */
      requireEmailVerified?: boolean;
      /** 認証失敗時のリダイレクト先 */
      redirectTo?: string;
      /** カスタム説明 */
      description?: string;
    }
  >;

  /** ゲスト専用ルート（認証済みユーザーはリダイレクト） */
  guestOnly: Record<
    string,
    {
      /** 認証済みユーザーのリダイレクト先 */
      redirectTo: string;
      /** 説明 */
      description?: string;
    }
  >;

  /** 管理者専用ルート */
  adminOnly: Record<
    string,
    {
      /** 権限不足時のリダイレクト先 */
      redirectTo?: string;
      /** 説明 */
      description?: string;
    }
  >;

  /** 公開ルート（認証不要） */
  public: string[];
}

/**
 * ルート保護設定
 */
export const routeConfig: RouteConfig = {
  // 認証必須ルート
  protected: {
    '/board': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: '会員限定掲示板',
    },
    '/dashboard': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: 'ユーザーダッシュボード',
    },
    '/profile': {
      requiredRole: 'user',
      requireEmailVerified: true,
      redirectTo: '/login',
      description: 'プロフィール管理',
    },
    '/profile/privacy': {
      requiredRole: 'user',
      requireEmailVerified: true,
      redirectTo: '/login',
      description: 'プライバシー設定',
    },
    '/timeline': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: 'タイムライン',
    },
    '/users': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: 'ユーザー一覧',
    },
    '/hashtags': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: 'ハッシュタグ',
    },
    '/notifications': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: '通知',
    },
    '/analytics/dashboard': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: '個人分析ダッシュボード',
    },
    '/members-only': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: '会員限定ページ（デモ）',
    },
    '/settings': {
      requiredRole: 'user',
      requireEmailVerified: true,
      redirectTo: '/login',
      description: 'アカウント設定',
    },
    '/admin/security': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: 'セキュリティ管理（テスト用・一般ユーザーアクセス可）',
    },
  },

  // ゲスト専用ルート
  guestOnly: {
    '/login': {
      redirectTo: '/board',
      description: 'ログインページ',
    },
    '/register': {
      redirectTo: '/board',
      description: '新規登録ページ',
    },
  },

  // 管理者専用ルート
  adminOnly: {
    '/admin': {
      redirectTo: '/unauthorized',
      description: '管理者専用エリア',
    },
    '/admin/users': {
      redirectTo: '/unauthorized',
      description: 'ユーザー管理',
    },
  },

  // 公開ルート
  public: [
    '/',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/auth/error',
    '/auth/verified',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/unauthorized',
    '/access-denied',
    '/manifest.json',
    '/sw.js',
  ],
};

/**
 * パスがパターンにマッチするかチェック
 */
export const matchesPath = (pathname: string, pattern: string): boolean => {
  // 完全一致
  if (pathname === pattern) return true;

  // プレフィックスマッチ（/admin* -> /admin/anything）
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return pathname.startsWith(prefix);
  }

  // ルートパスの特別処理（"/" は完全一致のみ）
  if (pattern === '/') {
    return pathname === '/';
  }

  // その他のパスはプレフィックスマッチなし
  return false;
};

/**
 * ロール階層チェック
 */
export const hasRequiredRole = (
  userRole: UserRole | undefined,
  requiredRole: UserRole
): boolean => {
  if (!userRole) return false;

  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    moderator: 2,
    admin: 3,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
};

/**
 * ルート設定を取得
 */
export const getRouteConfig = (pathname: string) => {
  // 保護ルートチェック
  for (const [route, config] of Object.entries(routeConfig.protected)) {
    if (matchesPath(pathname, route)) {
      return { type: 'protected', route, config };
    }
  }

  // ゲスト専用ルートチェック
  for (const [route, config] of Object.entries(routeConfig.guestOnly)) {
    if (matchesPath(pathname, route)) {
      return { type: 'guestOnly', route, config };
    }
  }

  // 管理者専用ルートチェック
  for (const [route, config] of Object.entries(routeConfig.adminOnly)) {
    if (matchesPath(pathname, route)) {
      return { type: 'adminOnly', route, config };
    }
  }

  // 公開ルートチェック
  if (routeConfig.public.some((route) => matchesPath(pathname, route))) {
    return { type: 'public', route: pathname, config: {} };
  }

  return null;
};

/**
 * セキュリティヘッダー設定
 * CSP対応版のヘッダーを使用 - middleware.tsから直接インポート
 */
