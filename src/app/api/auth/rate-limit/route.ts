// ログイン試行回数・制限状況確認API
import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitInfo } from '@/lib/security/rateLimit';

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータから情報を取得
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter is required'
      }, { status: 400 });
    }

    // IPアドレス取得
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') ||
               '127.0.0.1';
    
    const clientIP = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();

    // レート制限情報取得
    const rateLimitInfo = getRateLimitInfo(clientIP, email);

    // レスポンス用データ整形
    const response = {
      success: true,
      data: {
        user: {
          email,
          remainingAttempts: rateLimitInfo.user?.remaining || 5,
          totalAttempts: rateLimitInfo.user?.attempts || 0,
          maxAttempts: 5, // USER_LIMITの設定値
          isLocked: rateLimitInfo.user?.locked || false,
          lockUntil: rateLimitInfo.user?.lockUntil || null,
          nextLockDuration: getNextLockDuration(rateLimitInfo.user?.attempts || 0)
        },
        ip: {
          remainingAttempts: rateLimitInfo.ip.remaining,
          totalAttempts: rateLimitInfo.ip.attempts,
          maxAttempts: 10, // IP_LIMITの設定値
          isLocked: rateLimitInfo.ip.locked,
          lockUntil: rateLimitInfo.ip.lockUntil || null
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Rate limit check API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * 次回ロック時間を計算
 */
function getNextLockDuration(currentAttempts: number): string {
  const PROGRESSIVE_LOCKOUT = {
    1: 60 * 1000,        // 1分
    2: 5 * 60 * 1000,    // 5分
    3: 15 * 60 * 1000,   // 15分
    4: 60 * 60 * 1000    // 1時間
  };

  const lockIndex = Math.min(currentAttempts - 4, 4); // 5回目から制限開始
  const lockMs = PROGRESSIVE_LOCKOUT[lockIndex as keyof typeof PROGRESSIVE_LOCKOUT] || PROGRESSIVE_LOCKOUT[4];
  
  const minutes = Math.floor(lockMs / 60000);
  const seconds = Math.floor((lockMs % 60000) / 1000);
  
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}時間`;
  } else if (minutes > 0) {
    return `${minutes}分`;
  } else {
    return `${seconds}秒`;
  }
}