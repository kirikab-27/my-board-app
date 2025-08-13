/**
 * セキュリティ監査ログ管理API
 * 監査ログの取得・統計・管理機能
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/security/audit-logger';
import AuditLog from '@/models/AuditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';

/**
 * セキュリティ統計の取得
 */
export async function GET(request: NextRequest) {
  try {
    // 管理者認証の確認
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const action = searchParams.get('action') || 'statistics';

    switch (action) {
      case 'statistics':
        const stats = await auditLogger.getSecurityStatistics(days);
        return NextResponse.json({
          ...stats,
          requestedBy: session.user.email,
          timestamp: new Date().toISOString()
        });

      case 'threat-assessment':
        const ip = searchParams.get('ip');
        if (!ip) {
          return NextResponse.json({ error: 'IP parameter required' }, { status: 400 });
        }
        
        const hours = parseInt(searchParams.get('hours') || '24');
        const assessment = await auditLogger.assessThreatLevel(ip, hours);
        
        return NextResponse.json({
          ip,
          assessment,
          timestamp: new Date().toISOString()
        });

      case 'recent-events':
        const limit = parseInt(searchParams.get('limit') || '50');
        const events = await AuditLog.find({})
          .sort({ timestamp: -1 })
          .limit(limit)
          .lean();
        
        return NextResponse.json({
          events,
          count: events.length,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('監査ログAPI取得エラー:', error);
    return NextResponse.json({
      error: 'Failed to retrieve audit data'
    }, { status: 500 });
  }
}

/**
 * セキュリティイベントの手動記録
 */
export async function POST(request: NextRequest) {
  try {
    // 管理者認証の確認
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { type, details, targetUserId } = body;

    // 手動イベントの記録
    const event = auditLogger.createEventFromRequest(request, type, {
      ...details,
      manualEntry: true,
      recordedBy: session.user.email
    }, targetUserId);

    await auditLogger.log(event);

    return NextResponse.json({
      message: 'Security event recorded',
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('手動監査ログ記録エラー:', error);
    return NextResponse.json({
      error: 'Failed to record security event'
    }, { status: 500 });
  }
}

/**
 * セキュリティイベントの解決マーク
 */
export async function PATCH(request: NextRequest) {
  try {
    // 管理者認証の確認
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { eventId, notes } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    await auditLogger.resolveEvent(
      eventId, 
      session.user.email || 'admin', 
      notes
    );

    return NextResponse.json({
      message: 'Event marked as resolved',
      eventId,
      resolvedBy: session.user.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('イベント解決エラー:', error);
    return NextResponse.json({
      error: 'Failed to resolve event'
    }, { status: 500 });
  }
}

/**
 * 監査ログの削除（古いログのクリーンアップ）
 */
export async function DELETE(request: NextRequest) {
  try {
    // 管理者認証の確認
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');
    const confirm = searchParams.get('confirm') === 'true';

    if (!confirm) {
      return NextResponse.json({
        error: 'Confirmation required',
        message: 'Add ?confirm=true to confirm deletion'
      }, { status: 400 });
    }

    // 指定日数より古いログを削除
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
      resolved: true // 解決済みのもののみ削除
    });

    return NextResponse.json({
      message: 'Old audit logs deleted',
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      deletedBy: session.user.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('監査ログ削除エラー:', error);
    return NextResponse.json({
      error: 'Failed to delete audit logs'
    }, { status: 500 });
  }
}