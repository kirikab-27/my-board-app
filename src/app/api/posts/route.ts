import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

export async function GET() {
  try {
    await dbConnect();
    const posts = await Post.find({}).sort({ createdAt: -1 });
    return NextResponse.json(posts);
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