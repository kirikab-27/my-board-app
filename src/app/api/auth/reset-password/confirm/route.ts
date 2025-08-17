import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';
import { z } from 'zod';

// バリデーションスキーマ
const resetConfirmSchema = z
  .object({
    token: z.string().min(1, 'トークンが必要です'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .max(100, 'パスワードは100文字以内で入力してください')
      .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'パスワードは英数字を含む必要があります'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📥 Password reset confirm request');

    // バリデーション
    const validatedFields = resetConfirmSchema.safeParse(body);
    if (!validatedFields.success) {
      console.error('❌ Validation failed:', validatedFields.error.flatten().fieldErrors);
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = validatedFields.data;

    // DB接続
    await connectDB();

    // トークン検証
    console.log('🔑 Verifying reset token...');
    const resetToken = await VerificationToken.findOne({
      token,
      type: 'password-reset',
      expires: { $gt: new Date() }, // 有効期限チェック
    });

    if (!resetToken) {
      console.error('❌ Invalid or expired reset token');
      return NextResponse.json(
        {
          error:
            'リセットトークンが無効または期限切れです。再度パスワードリセットを要求してください。',
        },
        { status: 400 }
      );
    }

    console.log('✅ Reset token verified for:', resetToken.identifier);

    // ユーザー検索とパスワード更新
    const user = await User.findOne({ email: resetToken.identifier });
    if (!user) {
      console.error('❌ User not found for reset:', resetToken.identifier);
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }

    // パスワード更新（bcryptハッシュ化は User model の pre-save で実行される）
    console.log('🔐 Updating password...');
    user.password = password;
    await user.save();

    // 使用済みトークン削除
    await VerificationToken.deleteOne({ _id: resetToken._id });
    console.log('✅ Used reset token deleted');

    // セキュリティのため、そのユーザーの全リセットトークンを削除
    await VerificationToken.deleteMany({
      identifier: resetToken.identifier,
      type: 'password-reset',
    });

    console.log('✅ Password reset completed for:', user.email);

    return NextResponse.json({
      message: 'パスワードが正常に更新されました。新しいパスワードでログインしてください。',
    });
  } catch (error) {
    console.error('❌ Password reset confirm error:', error);

    return NextResponse.json(
      {
        error: 'パスワードリセットの処理に失敗しました。しばらく待ってから再度お試しください。',
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
