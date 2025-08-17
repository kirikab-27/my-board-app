import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import mongoose from 'mongoose';
import Follow from '@/models/Follow';
import Post from '@/models/Post';
import * as Sentry from '@sentry/nextjs';

// タイムライン取得API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor'); // 無限スクロール用
    
    await mongoose.connect(process.env.MONGODB_URI!);

    const currentUserId = session.user.id;
    
    // パフォーマンス最適化: フォロー中のユーザーID一覧を事前取得
    const followedUsers = await Follow.find({
      follower: currentUserId,
      isAccepted: true
    }).select('following').lean();
    
    const followedUserIds = followedUsers.map(f => f.following);
    
    // 自分の投稿も含める
    const targetUserIds = [currentUserId, ...followedUserIds];
    
    // MongoDB集約パイプラインでタイムライン構築
    const aggregationPipeline = [
      // 1. 対象ユーザーの投稿をフィルタ
      {
        $match: {
          userId: { $in: targetUserIds },
          isDeleted: { $ne: true },
          isPublic: true,
          ...(cursor ? { createdAt: { $lt: new Date(cursor) } } : {})
        }
      },
      
      // 2. 投稿者情報をlookup
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1,
                isVerified: 1
              }
            }
          ]
        }
      },
      
      // 3. フォロー関係情報をlookup
      {
        $lookup: {
          from: 'follows',
          let: { authorId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', new mongoose.Types.ObjectId(currentUserId)] },
                    { $eq: ['$following', '$$authorId'] },
                    { $eq: ['$isAccepted', true] }
                  ]
                }
              }
            }
          ],
          as: 'followInfo'
        }
      },
      
      // 4. メディア情報をlookup（画像・動画がある場合）
      {
        $lookup: {
          from: 'media',
          localField: 'mediaIds',
          foreignField: '_id',
          as: 'media',
          pipeline: [
            {
              $project: {
                type: 1,
                url: 1,
                thumbnailUrl: 1,
                alt: 1,
                width: 1,
                height: 1
              }
            }
          ]
        }
      },
      
      // 5. データ整形
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] },
          isFollowing: { $gt: [{ $size: '$followInfo' }, 0] },
          relativeTime: {
            $dateToString: {
              format: '%Y-%m-%d %H:%M:%S',
              date: '$createdAt'
            }
          }
        }
      },
      
      // 6. 不要フィールド除去
      {
        $project: {
          followInfo: 0,
          __v: 0,
          updatedAt: 0
        }
      },
      
      // 7. 新しい順でソート
      { $sort: { createdAt: -1 as 1 | -1 } },
      
      // 8. ページネーション
      { $skip: cursor ? 0 : (page - 1) * limit },
      { $limit: limit }
    ];

    // 集約クエリ実行
    const timelineStart = Date.now();
    const timelinePosts = await Post.aggregate(aggregationPipeline);
    const queryTime = Date.now() - timelineStart;
    
    // パフォーマンス監視（1秒以上の場合は警告）
    if (queryTime > 1000) {
      Sentry.captureMessage(`タイムライン取得が遅い: ${queryTime}ms`, 'warning');
    }
    
    // 次のページ用のカーソル設定
    const nextCursor = timelinePosts.length > 0 ? 
      timelinePosts[timelinePosts.length - 1].createdAt.toISOString() : 
      null;
    
    // ユーザーがフォローしている人数とフォロワー数も取得（UX向上）
    const [followingCount, followerCount] = await Promise.all([
      Follow.countDocuments({ follower: currentUserId, isAccepted: true }),
      Follow.countDocuments({ following: currentUserId, isAccepted: true })
    ]);
    
    // レスポンス構築
    const response = {
      posts: timelinePosts,
      pagination: {
        currentPage: page,
        hasNextPage: timelinePosts.length === limit,
        nextCursor,
        totalLoaded: (page - 1) * limit + timelinePosts.length
      },
      metadata: {
        followingCount,
        followerCount,
        queryTime: `${queryTime}ms`,
        targetUsers: targetUserIds.length
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('タイムライン取得エラー:', error);
    
    Sentry.captureException(error, {
      tags: { 
        operation: 'timeline-fetch',
        userId: request.headers.get('x-user-id') 
      },
      extra: { 
        url: request.url,
        userAgent: request.headers.get('user-agent')
      }
    });

    return NextResponse.json(
      { 
        error: 'タイムラインの取得中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// 新着投稿チェック API（リアルタイム更新用）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { lastCheckTime } = await request.json();
    
    if (!lastCheckTime) {
      return NextResponse.json(
        { error: 'lastCheckTimeが必要です' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const currentUserId = session.user.id;
    
    // フォロー中のユーザーID取得
    const followedUsers = await Follow.find({
      follower: currentUserId,
      isAccepted: true
    }).select('following').lean();
    
    const targetUserIds = [currentUserId, ...followedUsers.map(f => f.following)];
    
    // 最後のチェック時刻以降の新着投稿数を取得
    const newPostsCount = await Post.countDocuments({
      userId: { $in: targetUserIds },
      isDeleted: { $ne: true },
      isPublic: true,
      createdAt: { $gt: new Date(lastCheckTime) }
    });
    
    return NextResponse.json({
      hasNewPosts: newPostsCount > 0,
      newPostsCount,
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('新着チェックエラー:', error);
    
    Sentry.captureException(error, {
      tags: { operation: 'timeline-new-posts-check' }
    });

    return NextResponse.json(
      { error: '新着チェック中にエラーが発生しました' },
      { status: 500 }
    );
  }
}