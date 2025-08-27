import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Block, { IBlock } from '@/models/Block';
import User from '@/models/User';
import Notification from '@/models/Notification';

// 型安全性のためのBlock型定義拡張
interface BlockModelType extends mongoose.Model<IBlock> {
  getBlockedUsers(userId: string, page?: number, limit?: number): Promise<{
    blocks: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
  isMutuallyBlocked(userId1: string, userId2: string): Promise<boolean>;
}

// ブロックリスト取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await (Block as unknown as BlockModelType).getBlockedUsers(session.user.id, page, limit);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('ブロックリスト取得エラー:', error);
    return NextResponse.json(
      { error: 'ブロックリストの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ユーザーブロック
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const { targetUserId, reason } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'ブロック対象ユーザーIDが必要です' }, { status: 400 });
    }

    // 自分自身をブロックすることはできない
    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: '自分自身をブロックすることはできません' }, { status: 400 });
    }

    // ブロック対象ユーザーが存在するかチェック
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: '指定されたユーザーが見つかりません' }, { status: 404 });
    }

    // 既にブロック済みかチェック
    const existingBlock = await Block.findOne({
      blocker: session.user.id,
      blocked: targetUserId,
    });

    if (existingBlock) {
      return NextResponse.json({ error: '既にブロック済みです' }, { status: 409 });
    }

    // ブロック関係を作成
    const block = new Block({
      blocker: session.user.id,
      blocked: targetUserId,
      reason: reason || '',
      type: 'user',
    });

    await block.save();

    // フォロー関係があれば削除
    const Follow = (await import('@/models/Follow')).default;
    await Follow.deleteMany({
      $or: [
        { follower: session.user.id, following: targetUserId },
        { follower: targetUserId, following: session.user.id },
      ],
    });

    // 関連する通知を削除
    await Notification.deleteMany({
      $or: [
        { userId: session.user.id, fromUserId: targetUserId },
        { userId: targetUserId, fromUserId: session.user.id },
      ],
    });

    // 統計情報更新
    await Promise.all([
      User.findById(session.user.id).then(user => user?.updateStats()),
      targetUser.updateStats(),
    ]);

    return NextResponse.json({
      success: true,
      message: 'ユーザーをブロックしました',
      block: {
        id: block._id,
        blockedUser: {
          id: targetUser._id,
          username: targetUser.username,
          name: targetUser.name,
          avatar: targetUser.avatar,
        },
        createdAt: block.createdAt,
      },
    });
  } catch (error) {
    console.error('ブロック処理エラー:', error);
    return NextResponse.json(
      { error: 'ブロック処理に失敗しました' },
      { status: 500 }
    );
  }
}

// ブロック解除
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'ブロック解除対象ユーザーIDが必要です' }, { status: 400 });
    }

    // ブロック関係を確認
    const block = await Block.findOne({
      blocker: session.user.id,
      blocked: targetUserId,
    });

    if (!block) {
      return NextResponse.json({ error: 'ブロック関係が見つかりません' }, { status: 404 });
    }

    // ブロック関係を削除
    await Block.deleteOne({ _id: block._id });

    // 対象ユーザー情報を取得
    const targetUser = await User.findById(targetUserId);

    return NextResponse.json({
      success: true,
      message: 'ブロックを解除しました',
      unblockedUser: targetUser ? {
        id: targetUser._id,
        username: targetUser.username,
        name: targetUser.name,
        avatar: targetUser.avatar,
      } : null,
    });
  } catch (error) {
    console.error('ブロック解除エラー:', error);
    return NextResponse.json(
      { error: 'ブロック解除に失敗しました' },
      { status: 500 }
    );
  }
}