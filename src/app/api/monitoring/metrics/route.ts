import { NextRequest, NextResponse } from 'next/server';
import { perfMonitor } from '@/lib/monitoring/performance-monitor';

export async function GET() {
  try {
    // パフォーマンス統計取得
    const performanceStats = perfMonitor.getAllStats();
    
    // システムメトリクス（実装例）
    const systemMetrics = {
      errorRate: 0.5, // 実際の実装では計算
      avgResponseTime: 250,
      activeUsers: 42,
      memoryUsage: 65.2,
      cpuUsage: 30.1,
    };
    
    // 履歴データ（実装例）
    const historicalData = {
      responseTimeHistory: [200, 220, 240, 230, 250, 260, 250],
      timeline: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'],
      errorTypeDistribution: {
        'ValidationError': 3,
        'NetworkError': 2,
        'DatabaseError': 1,
      },
      topPages: [
        { path: '/', views: 1500 },
        { path: '/posts/123', views: 800 },
        { path: '/auth/login', views: 600 },
      ],
    };
    
    return NextResponse.json({
      ...systemMetrics,
      ...historicalData,
      performanceStats,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('メトリクス取得エラー:', error);
    return NextResponse.json(
      { error: 'メトリクス取得に失敗しました' },
      { status: 500 }
    );
  }
}