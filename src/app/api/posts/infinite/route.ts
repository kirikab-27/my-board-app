import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import User from '@/models/User';
import Follow from '@/models/Follow';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import mongoose, { SortOrder } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor') || null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const type = searchParams.get('type') || 'board'; // timeline | board | user
    const username = searchParams.get('username') || null;
    const sortBy = searchParams.get('sortBy') || 'createdAt_desc'; // ソート条件

    // セッション取得（タイムライン用）
    const session = await getServerSession(authOptions);

    // ソート条件の構築
    const getSortCondition = (sortBy: string): Record<string, SortOrder> => {
      switch (sortBy) {
        case 'createdAt_desc':
          return { _id: -1 as SortOrder }; // ObjectIdは作成日時順
        case 'createdAt_asc':
          return { _id: 1 as SortOrder };
        case 'likes_desc':
          return { likes: -1 as SortOrder, _id: -1 as SortOrder };
        case 'likes_asc':
          return { likes: 1 as SortOrder, _id: -1 as SortOrder };
        case 'updatedAt_desc':
          return { updatedAt: -1 as SortOrder, _id: -1 as SortOrder };
        case 'updatedAt_asc':
          return { updatedAt: 1 as SortOrder, _id: -1 as SortOrder };
        default:
          return { _id: -1 as SortOrder };
      }
    };

    const sortCondition = getSortCondition(sortBy);

    // クエリ条件の構築
    let query: any = {};
    
    // カーソル設定（ソート条件に応じた比較演算子を設定）
    if (cursor) {
      const cursorObjectId = new mongoose.Types.ObjectId(cursor);
      
      // ソート条件に応じてカーソルの比較方向を決定
      switch (sortBy) {
        case 'createdAt_desc':
          query._id = { $lt: cursorObjectId };
          break;
        case 'createdAt_asc':
          query._id = { $gt: cursorObjectId };
          break;
        case 'likes_desc':
        case 'likes_asc':
        case 'updatedAt_desc':
        case 'updatedAt_asc':
          // 複合ソートの場合は、ObjectIdで補助的にページング
          query._id = { $lt: cursorObjectId };
          break;
        default:
          query._id = { $lt: cursorObjectId };
      }
    }

    // タイプ別のクエリ条件設定
    switch (type) {
      case 'timeline':
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: 'タイムラインの閲覧には認証が必要です' },
            { status: 401 }
          );
        }
        
        // フォローしているユーザーの投稿を取得
        const follows = await Follow.find({ 
          follower: session.user.id,
          status: 'active' 
        }).select('following');
        
        const followingIds = follows.map(f => f.following);
        // 自分の投稿も含める
        followingIds.push(session.user.id);
        
        query.userId = { $in: followingIds };
        break;
        
      case 'user':
        if (!username) {
          return NextResponse.json(
            { error: 'ユーザー名が指定されていません' },
            { status: 400 }
          );
        }
        
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
          return NextResponse.json(
            { error: 'ユーザーが見つかりません' },
            { status: 404 }
          );
        }
        
        query.userId = user._id;
        break;
        
      case 'board':
      default:
        // 全体の投稿（公開投稿のみ）
        query.isPublic = { $ne: false };
        break;
    }

    // ソート条件を適用した投稿取得（limit+1件取得して次ページ判定）
    const posts = await Post.find(query)
      .sort(sortCondition)
      .limit(limit + 1)
      .populate('userId', 'name email avatar username displayName')
      .populate('hashtags', 'name count')
      .lean();

    // 次ページの存在確認
    const hasNextPage = posts.length > limit;
    const resultPosts = hasNextPage ? posts.slice(0, limit) : posts;
    
    // 次のカーソル（最後の投稿のID）
    const nextCursor = hasNextPage && resultPosts.length > 0 
      ? (resultPosts[resultPosts.length - 1] as any)._id.toString()
      : null;

    // 総投稿数の取得（初回のみ）
    let totalCount = null;
    if (!cursor) {
      // カーソルなし（初回読み込み）の場合のみ総数を計算
      const countQuery = { ...query };
      delete countQuery._id; // カーソル条件を除外
      totalCount = await Post.countDocuments(countQuery);
    }

    // コメント件数を含めた投稿の整形
    const formattedPosts = await Promise.all(
      resultPosts.map(async (post: any) => {
        const userId = post.userId && post.userId._id ? {
          _id: post.userId._id.toString(),
          name: post.userId.name || '',
          email: post.userId.email || '',
          avatar: post.userId.avatar,
          username: post.userId.username,
          displayName: post.userId.displayName
        } : undefined;

        // コメント件数を取得
        const commentCount = await Comment.countDocuments({ postId: post._id });

        return {
          ...post,
          _id: post._id.toString(),
          userId,
          hashtags: post.hashtags || [],
          commentsCount: commentCount,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString()
        };
      })
    );

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        nextCursor,
        hasNextPage,
        totalCount
      }
    });

  } catch (error) {
    console.error('Infinite scroll API error:', error);
    return NextResponse.json(
      { error: 'データの取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}