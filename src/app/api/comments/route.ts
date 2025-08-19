import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import User from '@/models/User';
import Notification from '@/models/Notification';
import AuditLog from '@/models/AuditLog';

// コメント一覧取得 (GET /api/comments)
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'asc';

    if (!postId) {
      return NextResponse.json({ error: '投稿IDが必要です' }, { status: 400 });
    }

    // 投稿の存在確認
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    // セッション取得（認証は必須ではない）
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // ソート設定
    const sortOrder = order === 'desc' ? -1 : 1;
    let sortOptions: any = {};

    switch (sortBy) {
      case 'likes':
        sortOptions = { 'stats.likes': sortOrder, createdAt: 1 };
        break;
      case 'replies':
        sortOptions = { 'stats.replies': sortOrder, createdAt: 1 };
        break;
      default:
        sortOptions = { createdAt: sortOrder };
    }

    // 基本クエリ（最上位コメントのみ）
    const query = {
      postId,
      type: 'comment',
      isDeleted: { $ne: true },
      isHidden: { $ne: true },
    };

    // ページネーション計算
    const skip = (page - 1) * limit;

    // コメント取得
    const comments = await Comment.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email image')
      .lean();

    // 親コメント情報を含む返信取得関数を更新
    const getRepliesRecursivelyWithParent = async (
      parentId: string,
      depth = 0,
      maxDepth = 5
    ): Promise<any[]> => {
      if (depth >= maxDepth) return [];

      const replies = await Comment.find({
        parentId,
        isDeleted: { $ne: true },
        isHidden: { $ne: true },
      })
        .sort({ createdAt: 1 })
        .limit(10)
        .populate('userId', 'name email image')
        .lean();

      // 各返信に親コメント情報を追加
      const repliesWithParent = await Promise.all(
        replies.map(async (reply: any) => {
          // 親コメント情報を取得
          const parentComment = await Comment.findById(parentId)
            .populate('userId', 'name email image')
            .lean();

          const childReplies = await getRepliesRecursivelyWithParent(
            reply._id,
            depth + 1,
            maxDepth
          );
          const childCount = await Comment.countDocuments({
            parentId: reply._id,
            isDeleted: { $ne: true },
            isHidden: { $ne: true },
          });

          const replyIsLiked = userId ? reply.likedBy.includes(userId) : false;

          return {
            ...reply,
            replies: childReplies,
            totalReplies: childCount,
            isLiked: replyIsLiked,
            parentComment: parentComment
              ? {
                  _id: (parentComment as any)._id,
                  user: (parentComment as any).userId,
                  authorName: (parentComment as any).authorName,
                }
              : null,
            depth: depth + 1,
          };
        })
      );

      return repliesWithParent;
    };

    // 各コメントの返信を取得
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: any) => {
        // 返信を再帰的に取得（親コメント情報付き）
        const replies = await getRepliesRecursivelyWithParent(comment._id);

        // 返信総数（全階層）
        const totalReplies = await Comment.countDocuments({
          parentId: comment._id,
          isDeleted: { $ne: true },
          isHidden: { $ne: true },
        });

        // 現在ユーザーのいいね状態
        const isLiked = userId ? comment.likedBy.includes(userId) : false;

        return {
          ...comment,
          replies,
          totalReplies,
          hasMoreReplies: totalReplies > 10,
          isLiked,
          user: comment.userId,
          parentComment: null, // 最上位コメントは親なし
          depth: 0, // 最上位コメントは深度0
        };
      })
    );

    // 総数取得
    const totalCount = await Comment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      comments: commentsWithReplies,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('コメント取得エラー:', error);
    return NextResponse.json({ error: 'コメントの取得に失敗しました' }, { status: 500 });
  }
}

// コメント作成 (POST /api/comments)
export async function POST(request: Request) {
  try {
    await connectDB();

    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { content, postId, parentId } = body;

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

    if (!postId) {
      return NextResponse.json({ error: '投稿IDが必要です' }, { status: 400 });
    }

    // 投稿の存在確認
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    // ユーザー情報取得
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 親コメントの確認（返信の場合）
    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return NextResponse.json({ error: '親コメントが見つかりません' }, { status: 404 });
      }

      // 深すぎるネストを防ぐ
      if (parentComment.depth >= 10) {
        return NextResponse.json({ error: 'コメントのネストが深すぎます' }, { status: 400 });
      }
    }

    // コメント作成
    const comment = new Comment({
      content: content.trim(),
      type: parentId ? 'reply' : 'comment',
      postId,
      parentId,
      userId: session.user.id,
      authorName: user.name,
      stats: { likes: 0, replies: 0, reports: 0 },
    });

    await comment.save();

    // 投稿の統計更新
    await Post.findByIdAndUpdate(postId, {
      $inc: { 'stats.comments': 1 },
    });

    // 親コメントの統計更新（返信の場合）
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentId, {
        $inc: { 'stats.replies': 1 },
      });
    }

    // 通知作成
    try {
      // 投稿者への通知（自分のコメントでない場合）
      if (post.userId && post.userId !== session.user.id) {
        await Notification.create({
          type: 'comment',
          userId: post.userId,
          fromUserId: session.user.id,
          fromUserName: user.name,
          title: '投稿コメント',
          message: `${user.name}さんがあなたの投稿にコメントしました`,
          metadata: {
            postId: postId,
            commentId: comment._id.toString(),
          },
          priority: 'normal' as const,
        });
      }

      // 親コメント作成者への通知（返信の場合、自分でない場合）
      if (parentComment && parentComment.userId !== session.user.id) {
        await Notification.create({
          type: 'reply',
          userId: parentComment.userId,
          fromUserId: session.user.id,
          fromUserName: user.name,
          title: 'コメント返信',
          message: `${user.name}さんがあなたのコメントに返信しました`,
          metadata: {
            postId: postId,
            commentId: comment._id.toString(),
            parentCommentId: parentId,
          },
          priority: 'normal' as const,
        });
      }
    } catch (notificationError) {
      console.error('通知作成エラー:', notificationError);
      // 通知エラーはコメント作成を失敗させない
    }

    // 監査ログ記録
    try {
      await AuditLog.create({
        action: 'comment_create',
        userId: session.user.id,
        userEmail: session.user.email,
        resourceType: 'comment',
        resourceId: comment._id.toString(),
        method: 'POST',
        path: '/api/comments',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        severity: 'low',
        type: 'user_action',
        details: {
          postId,
          parentId,
          contentLength: content.length,
          type: comment.type,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    } catch (auditError) {
      console.error('監査ログ記録エラー:', auditError);
    }

    // 作成されたコメントを返す
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email image')
      .lean();

    return NextResponse.json(
      {
        message: 'コメントを作成しました',
        comment: {
          ...populatedComment,
          isLiked: false,
          replies: [],
          totalReplies: 0,
          hasMoreReplies: false,
          user: (populatedComment as any)?.userId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('コメント作成エラー:', error);
    return NextResponse.json({ error: 'コメントの作成に失敗しました' }, { status: 500 });
  }
}
