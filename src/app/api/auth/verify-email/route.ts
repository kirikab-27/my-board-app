import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';
import { sendWelcomeEmail } from '@/lib/email/react-email-sender';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    console.log('🔍 Email verification request with token:', token ? 'present' : 'missing');

    if (!token) {
      console.error('❌ No token provided');
      return NextResponse.redirect(
        new URL('/auth/error?error=missing-token', req.url)
      );
    }

    // DB接続
    await connectDB();

    // トークン検証
    console.log('🔑 Verifying token...');
    const verificationToken = await VerificationToken.findOne({
      token,
      type: 'email-verification',
      expires: { $gt: new Date() }, // 有効期限チェック
    });

    if (!verificationToken) {
      console.error('❌ Invalid or expired token');
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid-token', req.url)
      );
    }

    console.log('✅ Token verified for:', verificationToken.identifier);

    // ユーザーのメール認証を完了
    const user = await User.findOneAndUpdate(
      { email: verificationToken.identifier },
      { 
        emailVerified: new Date(),
      },
      { new: true }
    );

    if (!user) {
      console.error('❌ User not found for email:', verificationToken.identifier);
      return NextResponse.redirect(
        new URL('/auth/error?error=user-not-found', req.url)
      );
    }

    // 使用済みトークン削除
    await VerificationToken.deleteOne({ _id: verificationToken._id });
    console.log('✅ Used token deleted');

    // ウェルカムメール送信（Phase 2の新機能）
    try {
      console.log('📧 Sending welcome email...');
      await sendWelcomeEmail(user.email, user.name);
      console.log('✅ Welcome email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // ウェルカムメール送信失敗は認証成功に影響しない
    }

    console.log('✅ Email verified for:', user.email);

    // 認証完了ページにリダイレクト
    return NextResponse.redirect(
      new URL('/auth/verified?email=' + encodeURIComponent(user.email), req.url)
    );

  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=verification-failed', req.url)
    );
  }
}