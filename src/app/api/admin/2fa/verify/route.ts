/**
 * 2FA 検証API
 * Issue #53: 2FA管理者ログインシステム
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { TwoFactorAuthService } from '@/lib/auth/twoFactor';

export async function POST(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: '認証コードが必要です' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // 2FAトークン検証
    const result = await TwoFactorAuthService.verifyToken(userId, token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '認証に失敗しました' },
        { status: 400 }
      );
    }

    // セッションに2FA検証済みフラグを設定
    // TODO: NextAuth.jsのセッション拡張が必要

    return NextResponse.json({
      success: true,
      isBackupCode: result.isBackupCode,
      message: result.isBackupCode 
        ? 'バックアップコードで認証されました' 
        : '2FA認証に成功しました'
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: '2FA検証に失敗しました' },
      { status: 500 }
    );
  }
}