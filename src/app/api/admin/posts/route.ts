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
    if (!session?.user || !['admin', 'moderator'].includes(session.user.role || '')) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // データベース接続
    await dbConnect();

    // 検索条件構築
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'reported') {
      query['moderationData.reportCount'] = { $gt: 0 };
    } else if (status === 'hidden') {
      query['moderationData.status'] = 'hidden';
    } else if (status === 'public') {
      query.isPublic = true;
      query['moderationData.status'] = { $ne: 'hidden' };
    }

    // データ取得
    const skip = (page - 1) * limit;
    const [posts, totalCount] = await Promise.all([
      Post.find(query)
        .populate('userId', 'name username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query)
    ]);

    // レスポンス成形
    const adminPostView = posts.map(post => ({
      _id: post._id.toString(),
      title: post.title,
      content: post.content,
      authorId: post.userId?._id?.toString() || 'unknown',
      authorName: post.userId?.name || 'Unknown User',
      isPublic: post.isPublic,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      engagement: {
        likes: post.likes || 0,
        comments: post.comments?.length || 0,
        shares: 0 // 実装予定
      },
      moderation: {
        reportCount: post.moderationData?.reportCount || 0,
        isHidden: post.moderationData?.status === 'hidden',
        hiddenReason: post.moderationData?.moderationReason,
        moderatedBy: post.moderationData?.reviewedBy,
        moderatedAt: post.moderationData?.reviewedAt
      },
      media: post.media || []
    }));

    // 監査ログ記録
    console.log('Admin API: 投稿一覧取得', {
      adminId: session.user.id,
      query: { page, limit, search, status },
      resultCount: posts.length
    });

    return NextResponse.json({
      success: true,
      data: {
        posts: adminPostView,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Admin Posts API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'INTERNAL_SERVER_ERROR',
        message: '投稿一覧の取得に失敗しました'
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
    if (!session?.user || !['admin', 'moderator'].includes(session.user.role || '')) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const { postId, action, reason, notifyAuthor } = await request.json();

    // 入力検証
    if (!postId || !action || !reason) {
      return NextResponse.json(
        { error: 'postId, action, reasonは必須です' }, 
        { status: 400 }
      );
    }

    // データベース接続
    await dbConnect();

    // 投稿取得
    const post = await Post.findById(postId).populate('userId', 'name email');
    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    // モデレーション実行
    let updateData: any = {
      'moderationData.reviewedBy': session.user.id,
      'moderationData.reviewedAt': new Date(),
      'moderationData.moderationReason': reason
    };

    switch (action) {
      case 'hide':
        updateData['moderationData.status'] = 'hidden';
        updateData.isPublic = false;
        break;
      case 'restore':
        updateData['moderationData.status'] = 'approved';
        updateData.isPublic = true;
        break;
      case 'delete':
        // 論理削除
        updateData['moderationData.status'] = 'deleted';
        updateData.isPublic = false;
        updateData.deletedAt = new Date();
        break;
      default:
        return NextResponse.json({ error: '不正な操作です' }, { status: 400 });
    }

    // 更新実行
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      updateData,
      { new: true }
    );

    // 監査ログ記録
    console.log('Admin API: 投稿モデレーション', {
      adminId: session.user.id,
      action,
      postId,
      reason,
      authorId: post.userId?._id,
      result: 'success'
    });

    // 投稿者への通知（実装予定）
    if (notifyAuthor && post.userId) {
      console.log('投稿者通知送信予定:', {
        recipientId: post.userId._id,
        action,
        reason
      });
    }

    return NextResponse.json({
      success: true,
      message: `投稿を${action === 'hide' ? '非表示に' : action === 'delete' ? '削除' : '復活'}しました`,
      data: updatedPost
    });

  } catch (error) {
    console.error('Admin Post Moderation Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'INTERNAL_SERVER_ERROR',
        message: 'モデレーション処理に失敗しました'
      }, 
      { status: 500 }
    );
  }
}