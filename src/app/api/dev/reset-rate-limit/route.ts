/**
 * 開発環境専用: レート制限リセットAPI
 * 開発中にレート制限に引っかかった場合のリセット用
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetAllRateLimits, resetIPRateLimit, getClientIP } from '@/lib/middleware/security';

export async function POST(request: NextRequest) {
  // 開発環境のみ有効
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { action, ip } = await request.json().catch(() => ({}));
    const clientIP = getClientIP(request);

    switch (action) {
      case 'reset-all':
        resetAllRateLimits();
        return NextResponse.json({
          success: true,
          message: 'すべてのレート制限をリセットしました',
          clientIP,
        });

      case 'reset-ip':
        const targetIP = ip || clientIP;
        resetIPRateLimit(targetIP);
        return NextResponse.json({
          success: true,
          message: `IP ${targetIP} のレート制限をリセットしました`,
          clientIP,
          targetIP,
        });

      default:
        // デフォルトは現在のIPをリセット
        resetIPRateLimit(clientIP);
        return NextResponse.json({
          success: true,
          message: `現在のIP ${clientIP} のレート制限をリセットしました`,
          clientIP,
        });
    }
  } catch (error) {
    console.error('レート制限リセットエラー:', error);
    return NextResponse.json({ error: 'レート制限リセットに失敗しました' }, { status: 500 });
  }
}

// GET リクエストでもリセット可能（ブラウザから直接アクセス用）
export async function GET(request: NextRequest) {
  // 開発環境のみ有効
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  const clientIP = getClientIP(request);
  resetIPRateLimit(clientIP);

  return NextResponse.json({
    success: true,
    message: `現在のIP ${clientIP} のレート制限をリセットしました`,
    clientIP,
    instructions: {
      'reset-all': 'POST /api/dev/reset-rate-limit with {"action": "reset-all"}',
      'reset-specific-ip':
        'POST /api/dev/reset-rate-limit with {"action": "reset-ip", "ip": "target-ip"}',
    },
  });
}
