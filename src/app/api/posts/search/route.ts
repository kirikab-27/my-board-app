import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: '検索クエリを入力してください' },
        { status: 400 }
      );
    }

    if (query.trim().length < 1) {
      return NextResponse.json(
        { error: '検索クエリは1文字以上で入力してください' },
        { status: 400 }
      );
    }

    // バリデーション
    if (page < 1) {
      return NextResponse.json(
        { error: 'ページ番号は1以上である必要があります' },
        { status: 400 }
      );
    }
    
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: '取得件数は1〜100の範囲で指定してください' },
        { status: 400 }
      );
    }

    // ソート条件の構築
    const sortOptions: { [key: string]: 1 | -1 } = {};
    const validSortFields = ['createdAt', 'updatedAt', 'likes'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: '無効なソートフィールドです' },
        { status: 400 }
      );
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { error: '無効なソート順です' },
        { status: 400 }
      );
    }
    
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // MongoDB のテキスト検索を使用
    // 部分一致検索のため正規表現を使用
    const searchRegex = new RegExp(query.trim(), 'i'); // 大文字小文字を区別しない
    const searchFilter = { content: { $regex: searchRegex } };

    // ページネーション計算
    const skip = (page - 1) * limit;

    // データ取得
    const [posts, totalCount] = await Promise.all([
      Post.find(searchFilter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(searchFilter)
    ]);

    // ページネーション情報
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      },
      query: query.trim()
    });

  } catch (error) {
    console.error('Error searching posts:', error);
    return NextResponse.json(
      { error: '検索に失敗しました' },
      { status: 500 }
    );
  }
}