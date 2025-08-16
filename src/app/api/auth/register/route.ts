import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
// import VerificationToken from '@/models/VerificationToken'; // 一時的に無効化
import { registerSchema } from '@/lib/validations/auth';
// import { sendVerificationEmail } from '@/lib/email/react-email-sender'; // 一時的に無効化
// import * as Sentry from '@sentry/nextjs'; // 一時的にコメントアウト

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📥 Registration request body:', body);

    // バリデーション
    const validatedFields = registerSchema.safeParse(body);
    if (!validatedFields.success) {
      console.error('❌ Validation failed:', validatedFields.error.flatten().fieldErrors);
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedFields.data;
    console.log('✅ Validation passed for:', { name, email });

    // DB接続
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');

    // 既存ユーザーチェック
    console.log('🔍 Checking for existing user:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }
    console.log('✅ No existing user found');

    // ユーザー作成（緊急修正: メール認証を一時的にスキップ）
    console.log('👤 Creating new user...');
    const user = new User({
      name,
      email,
      password, // mongooseのpreミドルウェアでハッシュ化される
      emailVerified: new Date(), // 緊急修正: 一時的に即座に認証済みとして作成
    });

    console.log('💾 Saving user to database...');
    await user.save();
    console.log('✅ User saved successfully with ID:', user._id);

    // メール認証関連処理を一時的にスキップ（緊急修正）
    console.log('📧 Email verification temporarily disabled for emergency fix');
    
    // // 既存の認証トークンを削除（重複登録対応）
    // await VerificationToken.deleteMany({
    //   identifier: email,
    //   type: 'email-verification',
    // });

    // // メール認証トークン生成
    // console.log('🔑 Creating verification token...');
    // const verificationToken = await VerificationToken.createEmailVerificationToken(email, 24);
    // console.log('✅ Verification token created:', verificationToken.token);

    // // 認証メール送信
    // console.log('📧 Sending verification email...');
    // try {
    //   await sendVerificationEmail(email, name, verificationToken.token);
    //   console.log('✅ Verification email sent successfully');
    // } catch (emailError) {
    //   console.error('❌ Failed to send verification email:', emailError);
    //   // メール送信失敗でもユーザー作成は成功とする
    // }

    console.log('✅ User registered successfully:', email);

    return NextResponse.json({
      message:
        'アカウントを作成しました。すぐにログインできます。',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('❌ Error details:', {
      name: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Sentry.captureException(error); // 一時的にコメントアウト

    return NextResponse.json(
      {
        error: 'ユーザー登録に失敗しました。しばらく待ってから再度お試しください。',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
