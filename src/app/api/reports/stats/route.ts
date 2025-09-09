import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';

/**
 * 通報統計API
 * Issue #60: レポート・通報システム
 */

export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (!session?.user || !userRole || !['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    await dbConnect();

    // 期間パラメータ
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // デフォルト7日間

    // 期間の計算
    const startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // 統計情報の集計
    const [
      totalStats,
      periodStats,
      categoryBreakdown,
      priorityBreakdown,
      statusBreakdown,
      responseTimeStats,
      topReporters,
      dailyTrend,
    ] = await Promise.all([
      // 全体統計
      Report.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
            },
            critical: {
              $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] },
            },
          },
        },
      ]),

      // 期間内統計
      Report.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
            },
          },
        },
      ]),

      // カテゴリー別
      Report.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 優先度別
      Report.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),

      // ステータス別
      Report.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 平均対応時間
      Report.aggregate([
        {
          $match: {
            respondedAt: { $exists: true },
            createdAt: { $gte: startDate },
          },
        },
        {
          $project: {
            responseTime: {
              $divide: [
                { $subtract: ['$respondedAt', '$createdAt'] },
                1000 * 60 * 60, // ミリ秒を時間に変換
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' },
            minResponseTime: { $min: '$responseTime' },
            maxResponseTime: { $max: '$responseTime' },
            count: { $sum: 1 },
          },
        },
      ]),

      // トップ通報者
      Report.aggregate([
        {
          $match: {
            reporterId: { $exists: true },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$reporterId',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // 日別トレンド
      Report.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            total: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // データ整形
    const stats = {
      overview: {
        total: totalStats[0]?.total || 0,
        pending: totalStats[0]?.pending || 0,
        resolved: totalStats[0]?.resolved || 0,
        critical: totalStats[0]?.critical || 0,
      },
      period: {
        label: period,
        total: periodStats[0]?.total || 0,
        resolved: periodStats[0]?.resolved || 0,
        resolutionRate: periodStats[0]?.total
          ? Math.round((periodStats[0]?.resolved / periodStats[0]?.total) * 100)
          : 0,
      },
      breakdown: {
        category: categoryBreakdown.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          {} as Record<string, number>
        ),
        priority: priorityBreakdown.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          {} as Record<string, number>
        ),
        status: statusBreakdown.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      performance: {
        avgResponseTime: responseTimeStats[0]?.avgResponseTime
          ? Math.round(responseTimeStats[0].avgResponseTime * 10) / 10
          : null,
        minResponseTime: responseTimeStats[0]?.minResponseTime
          ? Math.round(responseTimeStats[0].minResponseTime * 10) / 10
          : null,
        maxResponseTime: responseTimeStats[0]?.maxResponseTime
          ? Math.round(responseTimeStats[0].maxResponseTime * 10) / 10
          : null,
        totalResponded: responseTimeStats[0]?.count || 0,
      },
      topReporters: topReporters.map((reporter) => ({
        userId: reporter._id,
        count: reporter.count,
      })),
      trend: dailyTrend.map((day) => ({
        date: day._id,
        total: day.total,
        resolved: day.resolved,
      })),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Report stats error:', error);
    return NextResponse.json({ error: '統計情報の取得に失敗しました' }, { status: 500 });
  }
}
