import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';
import { sendPasswordResetEmail } from '@/lib/email/react-email-sender';
import { z } from 'zod';

// バリデーションスキーマ
const resetRequestSchema = z.object({
  email: z.string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📥 Password reset request for:', body.email);

    // バリデーション
    const validatedFields = resetRequestSchema.safeParse(body);
    if (!validatedFields.success) {
      console.error('❌ Validation failed:', validatedFields.error.flatten().fieldErrors);
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = validatedFields.data;

    // DB接続
    await connectDB();

    // ユーザー存在確認
    const user = await User.findOne({ email });
    
    // セキュリティのため、ユーザーが存在しなくても成功レスポンスを返す
    if (!user) {
      console.log('❌ User not found for reset request:', email);
      // タイミング攻撃防止のため、存在する場合と同じレスポンス
      return NextResponse.json({
        message: 'パスワードリセット用のメールを送信しました。メール内のリンクをクリックして、新しいパスワードを設定してください。',
      });
    }

    console.log('✅ User found for reset:', email);

    // 既存のパスワードリセットトークンを削除
    await VerificationToken.deleteMany({ 
      identifier: email, 
      type: 'password-reset' 
    });

    // パスワードリセットトークン生成（1時間有効）
    console.log('🔑 Creating password reset token...');
    const resetToken = await VerificationToken.createPasswordResetToken(email, 1);
    console.log('✅ Reset token created');

    // パスワードリセットメール送信
    console.log('📧 Sending password reset email...');
    try {
      await sendPasswordResetEmail(email, user.name, resetToken.token);
      console.log('✅ Password reset email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send reset email:', emailError);
      
      // メール送信失敗の場合はトークンも削除
      await VerificationToken.deleteOne({ _id: resetToken._id });
      
      return NextResponse.json(
        { error: 'メール送信に失敗しました。しばらく待ってから再度お試しください。' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'パスワードリセット用のメールを送信しました。メール内のリンクをクリックして、新しいパスワードを設定してください。',
    });

  } catch (error) {
    console.error('❌ Password reset request error:', error);
    
    return NextResponse.json(
      { 
        error: 'パスワードリセット要求の処理に失敗しました。しばらく待ってから再度お試しください。',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined 
      },
      { status: 500 }
    );
  }
}