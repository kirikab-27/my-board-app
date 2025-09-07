/**
 * 2FA セットアップAPI
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

    // 管理者・モデレーター権限チェック
    const userRole = (session.user as any).role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json(
        { error: '権限が不足しています' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || '';

    // 2FAセットアップ情報生成
    const setup = await TwoFactorAuthService.generateSetup(userId, userEmail);

    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: setup.qrCodeUrl,
        secret: setup.secret,
        backupCodes: setup.backupCodes,
      }
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: '2FAセットアップに失敗しました' },
      { status: 500 }
    );
  }
}