import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import AuditLog from '@/models/AuditLog';

/**
 * 管理者ユーザー管理API
 * Issue #58: 高度なユーザー管理システム実装
 */

// ユーザー一覧取得
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    
    // デバッグ情報
    console.log('[Admin Users API] Session check:', {
      hasSession: !!session,
      user: session?.user?.email,
      role: session?.user?.role,
      id: session?.user?.id
    });
    
    if (!session?.user || !['admin', 'moderator'].includes(session.user.role || '')) {
      return NextResponse.json({ 
        success: false,
        error: '管理者権限が必要です',
        message: 'このページにアクセスするには管理者またはモデレーター権限が必要です'
      }, { status: 403 });
    }

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // データベース接続
    console.log('[Admin Users API] Connecting to MongoDB...');
    try {
      await dbConnect();
      console.log('[Admin Users API] MongoDB connected successfully');
    } catch (dbError) {
      console.error('[Admin Users API] MongoDB connection failed:', dbError);
      throw new Error('Database connection failed');
    }

    // 検索条件構築
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    // ステータスフィルター
    if (status) {
      switch (status) {
        case 'active':
          query.lastSeen = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case 'inactive':
          query.lastSeen = { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case 'verified':
          query.emailVerified = { $ne: null };
          break;
        case 'unverified':
          query.emailVerified = null;
          break;
        case 'suspended':
          query.isSuspended = true;
          break;
      }
    }

    // 日付範囲フィルター
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // ソート設定
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // データ取得
    const skip = (page - 1) * limit;
    console.log('[Admin Users API] Fetching users with query:', JSON.stringify(query));
    
    let users = [];
    let totalCount = 0;
    
    try {
      [users, totalCount] = await Promise.all([
        User.find(query)
          .select('-password -verificationToken -resetPasswordToken') // 機密情報除外
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);
      
      console.log(`[Admin Users API] Found ${users.length} users, total: ${totalCount}`);
    } catch (dbError) {
      console.error('[Admin Users API] Database query error:', dbError);
      throw new Error('Failed to fetch users from database');
    }

    // 各ユーザーの統計情報を取得（エラーハンドリング付き）
    let postStats = [];
    try {
      const userIds = users.map((u: any) => u._id);
      if (userIds.length > 0) {
        postStats = await Post.aggregate([
          { $match: { author: { $in: userIds } } },
          {
            $group: {
              _id: '$author',
              postsCount: { $sum: 1 },
              likesReceived: { $sum: { $size: { $ifNull: ['$likes', []] } } },
            },
          },
        ]);
      }
    } catch (statsError) {
      console.error('[Admin Users API] Failed to fetch post stats:', statsError);
      // 統計情報の取得に失敗しても続行（デフォルト値を使用）
    }

    // 統計情報をマッピング
    const statsMap = new Map(
      postStats.map((stat) => [stat._id.toString(), stat])
    );

    // レスポンス成形
    const adminUserView = users.map((user: any) => {
      const stats = statsMap.get(user._id.toString()) || {
        postsCount: 0,
        likesReceived: 0,
      };

      return {
        _id: user._id.toString(),
        name: user.name || 'Unknown',
        email: user.email,
        username: user.username,
        role: user.role || 'user',
        isVerified: !!user.emailVerified,
        isOnline: user.lastSeen ? 
          new Date(user.lastSeen).getTime() > Date.now() - 5 * 60 * 1000 : false,
        lastSeen: user.lastSeen || user.updatedAt,
        createdAt: user.createdAt,
        stats: {
          postsCount: stats.postsCount,
          followersCount: user.followers?.length || 0,
          followingCount: user.following?.length || 0,
          likesReceived: stats.likesReceived,
        },
        moderation: {
          isSuspended: user.isSuspended || false,
          suspendedUntil: user.suspendedUntil,
          reportCount: user.reportCount || 0,
          warnings: user.warnings || [],
        },
        metadata: {
          provider: user.provider || 'credentials',
          lastLoginIP: user.lastLoginIP,
          registrationIP: user.registrationIP,
          twoFactorEnabled: user.twoFactorEnabled || false,
        },
      };
    });

    // 監査ログ記録（エラーハンドリング付き）
    try {
      if (session.user?.id) {
        await AuditLog.create({
          adminUserId: session.user.id,
          action: 'user.view',
          targetType: 'user',
          metadata: {
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            requestData: { page, limit, search, role, status },
            sessionId: session.user.id,
          },
          result: 'success',
          timestamp: new Date(),
        });
      } else {
        console.warn('[Admin Users API] Session user ID is missing, skipping audit log');
      }
    } catch (auditError) {
      // 監査ログの失敗は致命的ではないので、エラーログのみ出力
      console.error('[Admin Users API] Failed to create audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        users: adminUserView,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
        aggregations: {
          totalUsers: totalCount,
          // 実装予定: より詳細な集計
        },
      },
    });
  } catch (error) {
    console.error('Admin Users API Error:', error);
    
    // エラーメッセージの詳細化
    let errorMessage = 'ユーザー一覧の取得に失敗しました';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * ユーザー一括更新（権限変更・ステータス変更）
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'moderator'].includes(session.user.role || '')) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, action, value } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    await dbConnect();

    let updateData: any = {};
    let auditAction: string = '';

    // アクションに応じた更新データ設定
    switch (action) {
      case 'changeRole':
        if (!['user', 'moderator', 'admin'].includes(value)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }
        // モデレーターは管理者権限を付与できない
        if (session.user.role === 'moderator' && value === 'admin') {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        updateData = { role: value };
        auditAction = 'user.role_change';
        break;

      case 'suspend':
        updateData = {
          isSuspended: true,
          suspendedUntil: value || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
        auditAction = 'user.suspend';
        break;

      case 'unsuspend':
        updateData = {
          isSuspended: false,
          suspendedUntil: null,
        };
        auditAction = 'user.unsuspend';
        break;

      case 'verify':
        updateData = { emailVerified: new Date() };
        auditAction = 'user.verify';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 一括更新実行
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updateData }
    );

    // 監査ログ記録
    if (session.user?.id) {
      await AuditLog.create({
        adminUserId: session.user.id,
        action: auditAction,
        targetType: 'user',
        metadata: {
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          requestData: { userIds, action, value },
          changes: updateData,
          sessionId: session.user.id,
        },
        result: 'success',
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        action,
        userIds,
      },
    });
  } catch (error) {
    console.error('ユーザー一括更新エラー:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/export
 * ユーザーデータエクスポート
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'moderator'].includes(session.user.role || '')) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const { format = 'json', filters = {} } = body;

    await dbConnect();

    // 検索条件構築
    const query: any = {};
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters.role && filters.role !== 'all') {
      query.role = filters.role;
    }

    // データ取得
    const users = await User.find(query)
      .select('name email username role createdAt lastSeen emailVerified')
      .lean();

    // エクスポートデータ整形
    const exportData = users.map((user: any) => ({
      name: user.name,
      email: user.email,
      username: user.username || '',
      role: user.role || 'user',
      verified: !!user.emailVerified,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen || '',
    }));

    // 監査ログ記録
    if (session.user?.id) {
      await AuditLog.create({
        adminUserId: session.user.id,
        action: 'user.export',
        targetType: 'user',
        metadata: {
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          requestData: { format, filters },
          exportCount: exportData.length,
          sessionId: session.user.id,
        },
        result: 'success',
        timestamp: new Date(),
      });
    }

    // CSV形式の場合
    if (format === 'csv') {
      const headers = ['Name', 'Email', 'Username', 'Role', 'Verified', 'Created At', 'Last Seen'];
      const csvRows = [
        headers.join(','),
        ...exportData.map(user => 
          Object.values(user).map(v => `"${v}"`).join(',')
        ),
      ];
      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-export-${Date.now()}.csv"`,
        },
      });
    }

    // JSON形式（デフォルト）
    return NextResponse.json({
      success: true,
      data: exportData,
      metadata: {
        exportDate: new Date(),
        totalCount: exportData.length,
        format,
      },
    });
  } catch (error) {
    console.error('ユーザーエクスポートエラー:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
