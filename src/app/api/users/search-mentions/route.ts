import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// メンション検索用API
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query || query.length < 1) {
      return NextResponse.json({ users: [] });
    }

    // データベース接続
    await dbConnect();

    // 日本語テキスト正規化（Issue #22の既存機能を活用）
    const normalizeText = (text: string): string => {
      return text
        .normalize('NFKC')
        // ひらがなをカタカナに変換
        .replace(/[\u3041-\u3096]/g, (match) => 
          String.fromCharCode(match.charCodeAt(0) + 0x60)
        )
        // 全角英数字を半角に変換
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (match) => 
          String.fromCharCode(match.charCodeAt(0) - 0xFEE0)
        )
        .toLowerCase();
    };

    const normalizedQuery = normalizeText(query);
    const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // メンション用検索クエリ（パフォーマンス重視）
    const searchConditions = [
      // username検索（最優先）
      { username: { $regex: escapedQuery, $options: 'i' } },
      // name検索
      { name: { $regex: escapedQuery, $options: 'i' } },
      // displayName検索
      { displayName: { $regex: escapedQuery, $options: 'i' } }
    ];

    // 日本語正規化検索も追加（型エラー回避のため簡素化）
    // Note: normalizedName・normalizedUsernameフィールドがない場合はスキップ

    const users = await User.find({
      $or: searchConditions
    })
    .select('name username displayName avatar stats.followersCount')
    .limit(Math.min(limit, 10)) // 最大10件
    .lean()
    .exec();

    // レスポンス形式を統一（型キャスト）
    const formattedUsers = users.map(user => ({
      _id: (user._id as any)?.toString(),
      name: (user as any).name,
      username: (user as any).username,
      displayName: (user as any).displayName,
      avatar: (user as any).avatar,
      followersCount: (user as any).stats?.followersCount || 0
    }));

    // 関連度順でソート（username完全一致 > 前方一致 > 部分一致）
    const sortedUsers = formattedUsers.sort((a, b) => {
      const aUsername = (a.username || '').toLowerCase();
      const bUsername = (b.username || '').toLowerCase();
      const queryLower = query.toLowerCase();

      // username完全一致
      if (aUsername === queryLower && bUsername !== queryLower) return -1;
      if (bUsername === queryLower && aUsername !== queryLower) return 1;

      // username前方一致
      if (aUsername.startsWith(queryLower) && !bUsername.startsWith(queryLower)) return -1;
      if (bUsername.startsWith(queryLower) && !aUsername.startsWith(queryLower)) return 1;

      // フォロワー数順（人気順）
      return (b.followersCount || 0) - (a.followersCount || 0);
    });

    return NextResponse.json({ 
      users: sortedUsers,
      query: query,
      count: sortedUsers.length
    });

  } catch (error) {
    console.error('Mention search error:', error);
    return NextResponse.json(
      { error: '検索中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}