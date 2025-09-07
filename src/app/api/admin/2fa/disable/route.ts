/**
 * 2FA 無効化API
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

    // 管理者・モデレーター権限チェック
    const userRole = (session.user as any).role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json(
        { error: '権限が不足しています' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    // 2FA無効化
    await TwoFactorAuthService.disable(userId);

    return NextResponse.json({
      success: true,
      message: '2FAが無効になりました'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: '2FA無効化に失敗しました' },
      { status: 500 }
    );
  }
}