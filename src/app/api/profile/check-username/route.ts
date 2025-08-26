import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { z } from 'zod';

// ユーザー名チェック用バリデーション
const usernameCheckSchema = z.object({
  username: z.string()
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(30, 'ユーザー名は30文字以内で入力してください')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます'),
});

// GET: ユーザー名の使用可能性チェック
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'ユーザー名が必要です' }, { status: 400 });
    }

    // バリデーション
    const validationResult = usernameCheckSchema.safeParse({ username });
    if (!validationResult.success) {
      return NextResponse.json({
        available: false,
        error: validationResult.error.issues[0]?.message || 'ユーザー名の形式が正しくありません',
      });
    }

    // 予約語チェック
    const reservedUsernames = [
      'admin', 'api', 'www', 'mail', 'support', 'help', 
      'blog', 'news', 'about', 'contact', 'privacy', 'terms',
      'login', 'register', 'dashboard', 'profile', 'settings',
      'board', 'post', 'comment', 'user', 'users', 'timeline',
      'hashtag', 'hashtags', 'notification', 'notifications'
    ];

    if (reservedUsernames.includes(username.toLowerCase())) {
      return NextResponse.json({
        available: false,
        error: 'このユーザー名は予約されているため使用できません',
      });
    }

    await dbConnect();

    // 現在のユーザーの情報を取得
    const currentUser = await User.findById(session.user.id).select('username');
    
    // 現在のユーザー名と同じ場合は使用可能
    if (currentUser?.username === username) {
      return NextResponse.json({
        available: true,
        message: '現在のユーザー名です',
      });
    }

    // 他のユーザーが使用していないかチェック
    const existingUser = await User.findOne({ 
      username: username.toLowerCase() 
    }).select('_id');

    if (existingUser) {
      return NextResponse.json({
        available: false,
        error: 'このユーザー名は既に使用されています',
      });
    }

    return NextResponse.json({
      available: true,
      message: 'このユーザー名は使用可能です',
    });

  } catch (error) {
    console.error('❌ Username check error:', error);
    return NextResponse.json(
      { error: 'ユーザー名の確認中にエラーが発生しました' }, 
      { status: 500 }
    );
  }
}