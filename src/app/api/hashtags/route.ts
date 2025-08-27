
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import Hashtag from '@/models/Hashtag';
import connectDB from '@/lib/mongodb';

// GET /api/hashtags - ハッシュタグ一覧・統計取得API
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // クエリパラメータ取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'totalPosts'; // totalPosts, trendScore, createdAt
    const order = searchParams.get('order') || 'desc';
    const status = searchParams.get('status') || 'active';

    // バリデーション
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'ページとlimitは1以上である必要があります' },
        { status: 400 }
      );
    }

    // フィルタ条件構築
    const filter: any = {
      status: status,
      isBlocked: false
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    // ソート条件構築
    const sortOptions: any = {};
    switch (sortBy) {
      case 'totalPosts':
        sortOptions['stats.totalPosts'] = order === 'asc' ? 1 : -1;
        break;
      case 'trendScore':
        sortOptions['stats.trendScore'] = order === 'asc' ? 1 : -1;
        break;
      case 'createdAt':
        sortOptions.createdAt = order === 'asc' ? 1 : -1;
        break;
      case 'lastUsed':
        sortOptions['stats.lastUsed'] = order === 'asc' ? 1 : -1;
        break;
      default:
        sortOptions['stats.totalPosts'] = -1;
    }

    // データ取得
    const skip = (page - 1) * limit;
    
    const [hashtags, totalCount] = await Promise.all([
      Hashtag.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select({
          name: 1,
          displayName: 1,
          description: 1,
          category: 1,
          stats: 1,
          isTrending: 1,
          isOfficial: 1,
          createdAt: 1,
          'relatedTags.tagName': 1,
          'relatedTags.correlation': 1
        }),
      Hashtag.countDocuments(filter)
    ]);

    // ページネーション情報
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      hashtags,
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
    console.error('ハッシュタグ取得エラー:', error);
    return NextResponse.json(
      { error: 'ハッシュタグの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST /api/hashtags - 新しいハッシュタグ作成（管理者・モデレーター用）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 認証チェック
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // 権限チェック（管理者・モデレーターのみ）
    if (!['admin', 'moderator'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'この操作を実行する権限がありません' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, displayName, description, category = 'general', isOfficial = false } = body;

    // バリデーション
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'ハッシュタグ名は必須です' },
        { status: 400 }
      );
    }

    const normalizedName = name.toLowerCase().replace(/^#/, '');

    // 重複チェック
    const existingHashtag = await Hashtag.findOne({ name: normalizedName });
    if (existingHashtag) {
      return NextResponse.json(
        { error: 'このハッシュタグは既に存在します' },
        { status: 409 }
      );
    }

    // 新しいハッシュタグ作成
    const hashtag = new Hashtag({
      name: normalizedName,
      displayName: displayName || normalizedName,
      description,
      category,
      createdBy: session.user.id,
      creatorName: session.user.name,
      isOfficial,
      status: 'active',
      stats: {
        totalPosts: 0,
        totalComments: 0,
        uniqueUsers: 0,
        weeklyGrowth: 0,
        monthlyGrowth: 0,
        trendScore: 0,
        dailyStats: []
      }
    });

    await hashtag.save();

    return NextResponse.json({
      hashtag: {
        _id: hashtag._id,
        name: hashtag.name,
        displayName: hashtag.displayName,
        description: hashtag.description,
        category: hashtag.category,
        isOfficial: hashtag.isOfficial,
        stats: hashtag.stats,
        createdAt: hashtag.createdAt
      },
      message: 'ハッシュタグを作成しました',
      success: true
    }, { status: 201 });

  } catch (error) {
    console.error('ハッシュタグ作成エラー:', error);
    return NextResponse.json(
      { error: 'ハッシュタグの作成に失敗しました' },
      { status: 500 }
    );
  }
}