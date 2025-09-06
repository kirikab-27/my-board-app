import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { VerificationCodeService } from '@/services/verificationCodeService';
import { VerificationType } from '@/models/VerificationCode';
import { sendVerificationCodeEmail } from '@/lib/email/react-email-sender';

/**
 * 認証コード生成API
 * 
 * POST /api/admin/verification/generate
 * 
 * 🔐 セキュリティ要件:
 * - 管理者権限必須
 * - レート制限適用
 * - IPアドレス・User-Agent記録
 * - 入力バリデーション
 */

interface GenerateCodeRequest {
  email: string;
  type: VerificationType;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 管理者ロールチェック
    const userRole = (session.user as any).role;
    if (!['admin', 'super_admin'].includes(userRole)) {
      console.warn(`⚠️ 非管理者による認証コード生成試行: ${session.user.email} (Role: ${userRole})`);
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // リクエスト解析
    const body: GenerateCodeRequest = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') || 
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || undefined;
    
    // 入力バリデーション
    const validation = validateGenerateRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    console.log(`📧 認証コード生成要求: ${body.email} (${body.type}) by ${session.user.email}`);
    
    // 認証コード生成
    const result = await VerificationCodeService.generateCode({
      email: body.email,
      type: body.type,
      ipAddress,
      userAgent,
      sessionId: (session.user as any).id,
      metadata: {
        ...body.metadata,
        requestedBy: session.user.email,
        requestedAt: new Date().toISOString(),
        adminRole: userRole,
      },
    });
    
    if (!result.success) {
      // エラーログ出力（管理者による要求失敗）
      console.error('❌ 管理者による認証コード生成失敗:', {
        adminUser: session.user.email,
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
    
    // メール送信
    try {
      await sendVerificationCodeEmail(
        body.email,
        result.code!,
        body.type
      );
      console.log(`📧 認証コードメール送信成功: ${body.email}`);
    } catch (emailError) {
      console.error('❌ メール送信エラー（コードは生成済み）:', emailError);
      // メール送信に失敗してもコード生成は成功としてレスポンスを返す
    }
    
    // 成功ログ
    console.log(`✅ 認証コード生成成功: ${body.email} (${body.type}) by ${session.user.email}`);
    
    return NextResponse.json({
      success: true,
      data: {
        email: body.email,
        type: body.type,
        code: result.code, // 管理者用APIなので返却
        expiresAt: result.expiresAt,
        generatedBy: session.user.email,
        generatedAt: new Date().toISOString(),
      },
      rateLimit: result.rateLimit,
    });
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ [CRITICAL] 認証コード生成API内部エラー:', {
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
function validateGenerateRequest(body: any): {
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
  
  // 認証タイプ検証
  const validTypes: VerificationType[] = ['admin_registration', 'password_reset', '2fa', 'email_verification'];
  if (!body.type || !validTypes.includes(body.type)) {
    return { isValid: false, error: 'Invalid verification type' };
  }
  
  // メタデータ検証（オプション）
  if (body.metadata !== undefined) {
    if (typeof body.metadata !== 'object' || body.metadata === null) {
      return { isValid: false, error: 'Metadata must be an object' };
    }
    
    // メタデータサイズ制限
    try {
      const jsonString = JSON.stringify(body.metadata);
      if (jsonString.length > 1024) { // 1KB制限
        return { isValid: false, error: 'Metadata too large' };
      }
    } catch (e) {
      return { isValid: false, error: 'Invalid metadata format' };
    }
  }
  
  return { isValid: true };
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