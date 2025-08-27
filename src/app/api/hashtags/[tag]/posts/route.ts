import { NextRequest, NextResponse } from 'next/server';
import Post from '@/models/Post';
import Hashtag from '@/models/Hashtag';
import connectDB from '@/lib/mongodb';

// GET /api/hashtags/[tag]/posts - ハッシュタグ別投稿取得API
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ tag: string }> }
) {
  const resolvedParams = await params;
  try {
    await connectDB();

    const tagName = decodeURIComponent(resolvedParams.tag).toLowerCase().replace(/^#/, '');
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータ取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, likes, comments
    const order = searchParams.get('order') || 'desc';
    const includeReplies = searchParams.get('includeReplies') === 'true';

    // バリデーション
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'ページとlimitは1以上である必要があります' },
        { status: 400 }
      );
    }

    if (!tagName) {
      return NextResponse.json(
        { error: 'ハッシュタグ名が必要です' },
        { status: 400 }
      );
    }

    // ハッシュタグ存在確認
    const hashtag = await Hashtag.findOne({ 
      name: tagName,
      status: 'active',
      isBlocked: false
    });

    if (!hashtag) {
      return NextResponse.json(
        { error: 'ハッシュタグが見つかりません' },
        { status: 404 }
      );
    }

    // フィルタ条件構築
    const filter: any = {
      hashtags: tagName,
      isDeleted: { $ne: true },
      $or: [
        { privacy: 'public' },
        { isPublic: true }  // 既存データ互換性
      ]
    };

    // リプライ除外オプション
    if (!includeReplies) {
      filter.replyToId = { $exists: false };
    }

    // ソート条件構築
    const sortOptions: any = {};
    switch (sortBy) {
      case 'likes':
        sortOptions.likes = order === 'asc' ? 1 : -1;
        break;
      case 'comments':
        sortOptions['stats.comments'] = order === 'asc' ? 1 : -1;
        break;
      case 'createdAt':
        sortOptions.createdAt = order === 'asc' ? 1 : -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // データ取得
    const skip = (page - 1) * limit;
    
    const [posts, totalCount] = await Promise.all([
      Post.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select({
          title: 1,
          content: 1,
          userId: 1,
          authorName: 1,
          hashtags: 1,
          mentions: 1,
          media: 1,
          likes: 1,
          likedBy: 1,
          stats: 1,
          privacy: 1,
          isPublic: 1,
          type: 1,
          createdAt: 1,
          updatedAt: 1,
          isEdited: 1
        }),
      Post.countDocuments(filter)
    ]);

    // ユーザー情報を含める場合のポピュレート（オプション）
    const populatedPosts = await Post.populate(posts, {
      path: 'userId',
      select: 'name image username',
      model: 'User'
    });

    // ページネーション情報
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // ハッシュタグの統計情報も更新
    await hashtag.updateStats();

    return NextResponse.json({
      posts: populatedPosts,
      hashtag: {
        name: hashtag.name,
        displayName: hashtag.displayName,
        description: hashtag.description,
        category: hashtag.category,
        stats: hashtag.stats,
        isTrending: hashtag.isTrending,
        isOfficial: hashtag.isOfficial
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      },
      success: true
    });

  } catch (error) {
    console.error('ハッシュタグ別投稿取得エラー:', error);
    return NextResponse.json(
      { error: 'ハッシュタグ別投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}