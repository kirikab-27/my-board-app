import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    console.log('✅ Logout successful');

    // レスポンス作成
    const response = NextResponse.json({
      message: 'ログアウトしました',
    });

    // Cookieを削除
    response.cookies.delete('auth-token');

    return response;

  } catch (error) {
    console.error('❌ Logout error:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'ログアウトに失敗しました。' },
      { status: 500 }
    );
  }
}