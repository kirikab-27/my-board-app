import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import mongoose from 'mongoose';
import { getClientIP } from '@/utils/getClientIP';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const clientIP = getClientIP(request);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '無効な投稿IDです' },
        { status: 400 }
      );
    }

    // 既にいいね済みかチェック
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    if (existingPost.likedBy.includes(clientIP)) {
      return NextResponse.json(
        { error: '既にいいね済みです' },
        { status: 409 }
      );
    }

    // いいねを追加（IPアドレスも記録）
    const post = await Post.findByIdAndUpdate(
      id,
      { 
        $inc: { likes: 1 },
        $push: { likedBy: clientIP }
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ 
      message: 'いいねしました',
      likes: post!.likes,
      liked: true
    });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { error: 'いいねに失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const clientIP = getClientIP(request);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '無効な投稿IDです' },
        { status: 400 }
      );
    }

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    const liked = post.likedBy.includes(clientIP);

    return NextResponse.json({ 
      likes: post.likes,
      liked: liked
    });
  } catch (error) {
    console.error('Error getting like status:', error);
    return NextResponse.json(
      { error: 'いいね状態の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const clientIP = getClientIP(request);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '無効な投稿IDです' },
        { status: 400 }
      );
    }

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    if (!post.likedBy.includes(clientIP)) {
      return NextResponse.json(
        { error: 'まだいいねしていません' },
        { status: 400 }
      );
    }

    if (post.likes <= 0) {
      return NextResponse.json(
        { error: 'いいねを取り消すことはできません' },
        { status: 400 }
      );
    }

    // いいねを取り消し（IPアドレスも削除）
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { 
        $inc: { likes: -1 },
        $pull: { likedBy: clientIP }
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ 
      message: 'いいねを取り消しました',
      likes: updatedPost!.likes,
      liked: false
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    return NextResponse.json(
      { error: 'いいねの取り消しに失敗しました' },
      { status: 500 }
    );
  }
}