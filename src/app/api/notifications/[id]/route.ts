/**
 * 通知システムAPI - 個別通知操作
 * Phase 6.2: 通知の個別取得・更新・削除機能
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/notifications/[id] - 個別通知取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    // ObjectID バリデーション
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な通知IDです' }, { status: 400 });
    }

    const notification = await Notification.findOne({
      _id: id,
      userId: session.user.id,
      isDeleted: false,
    }).lean();

    if (!notification) {
      return NextResponse.json({ error: '通知が見つかりません' }, { status: 404 });
    }

    // 通知を表示済みにマーク（既読とは異なる）
    await Notification.findByIdAndUpdate(id, {
      isViewed: true,
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('通知取得エラー:', error);
    return NextResponse.json({ error: '通知の取得に失敗しました' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications/[id] - 個別通知更新
 * ボディ:
 * - action: 'read' | 'unread' | 'click' | 'hide'
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // ObjectID バリデーション
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な通知IDです' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'アクションが指定されていません' }, { status: 400 });
    }

    // 通知の存在確認と権限チェック
    const notification = await Notification.findOne({
      _id: id,
      userId: session.user.id,
      isDeleted: false,
    });

    if (!notification) {
      return NextResponse.json({ error: '通知が見つかりません' }, { status: 404 });
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'read':
        updateData = {
          isRead: true,
          readAt: new Date(),
        };
        message = '通知を既読にしました';
        break;

      case 'unread':
        updateData = {
          isRead: false,
          readAt: null,
        };
        message = '通知を未読にしました';
        break;

      case 'click':
        updateData = {
          isClicked: true,
          clickedAt: new Date(),
          isRead: true, // クリックしたら自動的に既読
          readAt: (notification as any).readAt || new Date(),
        };
        message = '通知をクリック済みにしました';
        break;

      case 'hide':
        updateData = {
          isHidden: true,
        };
        message = '通知を非表示にしました';
        break;

      default:
        return NextResponse.json({ error: '無効なアクションです' }, { status: 400 });
    }

    const updatedNotification = await Notification.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    return NextResponse.json({
      success: true,
      message,
      notification: updatedNotification,
    });
  } catch (error) {
    console.error('通知更新エラー:', error);
    return NextResponse.json({ error: '通知の更新に失敗しました' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/[id] - 通知削除（論理削除）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    // ObjectID バリデーション
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な通知IDです' }, { status: 400 });
    }

    // 通知の存在確認と権限チェック
    const notification = await Notification.findOne({
      _id: id,
      userId: session.user.id,
      isDeleted: false,
    });

    if (!notification) {
      return NextResponse.json({ error: '通知が見つかりません' }, { status: 404 });
    }

    // 論理削除実行
    await Notification.findByIdAndUpdate(id, {
      isDeleted: true,
    });

    return NextResponse.json({
      success: true,
      message: '通知を削除しました',
    });
  } catch (error) {
    console.error('通知削除エラー:', error);
    return NextResponse.json({ error: '通知の削除に失敗しました' }, { status: 500 });
  }
}
