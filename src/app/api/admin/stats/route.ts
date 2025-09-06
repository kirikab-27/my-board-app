import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';

/**
 * 管理者ダッシュボード統計情報API
 * Issue #51: 管理者ページ基本機能実装
 */
export async function GET(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 管理者・モデレーター権限チェック
    const userRole = (session.user as any).role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or moderator access required' },
        { status: 403 }
      );
    }

    // データベース接続
    await connectDB();

    // 並列で統計情報を取得
    const [
      totalUsers,
      activeUsers,
      totalPosts,
      todayPosts,
      usersByRole,
      recentUsers,
      recentPosts
    ] = await Promise.all([
      // 総ユーザー数
      User.countDocuments(),
      
      // アクティブユーザー数（過去7日間にログイン）
      User.countDocuments({
        lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // 総投稿数
      Post.countDocuments(),
      
      // 今日の投稿数
      Post.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      
      // ロール別ユーザー数
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // 最近登録したユーザー（5件）
      User.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      // 最近の投稿（5件）
      Post.find()
        .select('content userId authorName createdAt likes likedBy')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    // ロール別ユーザー数をオブジェクト形式に変換
    const userRoleStats = usersByRole.reduce((acc: any, item: any) => {
      acc[item._id || 'user'] = item.count;
      return acc;
    }, {});

    // 統計情報を整形
    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: {
          admin: userRoleStats.admin || 0,
          moderator: userRoleStats.moderator || 0,
          user: userRoleStats.user || 0,
        },
        recent: recentUsers.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          createdAt: user.createdAt,
        })),
      },
      posts: {
        total: totalPosts,
        today: todayPosts,
        recent: recentPosts.map((post: any) => ({
          id: post._id,
          content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          author: {
            name: post.authorName || 'Anonymous',
            userId: post.userId || null,
          },
          likes: post.likedBy?.length || post.likes || 0,
          createdAt: post.createdAt,
        })),
      },
      summary: {
        newUsersThisWeek: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        postsThisWeek: await Post.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        engagementRate: totalPosts > 0 ? 
          ((await Post.countDocuments({ $or: [{ likedBy: { $exists: true, $ne: [] } }, { likes: { $gt: 0 } }] })) / totalPosts * 100).toFixed(2) + '%' : 
          '0%',
      },
      timestamp: new Date(),
    };

    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}