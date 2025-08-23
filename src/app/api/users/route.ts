import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

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

    await dbConnect();

    // パラメータ取得
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, followers, recent, active
    const filter = searchParams.get('filter') || 'all'; // all, verified, online

    // セッションユーザーの権限取得
    const currentUserRole = (session.user as { role?: string }).role;
    
    // 検索クエリ構築
    const query: any = {};
    
    // 管理者の表示制御
    if (currentUserRole !== 'admin') {
      // 一般ユーザー：管理者を除外
      query.role = { $ne: 'admin' };
    }
    
    // 検索条件構築（拡張版）
    if (search) {
      // 日本語文字正規化（ひらがな・カタカナ・半角全角統一）
      const normalizedSearch = normalizeJapaneseText(search);
      
      // 拡張検索条件：name, username, displayName, bio, location
      const searchConditions = [
        { name: { $regex: normalizedSearch, $options: 'i' } },
        { username: { $regex: normalizedSearch, $options: 'i' } },
        { displayName: { $regex: normalizedSearch, $options: 'i' } },
        { bio: { $regex: normalizedSearch, $options: 'i' } },
        { location: { $regex: normalizedSearch, $options: 'i' } }
      ];
      
      // @記号での完全一致検索（@username形式）
      if (search.startsWith('@')) {
        const usernameQuery = search.substring(1);
        searchConditions.push({ username: { $regex: `^${usernameQuery}`, $options: 'i' } });
      }
      
      if (query.role) {
        // 既存の権限フィルターと検索条件を組み合わせ
        query.$and = [
          { role: query.role },
          { $or: searchConditions }
        ];
        delete query.role;  // $andに移動したので削除
      } else {
        query.$or = searchConditions;
      }
    }

    // フィルター条件追加
    if (filter === 'verified') {
      query.isVerified = true;
    } else if (filter === 'online') {
      query.isOnline = true;
    }

    // ソート条件決定
    let sortOptions: any = {};
    switch (sortBy) {
      case 'followers':
        sortOptions = { 'stats.followersCount': -1, createdAt: -1 };
        break;
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'active':
        sortOptions = { lastSeen: -1, 'stats.followersCount': -1 };
        break;
      case 'relevance':
      default:
        // 検索ありの場合は関連度、なしの場合はフォロワー数順
        sortOptions = search 
          ? { 'stats.followersCount': -1, lastSeen: -1 }
          : { 'stats.followersCount': -1, createdAt: -1 };
        break;
    }

    // ページネーション計算
    const skip = (page - 1) * limit;

    // ユーザー一覧取得（拡張フィールド対応・パスワード除外）
    const users = await User.find(query)
      .select('-password -preferences.notifications -role')
      .sort(sortOptions)
      .limit(limit)
      .skip(skip)
      .lean();

    // 総数取得
    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // おすすめユーザー生成（検索なしの場合）
    let suggestedUsers: any[] = [];
    if (!search && page === 1) {
      suggestedUsers = await getSuggestedUsers(session.user.id);
    }

    // 検索履歴保存（非同期・エラーは無視）
    if (search) {
      saveSearchHistory(session.user.id, search).catch(console.error);
    }

    // レスポンス（拡張フィールド対応）
    return NextResponse.json({
      users: users.filter((user: any) => user.username).map((user: any) => ({
        _id: user._id.toString(),
        name: user.name,
        username: user.username,
        displayName: user.displayName || user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        isVerified: user.isVerified || false,
        isOnline: user.isOnline || false,
        lastSeen: user.lastSeen,
        stats: {
          postsCount: user.stats?.postsCount || 0,
          followersCount: user.stats?.followersCount || 0,
          followingCount: user.stats?.followingCount || 0,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      suggestedUsers: suggestedUsers.slice(0, 5), // 最大5人
      searchMeta: {
        query: search,
        normalizedQuery: search ? normalizeJapaneseText(search) : '',
        filter,
        sortBy,
        hasResults: users.length > 0
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 日本語文字正規化関数
function normalizeJapaneseText(text: string): string {
  return text
    .normalize('NFKC') // Unicode正規化
    .replace(/[\u3041-\u3096]/g, (match) => // ひらがなをカタカナに変換
      String.fromCharCode(match.charCodeAt(0) + 0x60)
    )
    .replace(/[！-～]/g, (match) => // 全角記号を半角に変換
      String.fromCharCode(match.charCodeAt(0) - 0xFEE0)
    )
    .trim();
}

// おすすめユーザー取得関数
async function getSuggestedUsers(currentUserId: string): Promise<any[]> {
  try {
    // アクティブで人気のユーザーを取得（自分以外）
    const suggested = await User.find({
      _id: { $ne: currentUserId },
      isPrivate: false,
      'stats.followersCount': { $gte: 1 } // 最低1人のフォロワー
    })
    .select('-password -preferences.notifications -role -email')
    .sort({ 
      'stats.followersCount': -1, 
      lastSeen: -1 
    })
    .limit(10)
    .lean();

    return suggested;
  } catch (error) {
    console.error('おすすめユーザー取得エラー:', error);
    return [];
  }
}

// 検索履歴保存関数（簡易実装・本格版はRedis推奨）
const searchHistoryCache = new Map<string, string[]>();

async function saveSearchHistory(userId: string, searchTerm: string): Promise<void> {
  try {
    // 簡易的なメモリキャッシュ（本番環境ではRedisやDBを使用）
    const userHistory = searchHistoryCache.get(userId) || [];
    
    // 重複削除・先頭に追加・最大10件保持
    const filteredHistory = userHistory.filter(term => term !== searchTerm);
    filteredHistory.unshift(searchTerm);
    searchHistoryCache.set(userId, filteredHistory.slice(0, 10));
  } catch (error) {
    console.error('検索履歴保存エラー:', error);
  }
}

// 検索履歴取得API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const { action } = await request.json();
    
    if (action === 'getSearchHistory') {
      const history = searchHistoryCache.get(session.user.id) || [];
      return NextResponse.json({ history });
    }
    
    if (action === 'clearSearchHistory') {
      searchHistoryCache.delete(session.user.id);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: '無効なアクションです' }, { status: 400 });
  } catch (error) {
    console.error('検索履歴API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}