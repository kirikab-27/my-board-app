import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';

/**
 * 通報API
 * Issue #60: レポート・通報システム
 */

// 通報作成
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { targetType, targetId, category, description, reporterEmail, evidenceUrls } = body;

    // バリデーション
    if (!targetType || !targetId || !category || !description) {
      return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 });
    }

    if (description.length < 10 || description.length > 2000) {
      return NextResponse.json(
        { error: '説明は10文字以上2000文字以内で入力してください' },
        { status: 400 }
      );
    }

    // 通報者情報の取得
    const reporterId = session?.user?.id || null;
    const email = reporterEmail || session?.user?.email || null;

    // 同一ユーザーからの過去の通報数を取得
    let previousReports = 0;
    if (reporterId) {
      previousReports = await Report.countDocuments({ reporterId });
    }

    // メタデータの取得
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor || realIp || undefined;
    const language = request.headers.get('accept-language')?.split(',')[0] || undefined;

    // 通報を作成
    const report = new Report({
      reporterId,
      reporterEmail: email,
      targetType,
      targetId,
      targetUrl: `${process.env.APP_URL}/${targetType}/${targetId}`,
      category,
      description,
      evidenceUrls: evidenceUrls || [],
      metadata: {
        userAgent,
        ipAddress,
        language,
        previousReports,
      },
    });

    await report.save();

    // レスポンス
    return NextResponse.json({
      success: true,
      reportNumber: report.reportNumber,
      message: '通報を受け付けました。24時間以内に確認いたします。',
    });
  } catch (error) {
    console.error('Report creation error:', error);
    return NextResponse.json({ error: '通報の送信に失敗しました' }, { status: 500 });
  }
}

// 通報一覧取得（管理者用）
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    if (!session?.user || !userRole || !['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    await dbConnect();

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const category = searchParams.get('category') || 'all';
    const assignedTo = searchParams.get('assignedTo') || 'all';

    // フィルター条件構築
    const query: Record<string, unknown> = {};

    if (status !== 'all') {
      query.status = status;
    }
    if (priority !== 'all') {
      query.priority = priority;
    }
    if (category !== 'all') {
      query.category = category;
    }
    if (assignedTo === 'me') {
      query.assignedTo = session.user.id;
    } else if (assignedTo !== 'all') {
      query.assignedTo = assignedTo;
    }

    // ソート（優先度高い順、作成日時新しい順）
    const sortOptions = { priority: -1, createdAt: -1 };

    // データ取得
    const skip = (page - 1) * limit;
    const [reports, totalCount] = await Promise.all([
      Report.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Report.countDocuments(query),
    ]);

    // 統計情報の取得
    const stats = await Report.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
          avgResponseTime: [
            {
              $match: { respondedAt: { $exists: true } },
            },
            {
              $project: {
                responseTime: {
                  $subtract: ['$respondedAt', '$createdAt'],
                },
              },
            },
            {
              $group: {
                _id: null,
                avg: { $avg: '$responseTime' },
              },
            },
          ],
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: stats[0],
      },
    });
  } catch (error) {
    console.error('Report list error:', error);
    return NextResponse.json({ error: '通報一覧の取得に失敗しました' }, { status: 500 });
  }
}
