import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import Mute, { IMute } from '@/models/Mute';
import mongoose from 'mongoose';

interface MuteModelType extends mongoose.Model<IMute> {
  isMuted(userId: string, targetUserId?: string, content?: string, hashtags?: string[]): Promise<boolean>;
  cleanupExpiredMutes(): Promise<any>;
}

// ミュートチェック API
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, content, hashtags } = body;

    await dbConnect();

    // 期限切れミュートのクリーンアップ（軽量処理）
    await (Mute as unknown as MuteModelType).cleanupExpiredMutes();

    // ミュートチェック実行
    const isMuted = await (Mute as unknown as MuteModelType).isMuted(
      session.user.id,
      targetUserId,
      content,
      hashtags
    );

    return NextResponse.json({
      isMuted,
    });

  } catch (error) {
    console.error('ミュートチェックエラー:', error);
    return NextResponse.json(
      { error: 'ミュートチェックに失敗しました' },
      { status: 500 }
    );
  }
}

// バルクミュートチェック（複数アイテムを一度にチェック）
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'チェック対象が必要です' }, { status: 400 });
    }

    if (items.length > 100) {
      return NextResponse.json({ error: 'チェック対象は100件以内にしてください' }, { status: 400 });
    }

    await dbConnect();

    // 期限切れミュートのクリーンアップ
    await (Mute as unknown as MuteModelType).cleanupExpiredMutes();

    // 各アイテムのミュートチェック
    const results = await Promise.all(
      items.map(async (item: any) => {
        try {
          const isMuted = await (Mute as unknown as MuteModelType).isMuted(
            session.user.id,
            item.targetUserId,
            item.content,
            item.hashtags
          );
          
          return {
            id: item.id,
            isMuted,
          };
        } catch (error) {
          console.error(`アイテム ${item.id} のミュートチェックエラー:`, error);
          return {
            id: item.id,
            isMuted: false,
            error: 'チェックに失敗しました',
          };
        }
      })
    );

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        muted: results.filter(r => r.isMuted).length,
        errors: results.filter(r => r.error).length,
      },
    });

  } catch (error) {
    console.error('バルクミュートチェックエラー:', error);
    return NextResponse.json(
      { error: 'バルクミュートチェックに失敗しました' },
      { status: 500 }
    );
  }
}

// ユーザー専用ミュートチェック（高速化版）
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ error: '対象ユーザーIDが必要です' }, { status: 400 });
    }

    await dbConnect();

    // ユーザーミュートのみをチェック（高速）
    const userMute = await Mute.findOne({
      userId: session.user.id,
      type: 'user',
      targetUserId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    return NextResponse.json({
      isMuted: !!userMute,
      muteDetails: userMute ? {
        id: userMute._id,
        type: userMute.type,
        duration: userMute.duration,
        expiresAt: userMute.expiresAt,
        scope: userMute.scope,
        reason: userMute.reason,
        createdAt: userMute.createdAt,
      } : null,
    });

  } catch (error) {
    console.error('ユーザーミュートチェックエラー:', error);
    return NextResponse.json(
      { error: 'ユーザーミュートチェックに失敗しました' },
      { status: 500 }
    );
  }
}