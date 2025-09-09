import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';

/**
 * 通報バッチ処理API
 * Issue #60: レポート・通報システム
 */

// 一括処理
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userRole || !['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { reportIds, action, data } = body;

    // バリデーション
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json({ error: '処理対象の通報を選択してください' }, { status: 400 });
    }

    if (reportIds.length > 100) {
      return NextResponse.json({ error: '一度に処理できるのは100件までです' }, { status: 400 });
    }

    let updateData: any = {};
    let successMessage = '';

    switch (action) {
      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json({ error: 'ステータスを指定してください' }, { status: 400 });
        }
        updateData = {
          status: data.status,
          updatedAt: new Date(),
        };
        if (data.status === 'resolved' || data.status === 'rejected') {
          updateData.closedAt = new Date();
          updateData.respondedBy = userId;
          updateData.respondedAt = new Date();
        }
        successMessage = `${reportIds.length}件の通報のステータスを変更しました`;
        break;

      case 'updatePriority':
        if (!data?.priority) {
          return NextResponse.json({ error: '優先度を指定してください' }, { status: 400 });
        }
        updateData = {
          priority: data.priority,
          updatedAt: new Date(),
        };
        successMessage = `${reportIds.length}件の通報の優先度を変更しました`;
        break;

      case 'assign':
        if (data?.assignTo === undefined) {
          return NextResponse.json({ error: '担当者を指定してください' }, { status: 400 });
        }
        updateData = {
          assignedTo: data.assignTo,
          assignedAt: data.assignTo ? new Date() : null,
          updatedAt: new Date(),
        };
        successMessage = data.assignTo
          ? `${reportIds.length}件の通報を担当者にアサインしました`
          : `${reportIds.length}件の通報のアサインを解除しました`;
        break;

      case 'escalate':
        if (!data?.escalateTo) {
          return NextResponse.json(
            { error: 'エスカレーション先を指定してください' },
            { status: 400 }
          );
        }
        updateData = {
          escalatedTo: data.escalateTo,
          escalatedAt: new Date(),
          escalationReason: data.reason || '',
          status: 'escalated',
          updatedAt: new Date(),
        };
        successMessage = `${reportIds.length}件の通報をエスカレーションしました`;
        break;

      default:
        return NextResponse.json({ error: '不正なアクションです' }, { status: 400 });
    }

    // 一括更新実行
    const result = await Report.updateMany({ _id: { $in: reportIds } }, updateData);

    // 監査ログ
    console.log('Batch report update:', {
      action,
      reportIds,
      updatedBy: userId,
      modifiedCount: result.modifiedCount,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Batch report error:', error);
    return NextResponse.json({ error: '一括処理に失敗しました' }, { status: 500 });
  }
}
