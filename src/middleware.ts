/**
 * Next.js Middleware
 * 2FA検証とアクセス制御
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 2FA検証が必要なパス
const ADMIN_PATHS = [
  '/admin',
  '/api/admin',
];

// 2FA検証をスキップするパス
const SKIP_2FA_PATHS = [
  '/api/admin/2fa/verify',
  '/api/admin/2fa/status',
  '/auth/2fa',
];

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // 管理者エリアへのアクセスチェック
    const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path));
    
    if (isAdminPath) {
      // 2FA検証をスキップするパスかチェック
      const skip2FA = SKIP_2FA_PATHS.some(path => pathname.startsWith(path));
      if (skip2FA) {
        return NextResponse.next();
      }

      // 環境変数チェック
      if (!process.env.NEXTAUTH_SECRET) {
        console.error('NEXTAUTH_SECRET is not defined in production');
        // 本番環境でのエラーを避けるため、ログインページへリダイレクト
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // JWTトークン取得
      let token;
      try {
        token = await getToken({ 
          req: request,
          secret: process.env.NEXTAUTH_SECRET 
        });
      } catch (error) {
        console.error('Error getting token:', error);
        // トークン取得エラーの場合はログインページへ
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 未ログインの場合
      if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 管理者・モデレーター権限チェック
      const userRole = (token as any)?.role;
      if (!userRole || !['admin', 'moderator'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // 2FA有効チェック（データベース確認が必要）
      // 注: Middlewareではデータベースアクセスが制限されるため、
      // 2FA状態はセッションまたはJWTに含める必要がある
      
      const twoFactorVerified = (token as any)?.twoFactorVerified;
      const requires2FA = (token as any)?.requires2FA;

      // 2FAが有効で未検証の場合
      if (requires2FA && !twoFactorVerified) {
        const verifyUrl = new URL('/auth/2fa', request.url);
        verifyUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(verifyUrl);
      }
    }

    return NextResponse.next();
  } catch (error) {
    // エラーが発生した場合はログを出力し、通常のレスポンスを返す
    console.error('Middleware error:', error);
    
    // 管理者パスでエラーが発生した場合はログインページへ
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // その他のパスでは通常のレスポンスを返す
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // 管理者パス
    '/admin/:path*',
    '/api/admin/:path*',
    // 認証パス
    '/auth/:path*',
  ],
};