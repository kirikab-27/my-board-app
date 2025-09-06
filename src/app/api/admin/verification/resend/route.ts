import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { VerificationCodeService } from '@/services/verificationCodeService';
import { VerificationType } from '@/models/VerificationCode';

/**
 * 認証コード再送信API
 * 
 * POST /api/admin/verification/resend
 * 
 * 🔐 セキュリティ要件:
 * - 管理者権限 OR 本人確認
 * - 強化されたレート制限
 * - 既存コードの無効化
 * - 悪用防止機能
 */

interface ResendCodeRequest {
  email: string;
  type: VerificationType;
  reason?: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // リクエスト解析
    const body: ResendCodeRequest = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') || 
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || undefined;
    const userRole = (session.user as any).role;
    
    // 入力バリデーション
    const validation = validateResendRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    // 権限チェック
    const authCheck = await checkResendPermission(session, body.email, userRole);
    if (!authCheck.allowed) {
      console.warn(`⚠️ 認証コード再送信権限不足: ${session.user.email} → ${body.email} (Role: ${userRole})`);
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      );
    }
    
    console.log(`📧 認証コード再送信要求: ${body.email} (${body.type})`, {
      requestedBy: session.user.email,
      userRole,
      reason: body.reason || 'no reason provided',
      ipAddress,
    });
    
    // 再送信制限チェック（通常より厳格）
    const resendCheck = await checkResendRateLimit(body.email, body.type, ipAddress);
    if (!resendCheck.allowed) {
      console.warn(`⚠️ 再送信レート制限: ${body.email} (${body.type})`, resendCheck);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many resend requests. Please wait before requesting again.',
          cooldownUntil: resendCheck.cooldownUntil,
        },
        { status: 429 }
      );
    }
    
    // 認証コード再送信（既存コード無効化 + 新コード生成）
    const result = await VerificationCodeService.resendCode({
      email: body.email,
      type: body.type,
      ipAddress,
      userAgent,
      sessionId: (session.user as any).id,
      metadata: {
        ...body.metadata,
        resendRequestedBy: session.user.email,
        resendRequestedAt: new Date().toISOString(),
        resendReason: body.reason || 'user_request',
        adminRole: userRole,
        originalRequestIP: ipAddress,
      },
    });
    
    if (!result.success) {
      // エラーログ出力
      console.error('❌ 認証コード再送信失敗:', {
        requester: session.user.email,
        targetEmail: body.email,
        type: body.type,
        error: result.error,
        ipAddress,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          rateLimit: result.rateLimit,
        },
        { status: result.error?.includes('レート制限') ? 429 : 500 }
      );
    }
    
    // 成功ログ
    console.log(`✅ 認証コード再送信成功: ${body.email} (${body.type})`, {
      requestedBy: session.user.email,
      reason: body.reason,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Verification code resent successfully',
      data: {
        email: body.email,
        type: body.type,
        expiresAt: result.expiresAt,
        resentBy: session.user.email,
        resentAt: new Date().toISOString(),
        reason: body.reason,
        // 管理者の場合のみコードを返す
        ...(userRole === 'super_admin' && { code: result.code }),
      },
      rateLimit: result.rateLimit,
    });
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ [CRITICAL] 認証コード再送信API内部エラー:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 入力バリデーション
 */
function validateResendRequest(body: any): {
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
  
  if (body.email.length > 320) {
    return { isValid: false, error: 'Email too long' };
  }
  
  // 認証タイプ検証
  const validTypes: VerificationType[] = ['admin_registration', 'password_reset', '2fa', 'email_verification'];
  if (!body.type || !validTypes.includes(body.type)) {
    return { isValid: false, error: 'Invalid verification type' };
  }
  
  // 理由（オプション）
  if (body.reason && typeof body.reason !== 'string') {
    return { isValid: false, error: 'Reason must be a string' };
  }
  
  if (body.reason && body.reason.length > 200) {
    return { isValid: false, error: 'Reason too long' };
  }
  
  return { isValid: true };
}

/**
 * 再送信権限チェック
 */
async function checkResendPermission(
  session: any, 
  targetEmail: string, 
  userRole: string
): Promise<{ allowed: boolean; error?: string }> {
  // 管理者は全ユーザーの再送信可能
  if (['admin', 'super_admin'].includes(userRole)) {
    return { allowed: true };
  }
  
  // 一般ユーザーは自分のメールアドレスのみ
  if (session.user.email.toLowerCase() === targetEmail.toLowerCase()) {
    return { allowed: true };
  }
  
  return { 
    allowed: false, 
    error: 'You can only resend codes for your own email address' 
  };
}

/**
 * 再送信レート制限チェック（通常より厳格）
 */
async function checkResendRateLimit(
  email: string, 
  type: VerificationType, 
  ipAddress: string
): Promise<{
  allowed: boolean;
  remaining?: number;
  cooldownUntil?: Date;
  reason?: string;
}> {
  try {
    const now = new Date();
    
    // 10分間での再送信制限（メールあたり2回まで）
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const emailCount = await VerificationCode.countDocuments({
      email: email.toLowerCase(),
      type,
      createdAt: { $gte: tenMinutesAgo },
    });
    
    if (emailCount >= 2) {
      return {
        allowed: false,
        cooldownUntil: new Date(now.getTime() + 10 * 60 * 1000),
        reason: 'Too many resends for this email',
      };
    }
    
    // 5分間でのIP制限（IPあたり3回まで）
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const ipCount = await VerificationCode.countDocuments({
      ipAddress,
      createdAt: { $gte: fiveMinutesAgo },
    });
    
    if (ipCount >= 3) {
      return {
        allowed: false,
        cooldownUntil: new Date(now.getTime() + 5 * 60 * 1000),
        reason: 'Too many requests from this IP',
      };
    }
    
    return { 
      allowed: true, 
      remaining: Math.min(2 - emailCount, 3 - ipCount),
    };
    
  } catch (error) {
    console.error('❌ レート制限チェックエラー:', error);
    // エラー時は安全側に倒して拒否
    return { 
      allowed: false, 
      reason: 'Rate limit check failed',
    };
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

// VerificationCode モデルをインポート（TypeScript用）
import VerificationCode from '@/models/VerificationCode';