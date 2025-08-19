import { NextRequest, NextResponse } from 'next/server';
import Hashtag from '@/models/Hashtag';
import connectDB from '@/lib/mongodb';

// GET /api/hashtags/trending - トレンドハッシュタグAPI
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // クエリパラメータ取得
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const category = searchParams.get('category');
    const timeframe = searchParams.get('timeframe') || '24h'; // 24h, 7d, 30d
    const includeOfficial = searchParams.get('includeOfficial') !== 'false';

    // バリデーション
    if (limit < 1) {
      return NextResponse.json(
        { error: 'limitは1以上である必要があります' },
        { status: 400 }
      );
    }

    // フィルタ条件構築
    const filter: any = {
      status: 'active',
      isBlocked: false,
      isTrending: true
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (!includeOfficial) {
      filter.isOfficial = false;
    }

    // 期間フィルタ（最後の使用日時）
    const now = new Date();
    let timeLimit: Date;

    switch (timeframe) {
      case '24h':
        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    filter['stats.lastUsed'] = { $gte: timeLimit };

    // トレンドハッシュタグ取得
    const trendingHashtags = await Hashtag.find(filter)
      .sort({ 
        'stats.trendScore': -1,
        'stats.totalPosts': -1,
        'stats.weeklyGrowth': -1
      })
      .limit(limit)
      .select({
        name: 1,
        displayName: 1,
        description: 1,
        category: 1,
        stats: 1,
        isTrending: 1,
        isOfficial: 1,
        createdAt: 1
      });

    // カテゴリ別統計も取得
    const categoryStats = await Hashtag.aggregate([
      {
        $match: {
          status: 'active',
          isBlocked: false,
          'stats.lastUsed': { $gte: timeLimit }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalPosts: { $sum: '$stats.totalPosts' },
          avgTrendScore: { $avg: '$stats.trendScore' },
          topHashtag: { 
            $first: {
              name: '$name',
              displayName: '$displayName',
              trendScore: '$stats.trendScore'
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // トレンド統計情報
    const trendStats = {
      totalTrending: trendingHashtags.length,
      averageScore: trendingHashtags.reduce((sum, tag) => sum + (tag.stats?.trendScore || 0), 0) / trendingHashtags.length || 0,
      categoryBreakdown: categoryStats,
      timeframe,
      lastUpdated: new Date()
    };

    return NextResponse.json({
      trendingHashtags,
      stats: trendStats,
      success: true
    });

  } catch (error) {
    console.error('トレンドハッシュタグ取得エラー:', error);
    return NextResponse.json(
      { error: 'トレンドハッシュタグの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST /api/hashtags/trending - トレンド計算更新（管理者・システム用）
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { updateAll = false, tagNames = [] } = body;

    let updatedCount = 0;
    let hashtags: any[] = [];

    if (updateAll) {
      // 全ハッシュタグのトレンドスコア更新
      hashtags = await Hashtag.find({ 
        status: 'active',
        isBlocked: false 
      });
    } else if (tagNames.length > 0) {
      // 指定されたハッシュタグのみ更新
      hashtags = await Hashtag.find({ 
        name: { $in: tagNames },
        status: 'active',
        isBlocked: false 
      });
    }

    // 各ハッシュタグのトレンドスコア計算・更新
    for (const hashtag of hashtags) {
      try {
        await hashtag.updateStats();
        const newTrendScore = await hashtag.calculateTrendScore();
        
        hashtag.stats.trendScore = newTrendScore;
        hashtag.isTrending = newTrendScore > 70;
        
        await hashtag.save();
        updatedCount++;
      } catch (error) {
        console.error(`ハッシュタグ ${hashtag.name} の更新に失敗:`, error);
      }
    }

    return NextResponse.json({
      message: `${updatedCount}個のハッシュタグのトレンド情報を更新しました`,
      updatedCount,
      success: true
    });

  } catch (error) {
    console.error('トレンド計算更新エラー:', error);
    return NextResponse.json(
      { error: 'トレンド計算更新に失敗しました' },
      { status: 500 }
    );
  }
}