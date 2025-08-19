/**
 * 通知システムAPI - メイン処理
 * Phase 6.2: 通知の取得・作成・管理機能
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';

/**
 * GET /api/notifications - 通知一覧取得
 * クエリパラメータ:
 * - page: ページ番号 (デフォルト: 1)
 * - limit: 件数 (デフォルト: 20, 最大: 50)
 * - filter: 'all' | 'unread' | 'read' (デフォルト: 'all')
 * - type: 通知タイプフィルター
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const filter = searchParams.get('filter') || 'all';
    const type = searchParams.get('type');

    // バリデーション
    if (page < 1 || limit < 1) {
      return NextResponse.json({ error: '無効なページパラメータです' }, { status: 400 });
    }

    // フィルター条件構築
    const baseQuery = {
      userId: session.user.id,
      isDeleted: false,
      isHidden: false,
    };

    let query: any = { ...baseQuery };

    // 既読フィルター
    switch (filter) {
      case 'unread':
        query.isRead = false;
        break;
      case 'read':
        query.isRead = true;
        break;
      // 'all'の場合は追加条件なし
    }

    // タイプフィルター
    if (type) {
      const validTypes = [
        'follow', 'follow_accept', 'like_post', 'like_comment',
        'comment', 'reply', 'mention_post', 'mention_comment',
        'repost', 'quote', 'system', 'announcement', 'security', 'milestone'
      ];
      if (validTypes.includes(type)) {
        query.type = type;
      }
    }

    // 通知取得（ページング）
    const skip = (page - 1) * limit;
    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      (Notification as any).getUnreadCount(session.user.id),
    ]);

    // ページング情報
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      unreadCount,
      filter,
      type: type || null,
    });

  } catch (error) {
    console.error('通知取得エラー:', error);
    return NextResponse.json(
      { error: '通知の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - 通知作成（システム内部使用）
 * ボディ:
 * - type: 通知タイプ
 * - title?: 通知タイトル（自動生成される場合もある）
 * - message?: 通知メッセージ（自動生成される場合もある）
 * - userId: 通知対象ユーザーID
 * - fromUserId?: 送信者ユーザーID
 * - metadata?: 関連データ
 * - priority?: 優先度
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      type,
      title,
      message,
      userId,
      fromUserId,
      metadata,
      priority = 'normal'
    } = body;

    // バリデーション
    if (!type || !userId) {
      return NextResponse.json(
        { error: '通知タイプとユーザーIDは必須です' },
        { status: 400 }
      );
    }

    // 送信者情報を取得
    let fromUser = null;
    if (fromUserId) {
      fromUser = await User.findById(fromUserId).select('name email').lean() as { name?: string; email?: string } | null;
      if (!fromUser) {
        return NextResponse.json(
          { error: '送信者が見つかりません' },
          { status: 404 }
        );
      }
    }

    // 通知データ構築
    const notificationData = {
      type,
      title: title || '', // 空の場合は自動生成される
      message: message || '', // 空の場合は自動生成される
      priority,
      userId,
      fromUserId,
      fromUserName: fromUser?.name,
      metadata: metadata || {},
    };

    // バッチ処理対応の通知作成
    const notification = await (Notification as any).createNotification(notificationData);

    return NextResponse.json({
      success: true,
      notification: {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        createdAt: notification.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('通知作成エラー:', error);
    return NextResponse.json(
      { error: '通知の作成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications - 通知の一括既読
 * ボディ:
 * - action: 'mark_all_read' | 'mark_viewed'
 * - notificationIds?: 特定の通知IDのリスト（指定しない場合は全て）
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { action, notificationIds } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'アクションが指定されていません' },
        { status: 400 }
      );
    }

    // 更新対象の条件
    let updateQuery: any = {
      userId: session.user.id,
      isDeleted: false,
    };

    if (notificationIds && Array.isArray(notificationIds)) {
      updateQuery._id = { $in: notificationIds };
    }

    let updateData: any = {};
    
    switch (action) {
      case 'mark_all_read':
        updateData = {
          isRead: true,
          readAt: new Date(),
        };
        break;
      case 'mark_viewed':
        updateData = {
          isViewed: true,
        };
        break;
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }

    const result = await Notification.updateMany(updateQuery, updateData);

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      action,
    });

  } catch (error) {
    console.error('通知更新エラー:', error);
    return NextResponse.json(
      { error: '通知の更新に失敗しました' },
      { status: 500 }
    );
  }
}