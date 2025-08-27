import { NextRequest, NextResponse } from 'next/server';
import Hashtag from '@/models/Hashtag';
import connectDB from '@/lib/mongodb';

// GET /api/hashtags/search - ハッシュタグ検索API
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // クエリパラメータ取得
    const q = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const category = searchParams.get('category');
    const exact = searchParams.get('exact') === 'true'; // 完全一致検索
    const includeDeprecated = searchParams.get('includeDeprecated') === 'true';

    // バリデーション
    if (!q) {
      return NextResponse.json(
        { error: '検索キーワードが必要です' },
        { status: 400 }
      );
    }

    if (q.length < 1) {
      return NextResponse.json(
        { error: '検索キーワードは1文字以上である必要があります' },
        { status: 400 }
      );
    }

    if (limit < 1) {
      return NextResponse.json(
        { error: 'limitは1以上である必要があります' },
        { status: 400 }
      );
    }

    // 検索キーワードの正規化
    const normalizedQuery = q.toLowerCase().replace(/^#/, '');

    // フィルタ条件構築
    const filter: any = {
      isBlocked: false
    };

    if (!includeDeprecated) {
      filter.status = { $ne: 'deprecated' };
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    let hashtags: any[] = [];

    if (exact) {
      // 完全一致検索
      filter.$or = [
        { name: normalizedQuery },
        { displayName: { $regex: new RegExp(`^${normalizedQuery}$`, 'i') } },
        { aliases: normalizedQuery }
      ];

      hashtags = await Hashtag.find(filter)
        .sort({ 'stats.totalPosts': -1 })
        .limit(limit)
        .select({
          name: 1,
          displayName: 1,
          description: 1,
          category: 1,
          stats: 1,
          isTrending: 1,
          isOfficial: 1
        });
    } else {
      // 部分一致検索（複数の検索方法を組み合わせ）
      
      // 1. テキスト検索インデックスを使用
      const textSearchResults = await Hashtag.find({
        ...filter,
        $text: { $search: normalizedQuery }
      }, {
        score: { $meta: 'textScore' }
      })
      .sort({ 
        score: { $meta: 'textScore' },
        'stats.totalPosts': -1 
      })
      .limit(Math.ceil(limit / 2))
      .select({
        name: 1,
        displayName: 1,
        description: 1,
        category: 1,
        stats: 1,
        isTrending: 1,
        isOfficial: 1
      });

      // 2. 正規表現検索（前方一致・部分一致）
      const regexSearchResults = await Hashtag.find({
        ...filter,
        $or: [
          { name: { $regex: new RegExp(normalizedQuery, 'i') } },
          { displayName: { $regex: new RegExp(normalizedQuery, 'i') } },
          { searchTerms: { $regex: new RegExp(normalizedQuery, 'i') } },
          { aliases: { $regex: new RegExp(normalizedQuery, 'i') } }
        ]
      })
      .sort({ 'stats.totalPosts': -1 })
      .limit(Math.ceil(limit / 2))
      .select({
        name: 1,
        displayName: 1,
        description: 1,
        category: 1,
        stats: 1,
        isTrending: 1,
        isOfficial: 1
      });

      // 結果をマージして重複除去
      const mergedResults = [...textSearchResults, ...regexSearchResults];
      const uniqueResults = mergedResults.filter((item, index, array) => 
        array.findIndex(t => t._id.toString() === item._id.toString()) === index
      );

      // スコアリング（関連度計算）
      hashtags = uniqueResults
        .map(hashtag => {
          let score = 0;
          
          // 完全一致ボーナス
          if (hashtag.name === normalizedQuery || hashtag.displayName.toLowerCase() === normalizedQuery) {
            score += 100;
          }
          
          // 前方一致ボーナス
          if (hashtag.name.startsWith(normalizedQuery) || hashtag.displayName.toLowerCase().startsWith(normalizedQuery)) {
            score += 50;
          }
          
          // 人気度ボーナス
          score += Math.min(hashtag.stats?.totalPosts || 0, 50);
          
          // トレンドボーナス
          if (hashtag.isTrending) {
            score += 25;
          }
          
          // 公式タグボーナス
          if (hashtag.isOfficial) {
            score += 15;
          }

          return { ...hashtag.toObject(), searchScore: score };
        })
        .sort((a, b) => b.searchScore - a.searchScore)
        .slice(0, limit);
    }

    // 検索統計情報
    const searchStats = {
      query: q,
      normalizedQuery,
      resultCount: hashtags.length,
      searchType: exact ? 'exact' : 'fuzzy',
      category: category || 'all',
      timestamp: new Date()
    };

    // 人気の関連検索キーワード取得（オプション）
    const relatedKeywords = await Hashtag.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: new RegExp(normalizedQuery.slice(0, -1), 'i') } },
            { searchTerms: { $regex: new RegExp(normalizedQuery.slice(0, -1), 'i') } }
          ],
          status: 'active',
          isBlocked: false
        }
      },
      {
        $group: {
          _id: '$name',
          displayName: { $first: '$displayName' },
          totalPosts: { $first: '$stats.totalPosts' }
        }
      },
      {
        $sort: { totalPosts: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return NextResponse.json({
      hashtags,
      searchStats,
      relatedKeywords: relatedKeywords.map(item => ({
        name: item._id,
        displayName: item.displayName
      })),
      success: true
    });

  } catch (error) {
    console.error('ハッシュタグ検索エラー:', error);
    return NextResponse.json(
      { error: 'ハッシュタグ検索に失敗しました' },
      { status: 500 }
    );
  }
}