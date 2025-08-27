/**
 * Phase 7.1: 接続監視API
 * パフォーマンス監視・接続状態取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import ConnectionMonitor from '@/utils/monitoring/connectionMonitor';

/**
 * GET /api/monitoring/connection - 接続監視メトリクス取得
 * 管理者のみアクセス可能
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 管理者権限チェック
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' }, 
        { status: 403 }
      );
    }

    const monitor = ConnectionMonitor.getInstance();
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // 基本メトリクス
    const metrics = monitor.getMetrics();
    const warnings = monitor.checkPerformanceWarnings();

    const response: any = {
      metrics,
      warnings,
      timestamp: new Date().toISOString(),
      status: warnings.length === 0 ? 'healthy' : 'warning',
    };

    // 詳細情報が要求された場合
    if (detailed) {
      const recentRequests = monitor.getRecentRequests(20);
      const endpointStats = monitor.getEndpointStats();
      
      response.detailed = {
        recentRequests,
        endpointStats,
        performanceThresholds: {
          maxResponseTime: 1000, // 1秒
          maxErrorRate: 10,      // 10%
          maxActiveConnections: 100,
        }
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('接続監視メトリクス取得エラー:', error);
    return NextResponse.json(
      { error: 'メトリクスの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/connection/reset - メトリクスリセット
 * 管理者のみアクセス可能（開発環境のみ）
 */
export async function POST(request: NextRequest) {
  try {
    // 開発環境のみ許可
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: '開発環境でのみ利用可能です' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    
    // 管理者権限チェック
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' }, 
        { status: 403 }
      );
    }

    const monitor = ConnectionMonitor.getInstance();
    monitor.reset();

    return NextResponse.json({
      success: true,
      message: 'メトリクスをリセットしました',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('メトリクスリセットエラー:', error);
    return NextResponse.json(
      { error: 'リセットに失敗しました' },
      { status: 500 }
    );
  }
}