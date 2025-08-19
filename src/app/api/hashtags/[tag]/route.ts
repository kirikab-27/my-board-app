import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import Hashtag from '@/models/Hashtag';
import connectDB from '@/lib/mongodb';

// GET /api/hashtags/[tag] - 特定ハッシュタグ詳細API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const resolvedParams = await params;
  try {
    await connectDB();

    const tagName = decodeURIComponent(resolvedParams.tag).toLowerCase().replace(/^#/, '');

    if (!tagName) {
      return NextResponse.json(
        { error: 'ハッシュタグ名が必要です' },
        { status: 400 }
      );
    }

    // ハッシュタグ詳細取得
    const hashtag = await Hashtag.findOne({ 
      name: tagName,
      status: 'active',
      isBlocked: false
    });

    if (!hashtag) {
      return NextResponse.json(
        { error: 'ハッシュタグが見つかりません' },
        { status: 404 }
      );
    }

    // 関連ハッシュタグ取得
    const relatedHashtags = hashtag.relatedTags
      ? hashtag.relatedTags
          .sort((a: any, b: any) => b.correlation - a.correlation)
          .slice(0, 5)
          .map((tag: any) => tag.tagName)
      : [];

    // レスポンス用データ整形
    const response = {
      hashtag: {
        _id: hashtag._id,
        name: hashtag.name,
        displayName: hashtag.displayName,
        description: hashtag.description,
        category: hashtag.category,
        stats: hashtag.stats,
        isTrending: hashtag.isTrending,
        isOfficial: hashtag.isOfficial,
        createdAt: hashtag.createdAt,
        relatedTags: hashtag.relatedTags.slice(0, 10) // 最大10個
      },
      relatedHashtags,
      success: true
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('ハッシュタグ詳細取得エラー:', error);
    return NextResponse.json(
      { error: 'ハッシュタグの詳細取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT /api/hashtags/[tag] - ハッシュタグ更新（管理者・モデレーター用）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getServerSession(authOptions);
    
    // 認証チェック
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // 権限チェック（管理者・モデレーターのみ）
    if (!['admin', 'moderator'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'この操作を実行する権限がありません' },
        { status: 403 }
      );
    }

    await connectDB();

    const tagName = decodeURIComponent(resolvedParams.tag).toLowerCase().replace(/^#/, '');
    const body = await request.json();
    
    const { displayName, description, category, isOfficial, status } = body;

    // ハッシュタグ検索
    const hashtag = await Hashtag.findOne({ name: tagName });

    if (!hashtag) {
      return NextResponse.json(
        { error: 'ハッシュタグが見つかりません' },
        { status: 404 }
      );
    }

    // 更新可能フィールドの更新
    if (displayName !== undefined) hashtag.displayName = displayName;
    if (description !== undefined) hashtag.description = description;
    if (category !== undefined) hashtag.category = category;
    if (isOfficial !== undefined) hashtag.isOfficial = isOfficial;
    if (status !== undefined && ['active', 'blocked', 'review', 'deprecated'].includes(status)) {
      hashtag.status = status;
    }

    hashtag.moderatedBy = session.user.id;

    await hashtag.save();

    return NextResponse.json({
      hashtag: {
        _id: hashtag._id,
        name: hashtag.name,
        displayName: hashtag.displayName,
        description: hashtag.description,
        category: hashtag.category,
        isOfficial: hashtag.isOfficial,
        status: hashtag.status,
        stats: hashtag.stats,
        updatedAt: hashtag.updatedAt
      },
      message: 'ハッシュタグを更新しました',
      success: true
    });

  } catch (error) {
    console.error('ハッシュタグ更新エラー:', error);
    return NextResponse.json(
      { error: 'ハッシュタグの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE /api/hashtags/[tag] - ハッシュタグ削除（管理者のみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getServerSession(authOptions);
    
    // 認証チェック
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // 権限チェック（管理者のみ）
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'この操作を実行する権限がありません' },
        { status: 403 }
      );
    }

    await connectDB();

    const tagName = decodeURIComponent(resolvedParams.tag).toLowerCase().replace(/^#/, '');

    // ハッシュタグ検索
    const hashtag = await Hashtag.findOne({ name: tagName });

    if (!hashtag) {
      return NextResponse.json(
        { error: 'ハッシュタグが見つかりません' },
        { status: 404 }
      );
    }

    // 物理削除ではなく、ステータスをdeprecatedに変更
    hashtag.status = 'deprecated';
    hashtag.isBlocked = true;
    hashtag.blockReason = `管理者により削除: ${session.user.name}`;
    hashtag.moderatedBy = session.user.id;

    await hashtag.save();

    return NextResponse.json({
      message: 'ハッシュタグを削除しました',
      success: true
    });

  } catch (error) {
    console.error('ハッシュタグ削除エラー:', error);
    return NextResponse.json(
      { error: 'ハッシュタグの削除に失敗しました' },
      { status: 500 }
    );
  }
}