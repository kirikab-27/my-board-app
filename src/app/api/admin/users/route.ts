import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/**
 * 管理者ユーザー管理API
 * Issue #46 Phase 3: API統合・実際のデータ操作
 */

// ユーザー一覧取得
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
    const role = searchParams.get('role') || 'all';

    // データベース接続
    await dbConnect();

    // 検索条件構築
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role !== 'all') {
      query.role = role;
    }

    // データ取得
    const skip = (page - 1) * limit;
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password -emailVerified') // 機密情報除外
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // レスポンス成形
    const adminUserView = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
      isVerified: !!user.emailVerified,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen || user.updatedAt,
      createdAt: user.createdAt,
      stats: user.stats || {
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        likesReceived: 0
      },
      moderation: {
        reportCount: user.adminMetadata?.reportCount || 0,
        suspensionHistory: user.adminMetadata?.suspensionHistory || []
      }
    }));

    // 監査ログ記録（実装予定）
    console.log('Admin API: ユーザー一覧取得', {
      adminId: session.user.id,
      query: { page, limit, search, role },
      resultCount: users.length
    });

    return NextResponse.json({
      success: true,
      data: {
        users: adminUserView,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        aggregations: {
          totalUsers: totalCount,
          // 実装予定: より詳細な集計
        }
      }
    });

  } catch (error) {
    console.error('Admin Users API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'INTERNAL_SERVER_ERROR',
        message: 'ユーザー一覧の取得に失敗しました'
      }, 
      { status: 500 }
    );
  }
}