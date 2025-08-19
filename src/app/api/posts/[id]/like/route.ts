import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';
import { getClientIP } from '@/utils/getClientIP';
import { getApiAuth, createServerErrorResponse } from '@/lib/auth/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    // 認証情報取得（任意 - 匿名ユーザーも対応）
    const session = await getApiAuth(request);
    const identifier = session?.user?.id || getClientIP(request);
    const isAuthenticated = !!session?.user;

    console.log('👍 いいね追加:', {
      postId: id,
      userId: session?.user?.id,
      email: session?.user?.email,
      identifier,
      isAuthenticated,
    });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な投稿IDです' }, { status: 400 });
    }

    // 既にいいね済みかチェック
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    if (existingPost.likedBy.includes(identifier)) {
      return NextResponse.json({ error: '既にいいね済みです' }, { status: 409 });
    }

    // いいねを追加（認証ユーザー: UserID、匿名ユーザー: IPアドレス）
    const post = await Post.findByIdAndUpdate(
      id,
      {
        $inc: { likes: 1 },
        $push: { likedBy: identifier },
      },
      { new: true, runValidators: true }
    );

    console.log('✅ いいね追加成功:', {
      postId: post._id,
      totalLikes: post.likes,
      likedByCount: post.likedBy.length,
      isAuthenticated,
    });

    // 認証ユーザーの場合は投稿者に通知を送信
    if (isAuthenticated && post.userId && post.userId !== session.user.id) {
      try {
        const likerUser = await User.findById(session.user.id).select('name').lean() as { name?: string } | null;
        
        await (Notification as any).createNotification({
          type: 'like_post',
          title: 'いいね通知',
          userId: post.userId,
          fromUserId: session.user.id,
          fromUserName: likerUser?.name || 'ユーザー',
          metadata: {
            postId: post._id.toString(),
          },
          priority: 'normal',
        });
      } catch (notificationError) {
        console.error('いいね通知作成エラー:', notificationError);
        // 通知作成エラーでもいいね処理は継続
      }
    }

    return NextResponse.json({
      message: 'いいねしました',
      likes: post!.likes,
      liked: true,
    });
  } catch (error) {
    console.error('❌ いいね追加エラー:', error);
    return createServerErrorResponse('いいねに失敗しました');
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    // 認証情報取得（任意）
    const session = await getApiAuth(request);
    const identifier = session?.user?.id || getClientIP(request);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な投稿IDです' }, { status: 400 });
    }

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    const liked = post.likedBy.includes(identifier);

    return NextResponse.json({
      likes: post.likes,
      liked: liked,
    });
  } catch (error) {
    console.error('❌ いいね状態取得エラー:', error);
    return createServerErrorResponse('いいね状態の取得に失敗しました');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // 認証情報取得（任意）
    const session = await getApiAuth(request);
    const identifier = session?.user?.id || getClientIP(request);
    const isAuthenticated = !!session?.user;

    console.log('👎 いいね削除:', {
      postId: id,
      userId: session?.user?.id,
      email: session?.user?.email,
      identifier,
      isAuthenticated,
    });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な投稿IDです' }, { status: 400 });
    }

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    if (!post.likedBy.includes(identifier)) {
      return NextResponse.json({ error: 'まだいいねしていません' }, { status: 400 });
    }

    if (post.likes <= 0) {
      return NextResponse.json({ error: 'いいねを取り消すことはできません' }, { status: 400 });
    }

    // いいねを取り消し（認証ユーザー: UserID、匿名ユーザー: IPアドレス）
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        $inc: { likes: -1 },
        $pull: { likedBy: identifier },
      },
      { new: true, runValidators: true }
    );

    console.log('✅ いいね削除成功:', {
      postId: updatedPost._id,
      totalLikes: updatedPost.likes,
      likedByCount: updatedPost.likedBy.length,
      isAuthenticated,
    });

    return NextResponse.json({
      message: 'いいねを取り消しました',
      likes: updatedPost!.likes,
      liked: false,
    });
  } catch (error) {
    console.error('❌ いいね削除エラー:', error);
    return createServerErrorResponse('いいねの取り消しに失敗しました');
  }
}
