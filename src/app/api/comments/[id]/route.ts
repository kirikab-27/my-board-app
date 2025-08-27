import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';

interface Params {
  id: string;
}

// コメント詳細取得 (GET /api/comments/[id])
export async function GET(request: Request, { params }: { params: Promise<Params> }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // コメント取得
    const comment = await Comment.findById(id).populate('userId', 'name email image').lean();

    if (!comment) {
      return NextResponse.json({ error: 'コメントが見つかりません' }, { status: 404 });
    }

    // セッション取得
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 閲覧権限チェック
    const canView = await (comment as any).canUserView(userId);
    if (!canView) {
      return NextResponse.json(
        { error: 'このコメントを閲覧する権限がありません' },
        { status: 403 }
      );
    }

    // 返信取得
    const replies = await Comment.find({
      parentId: (comment as any)._id,
      isDeleted: { $ne: true },
      isHidden: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .populate('userId', 'name email image')
      .lean();

    // 現在ユーザーのいいね状態
    const isLiked = userId ? (comment as any).likedBy.includes(userId) : false;

    return NextResponse.json({
      comment: {
        ...comment,
        replies,
        totalReplies: replies.length,
        isLiked,
        user: (comment as any).userId,
      },
    });
  } catch (error) {
    console.error('コメント取得エラー:', error);
    return NextResponse.json({ error: 'コメントの取得に失敗しました' }, { status: 500 });
  }
}

// コメント更新 (PUT /api/comments/[id])
export async function PUT(request: Request, { params }: { params: Promise<Params> }) {
  try {
    await connectDB();

    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { content } = body;

    // バリデーション
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'コメント内容を入力してください' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'コメントは500文字以内で入力してください' },
        { status: 400 }
      );
    }

    // コメント取得
    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: 'コメントが見つかりません' }, { status: 404 });
    }

    // 編集権限チェック
    const canEdit = comment.canUserEdit(session.user.id);
    if (!canEdit) {
      return NextResponse.json(
        { error: 'このコメントを編集する権限がありません' },
        { status: 403 }
      );
    }

    // コメント更新
    comment.content = content.trim();
    await comment.save();

    // 監査ログ記録
    try {
      await AuditLog.create({
        action: 'comment_update',
        userId: session.user.id,
        userEmail: session.user.email,
        resourceType: 'comment',
        resourceId: comment._id.toString(),
        method: 'PUT',
        path: `/api/comments/${comment._id}`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        severity: 'low',
        type: 'user_action',
        details: {
          postId: comment.postId,
          parentId: comment.parentId,
          contentLength: content.length,
          isEdited: comment.isEdited,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    } catch (auditError) {
      console.error('監査ログ記録エラー:', auditError);
    }

    // 更新されたコメントを返す
    const updatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email image')
      .lean();

    return NextResponse.json({
      message: 'コメントを更新しました',
      comment: {
        ...updatedComment,
        user: (updatedComment as any)?.userId,
      },
    });
  } catch (error) {
    console.error('コメント更新エラー:', error);
    return NextResponse.json({ error: 'コメントの更新に失敗しました' }, { status: 500 });
  }
}

// コメント削除 (DELETE /api/comments/[id])
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

    // 削除権限チェック
    const canDelete = await comment.canUserDelete(session.user.id);
    if (!canDelete) {
      return NextResponse.json(
        { error: 'このコメントを削除する権限がありません' },
        { status: 403 }
      );
    }

    // 論理削除（updateOne使用でバリデーション回避）
    await Comment.updateOne(
      { _id: comment._id },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { runValidators: false }
    );

    // 投稿の統計更新
    await mongoose.models.Post.findByIdAndUpdate(comment.postId, {
      $inc: { 'stats.comments': -1 },
    });

    // 親コメントの統計更新（返信の場合）
    if (comment.parentId) {
      // 現在の返信数を確認してから更新
      const parentComment = await Comment.findById(comment.parentId);
      if (parentComment && parentComment.stats.replies > 0) {
        await Comment.updateOne(
          { _id: comment.parentId },
          {
            $inc: { 'stats.replies': -1 },
          },
          { runValidators: false }
        );
      }
    }

    // 子コメント（返信）も論理削除
    await Comment.updateMany(
      { parentId: comment._id },
      {
        isDeleted: true,
        deletedAt: new Date(),
      }
    );

    // 監査ログ記録
    try {
      await AuditLog.create({
        action: 'comment_delete',
        userId: session.user.id,
        userEmail: session.user.email,
        resourceType: 'comment',
        resourceId: comment._id.toString(),
        method: 'DELETE',
        path: `/api/comments/${comment._id}`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        severity: 'medium',
        type: 'user_action',
        details: {
          postId: comment.postId,
          parentId: comment.parentId,
          type: comment.type,
          hasReplies: comment.stats.replies > 0,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    } catch (auditError) {
      console.error('監査ログ記録エラー:', auditError);
    }

    return NextResponse.json({
      message: 'コメントを削除しました',
      commentId: comment._id,
    });
  } catch (error) {
    console.error('コメント削除エラー:', error);
    return NextResponse.json({ error: 'コメントの削除に失敗しました' }, { status: 500 });
  }
}
