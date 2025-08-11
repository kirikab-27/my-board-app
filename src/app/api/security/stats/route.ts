// セキュリティ統計情報API
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityStats, getRateLimitInfo } from '@/lib/security/rateLimit';

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams;
    const ip = searchParams.get('ip');
    const email = searchParams.get('email');
    const action = searchParams.get('action'); // 'stats' | 'info'

    // 管理者認証（簡易版 - 実際は適切な認証を実装）
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    // 簡易管理者認証（実際はJWT等を使用）
    if (token !== process.env.SECURITY_API_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (action === 'info' && ip) {
      // 特定IPまたはユーザーの情報取得
      const rateLimitInfo = getRateLimitInfo(ip, email || undefined);
      
      return NextResponse.json({
        success: true,
        data: {
          ip,
          email: email || null,
          rateLimitInfo,
          timestamp: new Date().toISOString()
        }
      });
    }

    // セキュリティ統計情報取得
    const stats = getSecurityStats();
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Security stats API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}