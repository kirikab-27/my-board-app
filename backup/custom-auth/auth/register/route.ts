import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';
import { registerSchema } from '@/lib/validations/auth';
import { generateVerificationToken } from '@/lib/auth/tokens';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // バリデーション
    const validatedFields = registerSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedFields.data;

    // DB接続
    await connectDB();

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // ユーザー作成
    const user = new User({
      name,
      email,
      password, // mongooseのpreミドルウェアでハッシュ化される
      emailVerified: null,
    });

    await user.save();

    // メール認証トークン生成
    const token = generateVerificationToken();
    const verificationToken = new VerificationToken({
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間
      type: 'email-verification',
    });

    await verificationToken.save();

    // 認証メール送信（Phase 2で実装）
    console.log('✅ User registered successfully:', email);
    console.log('🔗 Verification token generated:', token);

    return NextResponse.json({
      message: '登録が完了しました。メールアドレスに送信された認証リンクをクリックしてください。',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      // 開発用（本番では削除）
      verificationToken: process.env.NODE_ENV === 'development' ? token : undefined,
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました。しばらく待ってから再度お試しください。' },
      { status: 500 }
    );
  }
}