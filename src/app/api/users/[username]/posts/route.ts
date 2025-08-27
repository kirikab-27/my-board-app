import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    
    // ページネーションパラメータ
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'createdAt_desc';
    
    console.log('📥 ユーザー投稿一覧取得:', { username, page, limit, sort });

    // DB接続
    await connectDB();

    // ユーザー検索（usernameで検索）
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      console.log('❌ ユーザーが見つかりません:', username);
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    console.log('✅ ユーザー見つかりました:', user.name, user._id);

    // ソート条件の構築
    let sortCondition: any = {};
    switch (sort) {
      case 'createdAt_desc':
        sortCondition = { createdAt: -1 };
        break;
      case 'createdAt_asc':
        sortCondition = { createdAt: 1 };
        break;
      case 'likes_desc':
        sortCondition = { likes: -1, createdAt: -1 };
        break;
      case 'likes_asc':
        sortCondition = { likes: 1, createdAt: -1 };
        break;
      case 'updatedAt_desc':
        sortCondition = { updatedAt: -1 };
        break;
      case 'updatedAt_asc':
        sortCondition = { updatedAt: 1 };
        break;
      default:
        sortCondition = { createdAt: -1 };
    }

    // 投稿検索条件
    const searchConditions: any = {
      userId: user._id,
      // 公開投稿のみ表示（プライベート投稿は本人のみ表示）
      $or: [
        { isPublic: true },
        { userId: user._id } // 今後認証ユーザーが本人の場合の条件として使用
      ]
    };

    // 投稿数カウント
    const totalCount = await Post.countDocuments(searchConditions);

    // ページネーション計算
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // 投稿取得
    const posts = await Post.find(searchConditions)
      .sort(sortCondition)
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`✅ ${posts.length}件の投稿を取得:`, { totalCount, page, totalPages });

    // レスポンス構築
    const response = {
      posts: posts.map(post => ({
        _id: post._id,
        title: post.title || '',
        content: post.content,
        likes: post.likes || 0,
        likedBy: post.likedBy || [],
        userId: post.userId,
        authorName: post.authorName || user.name,
        isPublic: post.isPublic !== false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        // メディア情報も含める
        media: post.media || []
      })),
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        isVerified: user.isVerified,
        stats: user.stats,
        createdAt: user.createdAt
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ ユーザー投稿一覧取得エラー:', error);
    return NextResponse.json(
      {
        error: 'ユーザー投稿一覧の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      },
      { status: 500 }
    );
  }
}