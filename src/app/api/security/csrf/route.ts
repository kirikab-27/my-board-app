/**
 * CSRF トークン管理API
 * トークンの生成・検証・統計情報提供
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateCSRFToken, 
  verifyCSRFToken,
  getCSRFStatistics,
  setCSRFCookie 
} from '@/lib/security/csrf';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';

/**
 * CSRF トークンの生成
 */
export async function GET(request: NextRequest) {
  try {
    // セッション情報の取得
    const session = await getServerSession(authOptions);
    const sessionId = session?.user?.id;
    
    // CSRF トークンの生成
    const token = generateCSRFToken(sessionId);
    
    // レスポンスの作成
    const response = NextResponse.json({
      token,
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24時間後
    });
    
    // CSRF トークンをクッキーに設定
    response.headers.set('Set-Cookie', setCSRFCookie(token));
    
    // 開発環境では統計情報も返す
    if (process.env.NODE_ENV === 'development') {
      const stats = getCSRFStatistics();
      response.headers.set('X-CSRF-Stats', JSON.stringify(stats));
    }
    
    return response;
    
  } catch (error) {
    console.error('CSRF トークン生成エラー:', error);
    
    return NextResponse.json({
      error: 'Failed to generate CSRF token'
    }, { status: 500 });
  }
}

/**
 * CSRF トークンの検証
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json({
        valid: false,
        error: 'Token is required'
      }, { status: 400 });
    }
    
    // セッション情報の取得
    const session = await getServerSession(authOptions);
    const sessionId = session?.user?.id;
    
    // トークンの検証
    const isValid = verifyCSRFToken(token, sessionId);
    
    return NextResponse.json({
      valid: isValid,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('CSRF トークン検証エラー:', error);
    
    return NextResponse.json({
      valid: false,
      error: 'Verification failed'
    }, { status: 500 });
  }
}

/**
 * CSRF 統計情報の取得（管理者用）
 */
export async function PATCH(request: NextRequest) {
  try {
    // 簡易管理者認証
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.SECURITY_API_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 統計情報の取得
    const stats = getCSRFStatistics();
    
    return NextResponse.json({
      ...stats,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
    
  } catch (error) {
    console.error('CSRF 統計取得エラー:', error);
    
    return NextResponse.json({
      error: 'Failed to get statistics'
    }, { status: 500 });
  }
}