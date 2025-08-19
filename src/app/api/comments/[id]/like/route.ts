import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import User from '@/models/User';
import Notification from '@/models/Notification';
import AuditLog from '@/models/AuditLog';

interface Params {
  id: string;
}

// コメントいいね追加 (POST /api/comments/[id]/like)
export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  try {
    await connectDB();

    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // コメント取得
    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: 'コメントが見つかりません' }, { status: 404 });
    }

    // 既にいいね済みかチェック
    if (comment.likedBy.includes(session.user.id)) {
      return NextResponse.json({ error: '既にいいね済みです' }, { status: 400 });
    }

    // いいね追加
    comment.likedBy.push(session.user.id);
    comment.likes = comment.likedBy.length;
    comment.stats.likes = comment.likes;
    await comment.save();

    // ユーザー情報取得
    const user = await User.findById(session.user.id);

    // 通知作成（自分のコメントでない場合）
    if (comment.userId !== session.user.id && user) {
      try {
        await Notification.create({
          type: 'like_comment',
          userId: comment.userId,
          fromUserId: session.user.id,
          fromUserName: user.name,
          title: 'コメントいいね',
          message: `${user.name}さんがあなたのコメントにいいねしました`,
          metadata: {
            postId: comment.postId,
            commentId: comment._id.toString(),
          },
          priority: 'normal' as const,
        });
      } catch (notificationError) {
        console.error('通知作成エラー:', notificationError);
      }
    }

    // 監査ログ記録
    try {
      await AuditLog.create({
        action: 'comment_like',
        userId: session.user.id,
        userEmail: session.user.email,
        resourceType: 'comment',
        resourceId: comment._id.toString(),
        details: {
          postId: comment.postId,
          parentId: comment.parentId,
          newLikeCount: comment.likes,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    } catch (auditError) {
      console.error('監査ログ記録エラー:', auditError);
    }

    return NextResponse.json({
      message: 'いいねしました',
      likes: comment.likes,
      likedBy: comment.likedBy,
      liked: true,
    });
  } catch (error) {
    console.error('コメントいいねエラー:', error);
    return NextResponse.json({ error: 'いいねの追加に失敗しました' }, { status: 500 });
  }
}

// コメントいいね取り消し (DELETE /api/comments/[id]/like)
export async function DELETE(request: Request, { params }: { params: Promise<Params> }) {
  try {
    await connectDB();

    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // コメント取得
    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: 'コメントが見つかりません' }, { status: 404 });
    }

    // いいね済みかチェック
    if (!comment.likedBy.includes(session.user.id)) {
      return NextResponse.json({ error: 'いいねしていません' }, { status: 400 });
    }

    // いいね取り消し
    comment.likedBy = comment.likedBy.filter((userId: string) => userId !== session.user.id);
    comment.likes = comment.likedBy.length;
    comment.stats.likes = comment.likes;
    await comment.save();

    // 監査ログ記録
    try {
      await AuditLog.create({
        action: 'comment_unlike',
        userId: session.user.id,
        userEmail: session.user.email,
        resourceType: 'comment',
        resourceId: comment._id.toString(),
        details: {
          postId: comment.postId,
          parentId: comment.parentId,
          newLikeCount: comment.likes,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    } catch (auditError) {
      console.error('監査ログ記録エラー:', auditError);
    }

    return NextResponse.json({
      message: 'いいねを取り消しました',
      likes: comment.likes,
      likedBy: comment.likedBy,
      liked: false,
    });
  } catch (error) {
    console.error('コメントいいね取り消しエラー:', error);
    return NextResponse.json({ error: 'いいね取り消しに失敗しました' }, { status: 500 });
  }
}

// コメントいいね状態確認 (GET /api/comments/[id]/like)
export async function GET(request: Request, { params }: { params: Promise<Params> }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // コメント取得
    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: 'コメントが見つかりません' }, { status: 404 });
    }

    // セッション取得
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // いいね状態確認
    const isLiked = userId ? comment.likedBy.includes(userId) : false;

    return NextResponse.json({
      likes: comment.likes,
      likedBy: comment.likedBy,
      liked: isLiked,
    });
  } catch (error) {
    console.error('コメントいいね状態取得エラー:', error);
    return NextResponse.json({ error: 'いいね状態の取得に失敗しました' }, { status: 500 });
  }
}
