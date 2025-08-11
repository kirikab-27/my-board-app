import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { z } from 'zod';

// パスワード変更用バリデーション
const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(1, '現在のパスワードを入力してください'),
  newPassword: z.string()
    .min(8, '新しいパスワードは8文字以上で入力してください')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '新しいパスワードは英字と数字を含む必要があります'
    ),
  confirmPassword: z.string()
    .min(1, '確認用パスワードを入力してください'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

// PUT: パスワード変更
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // バリデーション
    const validationResult = passwordChangeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'バリデーションエラー',
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    await dbConnect();
    
    // ユーザー取得（パスワード含む）
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 現在のパスワードを確認
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 400 }
      );
    }

    // 同じパスワードでないか確認
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return NextResponse.json(
        { error: '新しいパスワードは現在のパスワードと異なるものにしてください' },
        { status: 400 }
      );
    }

    // パスワード更新（自動的にハッシュ化される）
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    // パスワード変更メール送信（将来的に実装）
    // await sendPasswordChangedEmail(user.email, user.name);

    return NextResponse.json({
      success: true,
      message: 'パスワードを変更しました'
    });
  } catch (error) {
    console.error('❌ Password change error:', error);
    return NextResponse.json(
      { error: 'パスワードの変更に失敗しました' },
      { status: 500 }
    );
  }
}