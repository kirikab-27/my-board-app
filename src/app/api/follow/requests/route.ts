import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import Follow from '@/models/Follow';

/**
 * フォローリクエスト管理API
 * GET: 承認待ちのフォローリクエスト一覧
 * POST: フォローリクエストの承認・拒否
 */

// フォローリクエスト一覧取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    await connectDB();

    const skip = (page - 1) * limit;

    // 自分宛の承認待ちフォローリクエストを取得
    const [requests, total] = await Promise.all([
      Follow.find({ 
        following: session.user.id, 
        isPending: true,
        status: 'pending'
      })
        .populate('follower', 'name username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Follow.countDocuments({ 
        following: session.user.id, 
        isPending: true,
        status: 'pending'
      })
    ]);

    return NextResponse.json({
      requests: requests.map(req => ({
        id: req._id,
        follower: {
          id: req.follower._id,
          name: req.follower.name,
          username: req.follower.username,
          avatar: req.follower.avatar
        },
        createdAt: req.createdAt,
        followedAt: req.followedAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        hasNextPage: skip + requests.length < total,
        hasPrevPage: page > 1
      }
    }, { status: 200 });

  } catch (error) {
    console.error('フォローリクエスト取得エラー:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'フォローリクエストの取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// フォローリクエストの承認・拒否
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { followId, action } = await request.json();

    // バリデーション
    if (!followId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'followIdとaction（accept/reject）が必要です' },
        { status: 400 }
      );
    }

    await connectDB();

    // フォローリクエストを検索
    const followRequest = await Follow.findOne({
      _id: followId,
      following: session.user.id,
      isPending: true,
      status: 'pending'
    });

    if (!followRequest) {
      return NextResponse.json(
        { error: 'フォローリクエストが見つかりません' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // フォローリクエストを承認
      await followRequest.accept();
      
      return NextResponse.json({
        message: 'フォローリクエストを承認しました',
        follow: followRequest
      }, { status: 200 });

    } else {
      // フォローリクエストを拒否（削除）
      await followRequest.reject();
      
      return NextResponse.json({
        message: 'フォローリクエストを拒否しました'
      }, { status: 200 });
    }

  } catch (error) {
    console.error('フォローリクエスト処理エラー:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'フォローリクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}