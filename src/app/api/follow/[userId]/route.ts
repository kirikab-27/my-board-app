import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Follow from '@/models/Follow';

/**
 * 特定ユーザーのフォロー関連情報API
 * GET: フォロワー・フォロー中リスト取得
 */

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'followers' | 'following'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // バリデーション
    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    if (!['followers', 'following'].includes(type || '')) {
      return NextResponse.json(
        { error: 'typeパラメータは "followers" または "following" である必要があります' },
        { status: 400 }
      );
    }

    await connectDB();

    const skip = (page - 1) * limit;

    if (type === 'followers') {
      // フォロワー一覧取得
      const [followers, total] = await Promise.all([
        Follow.find({ following: userId, isAccepted: true })
          .populate('follower', 'name username avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Follow.countDocuments({ following: userId, isAccepted: true })
      ]);

      return NextResponse.json({
        followers: followers.map(f => ({
          id: f.follower._id,
          name: f.follower.name,
          username: f.follower.username,
          avatar: f.follower.avatar,
          followedAt: f.followedAt,
          isAccepted: f.isAccepted
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          hasNextPage: skip + followers.length < total,
          hasPrevPage: page > 1
        }
      }, { status: 200 });

    } else {
      // フォロー中一覧取得
      const [following, total] = await Promise.all([
        Follow.find({ follower: userId, isAccepted: true })
          .populate('following', 'name username avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Follow.countDocuments({ follower: userId, isAccepted: true })
      ]);

      return NextResponse.json({
        following: following.map(f => ({
          id: f.following._id,
          name: f.following.name,
          username: f.following.username,
          avatar: f.following.avatar,
          followedAt: f.followedAt,
          isAccepted: f.isAccepted
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          hasNextPage: skip + following.length < total,
          hasPrevPage: page > 1
        }
      }, { status: 200 });
    }

  } catch (error) {
    console.error('フォロー関係取得エラー:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'フォロー関係の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}