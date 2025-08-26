import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { z } from 'zod';

// プロフィール更新用バリデーション
const profileUpdateSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(50, '名前は50文字以内で入力してください'),
  username: z.string()
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(30, 'ユーザー名は30文字以内で入力してください')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます')
    .optional(),
  bio: z.string().max(300, '自己紹介は300文字以内で入力してください').optional(),
  website: z.string().max(200, 'ウェブサイトURLは200文字以内で入力してください').optional(),
  location: z.string().max(100, '位置情報は100文字以内で入力してください').optional(),
  avatar: z.string().optional(),
});

// GET: プロフィール取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select('-password').lean();

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 型安全性確保のためunknown経由でキャスト
    const safeUser = user as unknown as {
      _id: any;
      name: string;
      username?: string;
      email: string;
      bio?: string;
      website?: string;
      location?: string;
      avatar?: string;
      emailVerified: Date | null;
      role: string;
      createdAt: Date;
      updatedAt: Date;
    };

    return NextResponse.json({
      success: true,
      user: {
        id: safeUser._id.toString(),
        name: safeUser.name,
        username: safeUser.username || '',
        email: safeUser.email,
        bio: safeUser.bio || '',
        website: safeUser.website || '',
        location: safeUser.location || '',
        avatar: safeUser.avatar || '',
        emailVerified: safeUser.emailVerified,
        role: safeUser.role,
        createdAt: safeUser.createdAt,
        updatedAt: safeUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Profile GET error:', error);
    return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
  }
}

// PUT: プロフィール更新（名前・自己紹介）
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();

    // バリデーション
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'バリデーションエラー',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, username, bio, website, location, avatar } = validationResult.data;

    await dbConnect();

    // ユーザー名重複チェック（変更時のみ）
    if (username) {
      const currentUser = await User.findById(session.user.id).select('username');
      
      // 現在のユーザー名と異なる場合のみ重複チェック
      if (currentUser?.username !== username) {
        const existingUser = await User.findOne({ username }).select('_id');
        if (existingUser) {
          return NextResponse.json(
            { error: 'このユーザー名は既に使用されています' },
            { status: 400 }
          );
        }
      }
    }

    // ユーザー更新
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        name,
        ...(username && { username }), // usernameが提供された場合のみ更新
        bio: bio || '',
        website: website || '',
        location: location || '',
        avatar: avatar || '',
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
        select: '-password',
      }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'プロフィールを更新しました',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        username: updatedUser.username || '',
        email: updatedUser.email,
        bio: updatedUser.bio || '',
        website: updatedUser.website || '',
        location: updatedUser.location || '',
        avatar: updatedUser.avatar || '',
        emailVerified: updatedUser.emailVerified,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Profile PUT error:', error);
    return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
  }
}
