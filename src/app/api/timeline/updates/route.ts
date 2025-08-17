import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import mongoose from 'mongoose';
import Follow from '@/models/Follow';
import Post from '@/models/Post';
import * as Sentry from '@sentry/nextjs';

// リアルタイム新着更新チェック専用API
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
    const since = searchParams.get('since'); // 最後の取得時刻
    const includePreview = searchParams.get('preview') === 'true'; // プレビューを含むか
    
    if (!since) {
      return NextResponse.json(
        { error: 'sinceパラメータが必要です' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const currentUserId = session.user.id;
    const sinceDate = new Date(since);
    
    // フォロー中のユーザーID取得（キャッシュ最適化）
    const followedUsers = await Follow.find({
      follower: currentUserId,
      isAccepted: true
    }).select('following').lean();
    
    const targetUserIds = [currentUserId, ...followedUsers.map(f => f.following)];
    
    // 新着投稿の集約クエリ
    const newPostsAggregation = [
      {
        $match: {
          userId: { $in: targetUserIds },
          isDeleted: { $ne: true },
          isPublic: true,
          createdAt: { $gt: sinceDate }
        }
      },
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
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] }
        }
      },
      {
        $sort: { createdAt: -1 as 1 | -1 }
      }
    ];
    
    // プレビューが必要な場合は詳細情報も取得
    if (includePreview) {
      newPostsAggregation.push({ $limit: 3 } as any); // プレビューは最大3件
    } else {
      // カウントのみの場合
      newPostsAggregation.push({ $count: 'total' } as any);
    }
    
    const result = await Post.aggregate(newPostsAggregation);
    
    if (includePreview) {
      // プレビュー付きレスポンス
      return NextResponse.json({
        hasNewPosts: result.length > 0,
        newPostsCount: result.length,
        previewPosts: result.map(post => ({
          id: post._id,
          content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          author: post.author,
          createdAt: post.createdAt
        })),
        lastChecked: new Date().toISOString()
      });
    } else {
      // カウントのみレスポンス
      const count = result.length > 0 ? result[0].total : 0;
      
      return NextResponse.json({
        hasNewPosts: count > 0,
        newPostsCount: count,
        lastChecked: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('新着更新チェックエラー:', error);
    
    Sentry.captureException(error, {
      tags: { operation: 'timeline-updates-check' }
    });

    return NextResponse.json(
      { error: '新着更新チェック中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 特定の投稿以降の新着情報取得
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { latestPostId, maxResults = 10 } = await request.json();
    
    await mongoose.connect(process.env.MONGODB_URI!);

    const currentUserId = session.user.id;
    
    // 最新投稿の作成日時を取得
    let sinceDate = new Date(0); // デフォルトは epoch
    
    if (latestPostId) {
      const latestPost = await Post.findById(latestPostId).select('createdAt');
      if (latestPost) {
        sinceDate = latestPost.createdAt;
      }
    }
    
    // フォロー中のユーザーID取得
    const followedUsers = await Follow.find({
      follower: currentUserId,
      isAccepted: true
    }).select('following').lean();
    
    const targetUserIds = [currentUserId, ...followedUsers.map(f => f.following)];
    
    // 新着投稿を取得（軽量版）
    const newPosts = await Post.aggregate([
      {
        $match: {
          userId: { $in: targetUserIds },
          isDeleted: { $ne: true },
          isPublic: true,
          createdAt: { $gt: sinceDate }
        }
      },
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
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: maxResults
      },
      {
        $project: {
          title: 1,
          content: 1,
          likes: 1,
          createdAt: 1,
          author: 1,
          mediaIds: 1
        }
      }
    ]);
    
    return NextResponse.json({
      newPosts,
      count: newPosts.length,
      hasMore: newPosts.length === maxResults,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('新着投稿取得エラー:', error);
    
    Sentry.captureException(error, {
      tags: { operation: 'timeline-fetch-new-posts' }
    });

    return NextResponse.json(
      { error: '新着投稿の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}