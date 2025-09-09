import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

/**
 * 管理者投稿管理API
 * Issue #46 Phase 3: 投稿モデレーション・API統合
 */

// 投稿一覧取得
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    if (!session?.user || !userRole || !['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const search = searchParams.get('search') || searchParams.get('keyword') || '';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // データベース接続
    await dbConnect();

    // 検索条件構築
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'reported' || status === 'flagged') {
      query.reportCount = { $gt: 0 };
    } else if (status === 'hidden' || status === 'rejected') {
      query.isDeleted = true;
    } else if (status === 'public' || status === 'approved') {
      query.isPublic = true;
      query.isDeleted = { $ne: true };
    } else if (status === 'pending') {
      // ペンディングステータスは特に条件なし（すべて表示）
    }

    // ソート条件
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // データ取得
    const skip = (page - 1) * limit;
    const [posts, totalCount] = await Promise.all([
      Post.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Post.countDocuments(query),
    ]);

    // レスポンス成形（Postモデルのフィールドに基づく）
    const adminPostView = posts.map((post: any) => {
      // Postモデルに基づくフィールドマッピング
      // userId: 投稿者のユーザーID（文字列）
      // authorName: 投稿者名（表示用）
      // authorRole: 投稿者の役割

      return {
        _id: post._id.toString(),
        title: post.title || '',
        content: post.content || '',
        author: {
          _id: post.userId || 'unknown',
          name: post.authorName || 'Anonymous',
          email: '',
          username: post.authorName || 'anonymous',
        },
        authorName: post.authorName || 'Anonymous',
        likes: post.likes || 0,
        isPublic: post.isPublic !== false,
        isDeleted: post.isDeleted || false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        moderation: {
          status: 'pending',
          spamScore: 0,
          flags: [],
          reportCount: post.reportCount || 0,
          reviewedAt: null,
          reviewedBy: null,
        },
        tags: post.hashtags || [],
      };
    });

    // 監査ログ記録
    console.log('Admin API: 投稿一覧取得', {
      adminId: (session.user as { id?: string })?.id || session.user?.email,
      query: { page, limit, search, status, sortBy, sortOrder },
      resultCount: posts.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        posts: adminPostView,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Admin Posts API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '投稿一覧の取得に失敗しました',
        error: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

// 投稿モデレーション（非表示・削除・復活）
export async function PUT(request: NextRequest) {
  try {
    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    if (!session?.user || !userRole || !['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { postId, action, reason, notifyAuthor } = await request.json();

    // 入力検証
    if (!postId || !action || !reason) {
      return NextResponse.json({ error: 'postId, action, reasonは必須です' }, { status: 400 });
    }

    // データベース接続
    await dbConnect();

    // 投稿取得
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    // モデレーション実行
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    switch (action) {
      case 'hide':
        updateData.isPublic = false;
        break;
      case 'restore':
        updateData.isPublic = true;
        updateData.isDeleted = false;
        updateData.deletedAt = null;
        break;
      case 'delete':
        // 論理削除
        updateData.isDeleted = true;
        updateData.isPublic = false;
        updateData.deletedAt = new Date();
        break;
      default:
        return NextResponse.json({ error: '不正な操作です' }, { status: 400 });
    }

    // 更新実行
    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true });

    // 監査ログ記録
    console.log('Admin API: 投稿モデレーション', {
      adminId: (session.user as { id?: string })?.id || session.user?.email,
      action,
      postId,
      reason,
      authorId: post.userId || 'unknown',
      result: 'success',
    });

    // 投稿者への通知（実装予定）
    if (notifyAuthor && post.userId) {
      console.log('投稿者通知送信予定:', {
        recipientId: post.userId._id,
        action,
        reason,
      });
    }

    return NextResponse.json({
      success: true,
      message: `投稿を${action === 'hide' ? '非表示に' : action === 'delete' ? '削除' : '復活'}しました`,
      data: updatedPost,
    });
  } catch (error) {
    console.error('Admin Post Moderation Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'モデレーション処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
