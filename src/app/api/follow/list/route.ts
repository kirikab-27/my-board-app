import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Follow from '@/models/Follow';
import User from '@/models/User';

/**
 * フォロワー・フォロー中一覧API
 * GET: フォロワー一覧またはフォロー中一覧を取得
 */

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
    const targetUserId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'followers' | 'following'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    if (!type || !['followers', 'following'].includes(type)) {
      return NextResponse.json(
        { error: 'typeパラメータは "followers" または "following" である必要があります' },
        { status: 400 }
      );
    }

    await connectDB();

    // ページネーション計算
    const skip = (page - 1) * limit;

    let follows;
    let totalCount;

    if (type === 'followers') {
      // フォロワー一覧
      [follows, totalCount] = await Promise.all([
        Follow.find({ 
          following: targetUserId, 
          isAccepted: true 
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
        
        Follow.countDocuments({ 
          following: targetUserId, 
          isAccepted: true 
        })
      ]);
    } else {
      // フォロー中一覧
      [follows, totalCount] = await Promise.all([
        Follow.find({ 
          follower: targetUserId, 
          isAccepted: true 
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
        
        Follow.countDocuments({ 
          follower: targetUserId, 
          isAccepted: true 
        })
      ]);
    }

    // ユーザー情報を取得
    const userIds = follows.map(follow => 
      type === 'followers' ? follow.follower : follow.following
    );

    const users = await User.find({ 
      _id: { $in: userIds } 
    }).select('name email bio role createdAt');

    // フォロー情報とユーザー情報を結合
    const followList = follows.map(follow => {
      const userId = type === 'followers' ? follow.follower : follow.following;
      const user = users.find(u => u._id.toString() === userId);
      
      return {
        id: userId,
        name: user?.name || '不明なユーザー',
        email: user?.email,
        bio: user?.bio || '',
        role: user?.role || 'user',
        followedAt: follow.followedAt,
        createdAt: follow.createdAt
      };
    });

    // 現在のユーザーとの関係情報も取得（フォロー中かどうか）
    const currentUserId = session.user.id;
    const relationChecks = await Promise.all(
      followList.map(async (user) => {
        if (user.id === currentUserId) {
          return { ...user, isFollowedByCurrentUser: false, isSelf: true };
        }
        
        const relation = await Follow.findOne({
          follower: currentUserId,
          following: user.id,
          isAccepted: true
        });
        
        return { 
          ...user, 
          isFollowedByCurrentUser: !!relation,
          isSelf: false
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users: relationChecks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      type
    });

  } catch (error) {
    console.error(`${type}一覧取得エラー:`, error);
    return NextResponse.json(
      { error: `${type}一覧の取得に失敗しました` },
      { status: 500 }
    );
  }
}