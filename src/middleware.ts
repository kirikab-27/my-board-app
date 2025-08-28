import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { 
  getRouteConfig, 
  hasRequiredRole, 
  securityHeaders,
} from '@/lib/middleware/auth-config';
import { 
  performSecurityChecks, 
  getClientIP 
} from '@/lib/middleware/security';
import type { UserRole } from '@/types/auth';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const clientIP = getClientIP(req);
    
    // セキュリティチェックを実行
    const securityResult = performSecurityChecks(req);
    if (!securityResult.allowed) {
      console.log(`🛡️  セキュリティチェック失敗: ${pathname} (IP: ${clientIP}, 理由: ${securityResult.reason})`);
      
      // レート制限の場合は429を返す
      if (securityResult.reason?.includes('Rate limit')) {
        const response = new Response('Too Many Requests', { 
          status: 429,
          headers: {
            'Retry-After': securityResult.retryAfter?.toString() || '900',
            ...securityHeaders
          }
        });
        return response;
      }
      
      // その他のセキュリティ違反は403を返す
      const response = new Response('Forbidden', { 
        status: 403,
        headers: securityHeaders
      });
      return response;
    }
    
    // セキュリティヘッダーを追加したレスポンスを作成
    const response = NextResponse.next();
    
    // セキュリティヘッダーを設定
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // リクエスト情報をヘッダーに追加（デバッグ用）
    response.headers.set('X-Client-IP', clientIP);
    // Edge Runtime compatible request ID generation
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    response.headers.set('X-Request-ID', requestId);

    // ルート設定を取得
    const routeInfo = getRouteConfig(pathname);
    
    if (!routeInfo) {
      // 設定されていないルートはデフォルトで保護
      console.warn(`⚠️  未設定ルート: ${pathname} - デフォルトで認証必須`);
      if (!token) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    const { type, config } = routeInfo;

    // 公開ルートの場合は通過
    if (type === 'public') {
      return response;
    }

    // ゲスト専用ルートの処理
    if (type === 'guestOnly') {
      if (token) {
        // 認証済みユーザーをリダイレクト
        const redirectUrl = new URL(config.redirectTo || '/board', req.url);
        console.log(`🔄 認証済みユーザーを ${pathname} から ${config.redirectTo} にリダイレクト`);
        return NextResponse.redirect(redirectUrl);
      }
      return response;
    }

    // 認証が必要なルートの処理
    if (type === 'protected' || type === 'adminOnly') {
      // 未認証の場合
      if (!token) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        console.log(`🚫 未認証アクセス: ${pathname} -> ログインページ`);
        return NextResponse.redirect(loginUrl);
      }

      // トークンから情報を取得
      const userRole = (token as any)?.role as UserRole;
      const emailVerified = (token as any)?.emailVerified;

      // 管理者専用ルートの権限チェック
      if (type === 'adminOnly') {
        if (!hasRequiredRole(userRole, 'admin')) {
          const unauthorizedUrl = new URL(config.redirectTo || '/unauthorized', req.url);
          console.log(`🚫 権限不足: ${pathname} (要求: admin, 現在: ${userRole})`);
          return NextResponse.redirect(unauthorizedUrl);
        }
      }

      // 保護ルートの詳細チェック
      if (type === 'protected') {
        const protectedConfig = config as any;
        
        // ロール権限チェック
        if (protectedConfig.requiredRole && !hasRequiredRole(userRole, protectedConfig.requiredRole)) {
          const unauthorizedUrl = new URL('/unauthorized', req.url);
          console.log(`🚫 権限不足: ${pathname} (要求: ${protectedConfig.requiredRole}, 現在: ${userRole})`);
          return NextResponse.redirect(unauthorizedUrl);
        }

        // メール認証チェック
        if (protectedConfig.requireEmailVerified && !emailVerified) {
          const verifyUrl = new URL('/auth/verify-email', req.url);
          console.log(`📧 メール未認証: ${pathname} -> 認証ページ`);
          return NextResponse.redirect(verifyUrl);
        }
      }
    }

    // 正常アクセス
    console.log(`✅ アクセス許可: ${pathname} (ユーザー: ${(token as any)?.email || 'anonymous'})`);
    return response;
  },
  {
    callbacks: {
      authorized: () => {
        // withAuthコールバックは基本的にtrueを返す
        // 詳細な制御は上記のmiddleware関数で行う
        return true;
      },
    },
    pages: {
      signIn: '/login', // カスタムログインページを使用
      error: '/auth/error',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes except auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!api/(?!auth)|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)',
  ],
};