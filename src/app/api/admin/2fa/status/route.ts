/**
 * 2FA 状態確認API
 * Issue #53: 2FA管理者ログインシステム
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { TwoFactorAuthService } from '@/lib/auth/twoFactor';

export async function GET(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // 2FA状態確認
    const isEnabled = await TwoFactorAuthService.isEnabled(userId);
    const remainingBackupCodes = isEnabled 
      ? await TwoFactorAuthService.getRemainingBackupCodes(userId)
      : 0;

    return NextResponse.json({
      success: true,
      isEnabled,
      remainingBackupCodes,
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: '2FA状態の確認に失敗しました' },
      { status: 500 }
    );
  }
}