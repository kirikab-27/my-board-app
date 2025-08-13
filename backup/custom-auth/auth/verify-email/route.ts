import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/error?error=missing-token', req.url)
      );
    }

    await connectDB();

    // トークン検証
    const verificationToken = await VerificationToken.findOne({
      token,
      type: 'email-verification',
      expires: { $gt: new Date() }, // 有効期限チェック
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid-token', req.url)
      );
    }

    // ユーザーのメール認証を完了
    const user = await User.findOneAndUpdate(
      { email: verificationToken.identifier },
      { 
        emailVerified: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/error?error=user-not-found', req.url)
      );
    }

    // 使用済みトークン削除
    await VerificationToken.deleteOne({ _id: verificationToken._id });

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