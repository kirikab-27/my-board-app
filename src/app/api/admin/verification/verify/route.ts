import { NextRequest, NextResponse } from 'next/server';
import { VerificationCodeService } from '@/services/verificationCodeService';
import { VerificationType } from '@/models/VerificationCode';

/**
 * 認証コード検証API
 * 
 * POST /api/admin/verification/verify
 * 
 * 🔐 セキュリティ要件:
 * - パブリックエンドポイント（認証前に使用）
 * - 厳格なレート制限
 * - ブルートフォース攻撃対策
 * - タイミング攻撃対策
 * - 詳細なログ記録
 */

interface VerifyCodeRequest {
  email: string;
  code: string;
  type: VerificationType;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // リクエスト情報取得
    const body: VerifyCodeRequest = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') || 
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || undefined;
    
    // 入力バリデーション（早期リターン）
    const validation = validateVerifyRequest(body);
    if (!validation.isValid) {
      // バリデーションエラーでも最小時間は守る
      await enforceMinResponseTime(startTime, 500);
      
      console.warn(`⚠️ バリデーションエラー: ${ipAddress} - ${validation.error}`);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    console.log(`🔍 認証コード検証要求: ${body.email} (${body.type}) from ${ipAddress}`);
    
    // 認証コード検証実行
    const result = await VerificationCodeService.verifyCode({
      email: body.email,
      code: body.code,
      type: body.type,
      ipAddress,
      userAgent,
    });
    
    const duration = Date.now() - startTime;
    
    if (!result.success) {
      // 失敗ケースの詳細ログ
      console.warn(`❌ 認証コード検証失敗: ${body.email} (${body.type})`, {
        error: result.error,
        attempts: result.attempts,
        lockedUntil: result.lockedUntil,
        ipAddress,
        duration: `${duration}ms`,
      });
      
      // エラーレスポンスの統一化（情報漏洩防止）
      let statusCode = 401;
      let errorMessage = 'Verification failed';
      
      if (result.error?.includes('locked')) {
        statusCode = 423; // Locked
        errorMessage = 'Account temporarily locked';
      } else if (result.error?.includes('expired')) {
        statusCode = 410; // Gone
        errorMessage = 'Code expired';
      } else if (result.error?.includes('used')) {
        statusCode = 422; // Unprocessable Entity
        errorMessage = 'Code already used';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          ...(result.lockedUntil && { lockedUntil: result.lockedUntil }),
        },
        { status: statusCode }
      );
    }
    
    // 成功ログ
    console.log(`✅ 認証コード検証成功: ${body.email} (${body.type})`, {
      ipAddress,
      duration: `${duration}ms`,
      attempts: result.attempts,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      data: {
        email: body.email,
        type: body.type,
        verifiedAt: new Date().toISOString(),
        attempts: result.attempts,
      },
    });
    
  } catch (error) {
    const err = error as Error;
    const duration = Date.now() - startTime;
    
    console.error('❌ [CRITICAL] 認証コード検証API内部エラー:', {
      error: err.message,
      stack: err.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    
    // エラー時も最小レスポンス時間を守る
    await enforceMinResponseTime(startTime, 500);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 入力バリデーション
 */
function validateVerifyRequest(body: any): {
  isValid: boolean;
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }
  
  // メールアドレス検証
  if (!body.email || typeof body.email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (body.email.length > 320) { // RFC 5321 limit
    return { isValid: false, error: 'Email too long' };
  }
  
  // 認証コード検証
  if (!body.code || typeof body.code !== 'string') {
    return { isValid: false, error: 'Code is required' };
  }
  
  if (!/^[0-9]{6}$/.test(body.code)) {
    return { isValid: false, error: 'Invalid code format' };
  }
  
  // 認証タイプ検証
  const validTypes: VerificationType[] = ['admin_registration', 'password_reset', '2fa', 'email_verification'];
  if (!body.type || !validTypes.includes(body.type)) {
    return { isValid: false, error: 'Invalid verification type' };
  }
  
  return { isValid: true };
}

/**
 * 最小レスポンス時間の強制（タイミング攻撃対策）
 */
async function enforceMinResponseTime(startTime: number, minTime: number): Promise<void> {
  const elapsed = Date.now() - startTime;
  const remaining = minTime - elapsed;
  
  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }
}

// GET リクエストは許可しない
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

// その他のHTTPメソッドも拒否
export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}