import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';

/**
 * 個別通報処理API
 * Issue #60: レポート・通報システム
 */

// 通報詳細取得
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    if (!session?.user || !userRole || !['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    await dbConnect();

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ error: '通報が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Report detail error:', error);
    return NextResponse.json({ error: '通報詳細の取得に失敗しました' }, { status: 500 });
  }
}

// 通報更新（ステータス変更、アサイン、対応等）
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userRole || !['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      status,
      priority,
      assignedTo,
      resolution,
      responseTemplate,
      escalateTo,
      escalationReason,
    } = body;

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ error: '通報が見つかりません' }, { status: 404 });
    }

    // 更新データの構築
    const updateData: any = {
      updatedAt: new Date(),
    };

    // ステータス変更
    if (status && status !== report.status) {
      updateData.status = status;

      if (status === 'reviewing' && !report.reviewedAt) {
        updateData.reviewedAt = new Date();
      }

      if (status === 'resolved' || status === 'rejected') {
        updateData.closedAt = new Date();
        updateData.respondedAt = new Date();
        updateData.respondedBy = userId;
      }
    }

    // 優先度変更
    if (priority) {
      updateData.priority = priority;
    }

    // 担当者アサイン
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
      updateData.assignedAt = assignedTo ? new Date() : null;
    }

    // 対応内容
    if (resolution) {
      updateData.resolution = resolution;
    }

    // テンプレート使用
    if (responseTemplate) {
      updateData.responseTemplate = responseTemplate;
    }

    // エスカレーション
    if (escalateTo) {
      updateData.escalatedTo = escalateTo;
      updateData.escalatedAt = new Date();
      updateData.escalationReason = escalationReason || '';
      updateData.status = 'escalated';
    }

    // 更新実行
    const updatedReport = await Report.findByIdAndUpdate(id, updateData, { new: true });

    // 監査ログ（簡易版）
    console.log('Report updated:', {
      reportId: id,
      updatedBy: userId,
      changes: Object.keys(updateData),
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: updatedReport,
      message: '通報を更新しました',
    });
  } catch (error) {
    console.error('Report update error:', error);
    return NextResponse.json({ error: '通報の更新に失敗しました' }, { status: 500 });
  }
}

// 通報削除（管理者のみ）
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // 管理者権限チェック（adminのみ）
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (!session?.user || userRole !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    await dbConnect();

    const report = await Report.findByIdAndDelete(id);
    if (!report) {
      return NextResponse.json({ error: '通報が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '通報を削除しました',
    });
  } catch (error) {
    console.error('Report delete error:', error);
    return NextResponse.json({ error: '通報の削除に失敗しました' }, { status: 500 });
  }
}
