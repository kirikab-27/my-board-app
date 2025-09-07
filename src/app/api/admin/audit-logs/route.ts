/**
 * 監査ログAPIエンドポイント
 * Issue #55: 監査ログシステム
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import AuditLog from '@/models/AuditLog';
import auditLogger from '@/lib/audit/auditLogger';
import { connectDB } from '@/lib/mongodb';

// GET: 監査ログ一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 管理者権限チェック
    if (!session?.user || (session.user as any).role !== 'admin') {
      // 権限違反をログに記録
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await auditLogger.logSecurityViolation(
        'PERMISSION_DENIED',
        'HIGH',
        ip,
        userAgent,
        '/api/admin/audit-logs',
        'GET',
        { userId: session?.user?.id, attemptedAccess: 'audit_logs' }
      );
      
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const archived = searchParams.get('archived') === 'true';
    
    // フィルター構築
    const filter: any = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (userId) filter.userId = userId;
    if (archived !== undefined) filter.archived = archived;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // ログ取得
    const totalCount = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // 管理者アクセスをログに記録
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await auditLogger.logAdminAccess(
      session.user.id!,
      session.user.email!,
      (session.user as any).role,
      ip,
      userAgent,
      '/api/admin/audit-logs',
      `監査ログ閲覧 (ページ: ${page}, フィルター: ${JSON.stringify(filter)})`
    );
    
    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('監査ログ取得エラー:', error);
    return NextResponse.json(
      { error: '監査ログの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: チェーン検証
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 管理者権限チェック
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { action, startDate, endDate } = body;
    
    if (action === 'verify-chain') {
      // チェーン検証
      const result = await auditLogger.verifyChain(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      
      // 検証結果をログに記録
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await auditLogger.logAdminAccess(
        session.user.id!,
        session.user.email!,
        (session.user as any).role,
        ip,
        userAgent,
        '/api/admin/audit-logs',
        `監査ログチェーン検証実行 (結果: ${result.valid ? '正常' : '異常検出'})`
      );
      
      return NextResponse.json(result);
    }
    
    if (action === 'archive') {
      // アーカイブ処理
      const daysOld = body.daysOld || 90;
      const count = await auditLogger.archiveOldLogs(daysOld);
      
      // アーカイブ処理をログに記録
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await auditLogger.logAdminAccess(
        session.user.id!,
        session.user.email!,
        (session.user as any).role,
        ip,
        userAgent,
        '/api/admin/audit-logs',
        `監査ログアーカイブ実行 (${count}件を${daysOld}日以前でアーカイブ)`
      );
      
      return NextResponse.json({ 
        success: true, 
        archivedCount: count 
      });
    }
    
    return NextResponse.json(
      { error: '無効なアクションです' },
      { status: 400 }
    );
  } catch (error) {
    console.error('監査ログ操作エラー:', error);
    return NextResponse.json(
      { error: '操作に失敗しました' },
      { status: 500 }
    );
  }
}