import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import Mute, { IMute, MuteType } from '@/models/Mute';
import User from '@/models/User';
import mongoose from 'mongoose';

interface MuteModelType extends mongoose.Model<IMute> {
  getUserMutes(userId: string, type?: MuteType): Promise<IMute[]>;
  isMuted(userId: string, targetUserId?: string, content?: string, hashtags?: string[]): Promise<boolean>;
  getMuteStats(userId: string): Promise<any>;
  cleanupExpiredMutes(): Promise<any>;
}

// ミュートリスト取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as MuteType | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // ミュートリスト取得
    const mutes = await (Mute as unknown as MuteModelType).getUserMutes(session.user.id, type);
    
    // ページネーション
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMutes = mutes.slice(startIndex, endIndex);

    // 統計情報取得
    const stats = await (Mute as unknown as MuteModelType).getMuteStats(session.user.id);

    return NextResponse.json({
      mutes: paginatedMutes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(mutes.length / limit),
        totalCount: mutes.length,
        limit,
        hasNextPage: endIndex < mutes.length,
        hasPrevPage: page > 1,
      },
      stats,
    });

  } catch (error) {
    console.error('ミュート取得エラー:', error);
    return NextResponse.json(
      { error: 'ミュートリストの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ミュート作成
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      targetUserId,
      keyword,
      hashtag,
      domain,
      duration = 'permanent',
      expiresAt,
      isRegex = false,
      caseSensitive = false,
      scope = {
        posts: true,
        comments: true,
        notifications: true,
        timeline: true,
        search: false,
      },
      reason,
    } = body;

    // バリデーション
    if (!type || !['user', 'keyword', 'hashtag', 'domain'].includes(type)) {
      return NextResponse.json({ error: 'ミュートタイプが無効です' }, { status: 400 });
    }

    // タイプ別バリデーション
    switch (type) {
      case 'user':
        if (!targetUserId) {
          return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
        }
        // 自分自身をミュートできない
        if (targetUserId === session.user.id) {
          return NextResponse.json({ error: '自分自身をミュートできません' }, { status: 400 });
        }
        break;
      case 'keyword':
        if (!keyword?.trim()) {
          return NextResponse.json({ error: 'キーワードが必要です' }, { status: 400 });
        }
        if (keyword.length > 100) {
          return NextResponse.json({ error: 'キーワードは100文字以内で入力してください' }, { status: 400 });
        }
        break;
      case 'hashtag':
        if (!hashtag?.trim()) {
          return NextResponse.json({ error: 'ハッシュタグが必要です' }, { status: 400 });
        }
        if (hashtag.length > 50) {
          return NextResponse.json({ error: 'ハッシュタグは50文字以内で入力してください' }, { status: 400 });
        }
        break;
      case 'domain':
        if (!domain?.trim()) {
          return NextResponse.json({ error: 'ドメインが必要です' }, { status: 400 });
        }
        break;
    }

    // 期間限定ミュートの場合の期限チェック
    if (duration === 'temporary') {
      if (!expiresAt) {
        return NextResponse.json({ error: '期間限定ミュートには期限が必要です' }, { status: 400 });
      }
      const expiry = new Date(expiresAt);
      if (expiry <= new Date()) {
        return NextResponse.json({ error: '期限は現在時刻より後である必要があります' }, { status: 400 });
      }
    }

    await dbConnect();

    // ユーザーミュートの場合、対象ユーザーの存在確認
    if (type === 'user') {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return NextResponse.json({ error: '対象ユーザーが見つかりません' }, { status: 404 });
      }
    }

    // 既存のミュート確認（重複防止）
    const existingMute = await Mute.findOne({
      userId: session.user.id,
      type,
      ...(type === 'user' && { targetUserId }),
      ...(type === 'keyword' && { keyword: keyword?.trim() }),
      ...(type === 'hashtag' && { hashtag: hashtag?.trim().replace(/^#/, '') }),
      ...(type === 'domain' && { domain: domain?.trim() }),
      isActive: true,
    });

    if (existingMute) {
      return NextResponse.json({ error: '既にミュートされています' }, { status: 409 });
    }

    // ミュート作成
    const muteData: any = {
      userId: session.user.id,
      type,
      duration,
      isRegex,
      caseSensitive,
      scope,
      reason: reason?.trim(),
    };

    // タイプ別データ設定
    switch (type) {
      case 'user':
        muteData.targetUserId = targetUserId;
        break;
      case 'keyword':
        muteData.keyword = keyword.trim();
        break;
      case 'hashtag':
        muteData.hashtag = hashtag.trim().replace(/^#/, '');
        break;
      case 'domain':
        muteData.domain = domain.trim();
        break;
    }

    if (duration === 'temporary' && expiresAt) {
      muteData.expiresAt = new Date(expiresAt);
    }

    const newMute = new Mute(muteData);
    await newMute.save();

    // レスポンス用にpopulate
    await newMute.populate('targetUserId', 'username name avatar');

    return NextResponse.json({
      message: 'ミュートを設定しました',
      mute: newMute,
    }, { status: 201 });

  } catch (error) {
    console.error('ミュート作成エラー:', error);
    return NextResponse.json(
      { error: 'ミュートの設定に失敗しました' },
      { status: 500 }
    );
  }
}

// ミュート削除
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const muteId = searchParams.get('muteId');

    if (!muteId) {
      return NextResponse.json({ error: 'ミュートIDが必要です' }, { status: 400 });
    }

    await dbConnect();

    const mute = await Mute.findOne({
      _id: muteId,
      userId: session.user.id,
    });

    if (!mute) {
      return NextResponse.json({ error: 'ミュートが見つかりません' }, { status: 404 });
    }

    await Mute.findByIdAndDelete(muteId);

    return NextResponse.json({
      message: 'ミュートを解除しました',
    });

  } catch (error) {
    console.error('ミュート削除エラー:', error);
    return NextResponse.json(
      { error: 'ミュート解除に失敗しました' },
      { status: 500 }
    );
  }
}

// ミュート更新
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await req.json();
    const { muteId, scope, reason, isActive } = body;

    if (!muteId) {
      return NextResponse.json({ error: 'ミュートIDが必要です' }, { status: 400 });
    }

    await dbConnect();

    const mute = await Mute.findOne({
      _id: muteId,
      userId: session.user.id,
    });

    if (!mute) {
      return NextResponse.json({ error: 'ミュートが見つかりません' }, { status: 404 });
    }

    // 更新可能フィールドの更新
    if (scope) mute.scope = { ...mute.scope, ...scope };
    if (reason !== undefined) mute.reason = reason?.trim();
    if (isActive !== undefined) mute.isActive = isActive;

    await mute.save();
    await mute.populate('targetUserId', 'username name avatar');

    return NextResponse.json({
      message: 'ミュート設定を更新しました',
      mute,
    });

  } catch (error) {
    console.error('ミュート更新エラー:', error);
    return NextResponse.json(
      { error: 'ミュート設定の更新に失敗しました' },
      { status: 500 }
    );
  }
}