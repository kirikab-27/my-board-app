import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // MongoDB のテキスト検索を使用
    // 部分一致検索のため正規表現を使用
    const searchRegex = new RegExp(query.trim(), 'i'); // 大文字小文字を区別しない

    const posts = await Post.find({
      content: { $regex: searchRegex }
    })
    .sort({ createdAt: -1 }) // 新しい順にソート
    .skip(offset)
    .limit(Math.min(limit, 100)) // 最大100件まで
    .lean(); // パフォーマンス向上のためPlainObjectで取得

    // 総件数も取得（ページネーション用）
    const totalCount = await Post.countDocuments({
      content: { $regex: searchRegex }
    });

    return NextResponse.json({
      posts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + posts.length < totalCount
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