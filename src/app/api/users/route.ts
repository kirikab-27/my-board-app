import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

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

    await dbConnect();

    // パラメータ取得
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';

    // セッションユーザーの権限取得
    const currentUserRole = (session.user as { role?: string }).role;
    
    // 検索クエリ構築
    const query: any = {};
    
    // 管理者の表示制御
    if (currentUserRole !== 'admin') {
      // 一般ユーザー：管理者を除外
      query.role = { $ne: 'admin' };
    }
    
    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
      
      if (query.role) {
        // 既存の権限フィルターと検索条件を組み合わせ
        query.$and = [
          { role: query.role },
          { $or: searchConditions }
        ];
        delete query.role;  // $andに移動したので削除
      } else {
        query.$or = searchConditions;
      }
    }

    // ページネーション計算
    const skip = (page - 1) * limit;

    // ユーザー一覧取得（パスワード除外）
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // 総数取得
    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // レスポンス
    return NextResponse.json({
      users: users.map((user: any) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        role: user.role || 'user',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}