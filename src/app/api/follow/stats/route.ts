import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Follow from '@/models/Follow';

/**
 * フォロー統計情報API
 * GET: フォロワー数・フォロー中数・相互フォロー情報
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    
    // 認証チェック（統計情報なので未認証でも一部情報は取得可能）
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    await connectDB();

    // 基本統計情報を並列取得
    const [
      followerCount,
      followingCount,
      relationToTarget
    ] = await Promise.all([
      // フォロワー数
      Follow.countDocuments({ following: targetUserId, isAccepted: true }),
      
      // フォロー中数
      Follow.countDocuments({ follower: targetUserId, isAccepted: true }),
      
      // 現在のユーザーとの関係
      currentUserId && currentUserId !== targetUserId ? Follow.findOne({
        follower: currentUserId,
        following: targetUserId
      }) : null
    ]);

    // 相互フォロー数を別途計算（より効率的な方法）
    let mutualFollowsCount = 0;
    if (followingCount > 0) {
      // このユーザーがフォローしている人のIDを取得
      const followingUsers = await Follow.find({ 
        follower: targetUserId, 
        isAccepted: true 
      }).select('following');
      
      const followingIds = followingUsers.map(f => f.following);
      
      if (followingIds.length > 0) {
        // その中で自分をフォローバックしている人の数を計算
        mutualFollowsCount = await Follow.countDocuments({
          follower: { $in: followingIds },
          following: targetUserId,
          isAccepted: true
        });
      }
    }

    // 相互フォロー判定
    const isMutualFollow = currentUserId && currentUserId !== targetUserId ? 
      await (Follow as any).areMutualFollowers(currentUserId, targetUserId) : false;

    // 統計情報をまとめて返却
    const stats = {
      followerCount,
      followingCount,
      mutualFollowsCount,
      
      // 現在のユーザーとの関係（認証済みの場合のみ）
      relationship: currentUserId && currentUserId !== targetUserId ? {
        isFollowing: relationToTarget?.isAccepted || false,
        isPending: relationToTarget?.isPending || false,
        isMutual: isMutualFollow,
        followedAt: relationToTarget?.followedAt || null
      } : null
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error('フォロー統計取得エラー:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'フォロー統計の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 詳細統計情報（認証必須）
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

    const { userId } = await request.json();
    const targetUserId = userId || session.user.id;

    // 自分の情報または公開情報のみアクセス可能
    if (targetUserId !== session.user.id) {
      // TODO: プライバシー設定のチェックを追加
      // 現在は簡易実装として、他のユーザーの詳細統計は取得不可
      return NextResponse.json(
        { error: '詳細統計は自分の情報のみ取得できます' },
        { status: 403 }
      );
    }

    await connectDB();

    // 詳細統計情報を並列取得
    const [
      recentFollowers,
      recentFollowing,
      pendingRequests,
      blockedUsers
    ] = await Promise.all([
      // 最近のフォロワー（直近10人）
      Follow.find({ following: targetUserId, isAccepted: true })
        .populate('follower', 'name username avatar')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // 最近フォローしたユーザー（直近10人）
      Follow.find({ follower: targetUserId, isAccepted: true })
        .populate('following', 'name username avatar')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // 承認待ちリクエスト数
      Follow.countDocuments({ following: targetUserId, isPending: true }),
      
      // ブロック済みユーザー数
      Follow.countDocuments({ follower: targetUserId, status: 'blocked' })
    ]);

    const detailedStats = {
      recentFollowers: recentFollowers.map(f => ({
        id: f.follower._id,
        name: f.follower.name,
        username: f.follower.username,
        avatar: f.follower.avatar,
        followedAt: f.followedAt
      })),
      recentFollowing: recentFollowing.map(f => ({
        id: f.following._id,
        name: f.following.name,
        username: f.following.username,
        avatar: f.following.avatar,
        followedAt: f.followedAt
      })),
      pendingRequestsCount: pendingRequests,
      blockedUsersCount: blockedUsers
    };

    return NextResponse.json(detailedStats, { status: 200 });

  } catch (error) {
    console.error('詳細フォロー統計取得エラー:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: '詳細フォロー統計の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}