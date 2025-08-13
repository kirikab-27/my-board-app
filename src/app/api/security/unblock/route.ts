// セキュリティブロック解除API
import { NextRequest, NextResponse } from 'next/server';
import { unblockIpOrUser } from '@/lib/security/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // 管理者認証
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.SECURITY_API_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { identifier, type } = body;

    // バリデーション
    if (!identifier || !type) {
      return NextResponse.json({
        success: false,
        error: 'identifier and type are required'
      }, { status: 400 });
    }

    if (type !== 'ip' && type !== 'user') {
      return NextResponse.json({
        success: false,
        error: 'type must be either "ip" or "user"'
      }, { status: 400 });
    }

    // ブロック解除実行
    const success = unblockIpOrUser(identifier, type);

    return NextResponse.json({
      success,
      message: success 
        ? `Successfully unblocked ${type}: ${identifier}`
        : `No blocked record found for ${type}: ${identifier}`,
      data: {
        identifier,
        type,
        unblocked: success,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Security unblock API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}