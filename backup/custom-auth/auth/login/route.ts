import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';
import { createSession } from '@/lib/auth/session';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // バリデーション
    const validatedFields = loginSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = validatedFields.data;

    // DB接続
    await connectDB();

    // ユーザー検索
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // メール認証確認（Phase 2で有効化）
    // if (!user.emailVerified) {
    //   return NextResponse.json(
    //     { error: 'メール認証が完了していません' },
    //     { status: 401 }
    //   );
    // }

    // パスワード確認
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // セッション作成
    const token = createSession(user);

    console.log('✅ Login successful:', email);

    // レスポンス作成（Cookieにトークン設定）
    const response = NextResponse.json({
      message: 'ログインに成功しました',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });

    // HTTPOnly Cookie設定（セキュリティ強化）
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30日
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('❌ Login error:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'ログインに失敗しました。しばらく待ってから再度お試しください。' },
      { status: 500 }
    );
  }
}