import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
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
    
    // ページネーション計算
    const skip = (page - 1) * limit;
    
    // データ取得
    const [posts, totalCount] = await Promise.all([
      Post.find({})
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({})
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
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '投稿内容を入力してください' },
        { status: 400 }
      );
    }

    if (content.length > 200) {
      return NextResponse.json(
        { error: '投稿は200文字以内で入力してください' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    // 過去5分以内の同じ内容の投稿をチェック
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicatePost = await Post.findOne({
      content: trimmedContent,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (duplicatePost) {
      return NextResponse.json(
        { error: '同じ内容の投稿が5分以内に既に投稿されています' },
        { status: 409 }
      );
    }

    const post = new Post({ content: trimmedContent });
    await post.save();

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}