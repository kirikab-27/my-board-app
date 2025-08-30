import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';
import { sendVerificationEmail } from '@/lib/email/react-email-sender';
import * as Sentry from '@sentry/nextjs';

export async function POST() {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const email = session.user.email;
    console.log('📧 Verification email resend request for:', email);

    // DB接続
    await connectDB();

    // ユーザー確認
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 既に認証済みの場合
    if (user.emailVerified) {
      return NextResponse.json({ message: 'メール認証は既に完了しています' }, { status: 200 });
    }

    // レート制限チェック（5分に1回まで）
    const recentToken = await VerificationToken.findOne({
      identifier: email,
      type: 'email-verification',
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    });

    if (recentToken) {
      return NextResponse.json(
        {
          error: '再送信制限中です',
          message: '5分間隔でメール再送信が可能です。しばらくお待ちください。',
          retryAfter: Math.ceil(
            (recentToken.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000
          ),
        },
        { status: 429 }
      );
    }

    // 既存トークン削除
    await VerificationToken.deleteMany({
      identifier: email,
      type: 'email-verification',
    });

    // 新しい認証トークン生成
    console.log('🔑 Creating new verification token...');
    const verificationToken = await VerificationToken.createEmailVerificationToken(email, 24);
    console.log('✅ New verification token created');

    // 認証メール再送信
    console.log('📧 Resending verification email...');
    try {
      await sendVerificationEmail(email, user.name, verificationToken.token);
      console.log('✅ Verification email resent successfully');

      return NextResponse.json({
        message: 'メール認証の再送信が完了しました',
        instructions: 'メールボックスを確認して、認証リンクをクリックしてください。',
        expiresIn: '24時間',
      });
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError);

      // トークン削除（失敗時）
      await VerificationToken.findByIdAndDelete(verificationToken._id);

      Sentry.captureException(emailError);

      return NextResponse.json(
        {
          error: 'メール再送信に失敗しました',
          message: 'SMTP接続エラーが発生しました。時間をおいて再試行してください。',
          details: 'システム管理者に連絡してください。',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      {
        error: 'システムエラーが発生しました',
        message: '認証メール再送信処理でエラーが発生しました。',
      },
      { status: 500 }
    );
  }
}
