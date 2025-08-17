// 認証関連の型定義
import 'next-auth';
import 'next-auth/jwt';

// NextAuth.jsの型拡張
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      bio?: string | null;
      role?: UserRole;
      emailVerified?: Date | null;
    };
  }

  interface User {
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    emailVerified?: Date | null;
    bio?: string;
  }
}

export type UserRole = 'user' | 'admin' | 'moderator';

export type ProtectionLevel = 'public' | 'user' | 'verified' | 'moderator' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  bio?: string;
  role: UserRole;
  emailVerified: Date | null;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UseRequireAuthOptions {
  /**
   * 必要な権限レベル
   * @default 'user'
   */
  requiredRole?: UserRole;

  /**
   * メール認証が必要かどうか
   * @default false
   */
  requireEmailVerified?: boolean;

  /**
   * 認証失敗時のリダイレクト先
   * @default '/login'
   */
  redirectTo?: string;

  /**
   * 認証失敗時のコールバック
   */
  onUnauthorized?: (reason: AuthFailureReason) => void;

  /**
   * ローディング中のコールバック
   */
  onLoading?: () => void;

  /**
   * カスタム認証チェック
   */
  customCheck?: (user: AuthUser) => boolean;
}

export type AuthFailureReason =
  | 'not_authenticated'
  | 'insufficient_permissions'
  | 'email_not_verified'
  | 'custom_check_failed';

export interface UseRequireAuthReturn {
  /**
   * 認証済みユーザー情報
   */
  user: AuthUser | null;

  /**
   * ローディング状態
   */
  isLoading: boolean;

  /**
   * 認証済みかどうか
   */
  isAuthenticated: boolean;

  /**
   * 必要な権限を持っているかどうか
   */
  hasRequiredPermission: boolean;

  /**
   * エラー情報
   */
  error: AuthFailureReason | null;

  /**
   * 手動での認証チェック実行
   */
  recheckAuth: () => void;

  /**
   * セッション更新
   */
  refreshSession: () => Promise<void>;
}

export interface AuthStatus {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: AuthUser | null;
  error: string | null;
}
