import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Follow from '@/models/Follow';
import User from '@/models/User';

/**
 * フォロー関係の作成・削除API
 * POST: フォロー実行
 * DELETE: フォロー解除
 */

// フォロー実行
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { targetUserId } = await request.json();

    // バリデーション
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'フォロー対象のユーザーIDが必要です' },
        { status: 400 }
      );
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: '自分自身をフォローすることはできません' },
        { status: 400 }
      );
    }

    await connectDB();

    // フォロー対象ユーザーの存在確認
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 既存のフォロー関係をチェック
    const existingFollow = await Follow.findOne({
      follower: session.user.id,
      following: targetUserId
    });

    if (existingFollow) {
      // 既にフォローしている場合は状態に応じて処理
      if (existingFollow.status === 'blocked') {
        return NextResponse.json(
          { error: 'このユーザーはブロックされています' },
          { status: 403 }
        );
      }

      if (existingFollow.status === 'accepted') {
        return NextResponse.json(
          { message: '既にフォローしています', follow: existingFollow },
          { status: 200 }
        );
      }

      if (existingFollow.status === 'pending') {
        return NextResponse.json(
          { message: 'フォローリクエストは承認待ちです', follow: existingFollow },
          { status: 200 }
        );
      }
    }

    // 新しいフォロー関係を作成
    const newFollow = new Follow({
      follower: session.user.id,
      following: targetUserId,
      followedAt: new Date()
    });

    await newFollow.save();

    // ユーザー統計を更新
    await newFollow.updateUserStats();

    return NextResponse.json({
      message: targetUser.isPrivate ? 'フォローリクエストを送信しました' : 'フォローしました',
      follow: newFollow
    }, { status: 201 });

  } catch (error) {
    console.error('フォロー作成エラー:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'フォローの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// フォロー解除
export async function DELETE(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    // バリデーション
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'フォロー解除対象のユーザーIDが必要です' },
        { status: 400 }
      );
    }

    await connectDB();

    // フォロー関係を検索
    const follow = await Follow.findOne({
      follower: session.user.id,
      following: targetUserId
    });

    if (!follow) {
      return NextResponse.json(
        { error: 'フォロー関係が見つかりません' },
        { status: 404 }
      );
    }

    // フォロー関係を削除
    await Follow.deleteOne({ _id: follow._id });

    // ユーザー統計を更新
    const User = (await import('@/models/User')).default;
    const [followerUser, followingUser] = await Promise.all([
      User.findById(session.user.id),
      User.findById(targetUserId)
    ]);

    if (followerUser) {
      await followerUser.updateStats();
    }
    if (followingUser) {
      await followingUser.updateStats();
    }

    return NextResponse.json({
      message: 'フォローを解除しました'
    }, { status: 200 });

  } catch (error) {
    console.error('フォロー解除エラー:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'フォロー解除の処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// フォロー状態取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    await connectDB();

    // フォロー関係を検索
    const follow = await Follow.findOne({
      follower: session.user.id,
      following: targetUserId
    });

    return NextResponse.json({
      isFollowing: !!follow && follow.isAccepted,
      isPending: !!follow && follow.isPending,
      follow: follow || null
    }, { status: 200 });

  } catch (error) {
    console.error('フォロー状態取得エラー:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'フォロー状態の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}