'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Grid2, Typography, Alert, Box } from '@mui/material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardMetrics {
  errorRate: number;
  avgResponseTime: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTimeHistory: number[];
  errorTypeDistribution: Record<string, number>;
  topPages: Array<{ path: string; views: number }>;
  timeline: string[];
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/monitoring/metrics');
        if (!response.ok) {
          throw new Error('メトリクス取得に失敗しました');
        }
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Typography>読み込み中...</Typography>;
  }

  if (error) {
    return <Alert severity="error">エラー: {error}</Alert>;
  }

  if (!metrics) {
    return <Alert severity="info">データがありません</Alert>;
  }

  const getStatusColor = (
    value: number,
    thresholds: { warning: number; error: number }
  ): 'success' | 'warning' | 'error' => {
    if (value >= thresholds.error) return 'error';
    if (value >= thresholds.warning) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        システム監視ダッシュボード
      </Typography>

      <Grid2 container spacing={3}>
        {/* システム状態 */}
        <Grid2 xs={12} md={3}>
          <Card>
            <CardHeader title="エラー率" />
            <CardContent>
              <Typography
                variant="h3"
                color={getStatusColor(metrics.errorRate, { warning: 1, error: 5 })}
              >
                {metrics.errorRate.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid2>

        <Grid2 xs={12} md={3}>
          <Card>
            <CardHeader title="平均応答時間" />
            <CardContent>
              <Typography
                variant="h3"
                color={getStatusColor(metrics.avgResponseTime, { warning: 500, error: 1000 })}
              >
                {metrics.avgResponseTime.toFixed(0)}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid2>

        <Grid2 xs={12} md={3}>
          <Card>
            <CardHeader title="アクティブユーザー" />
            <CardContent>
              <Typography variant="h3" color="primary">
                {metrics.activeUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid2>

        <Grid2 xs={12} md={3}>
          <Card>
            <CardHeader title="メモリ使用率" />
            <CardContent>
              <Typography
                variant="h3"
                color={getStatusColor(metrics.memoryUsage, { warning: 70, error: 85 })}
              >
                {metrics.memoryUsage.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid2>

        {/* パフォーマンストレンド */}
        <Grid2 xs={12} md={8}>
          <Card>
            <CardHeader title="応答時間トレンド" />
            <CardContent>
              <Line
                data={{
                  labels: metrics.timeline,
                  datasets: [
                    {
                      label: '応答時間 (ms)',
                      data: metrics.responseTimeHistory,
                      borderColor: 'rgb(75, 192, 192)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      tension: 0.1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: '応答時間 (ms)',
                      },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid2>

        {/* エラー分布 */}
        <Grid2 xs={12} md={4}>
          <Card>
            <CardHeader title="エラータイプ分布" />
            <CardContent>
              <Doughnut
                data={{
                  labels: Object.keys(metrics.errorTypeDistribution),
                  datasets: [
                    {
                      data: Object.values(metrics.errorTypeDistribution),
                      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </CardContent>
          </Card>
        </Grid2>

        {/* トップページ */}
        <Grid2 xs={12}>
          <Card>
            <CardHeader title="人気ページ" />
            <CardContent>
              <Bar
                data={{
                  labels: metrics.topPages.map((page) => page.path),
                  datasets: [
                    {
                      label: 'ページビュー',
                      data: metrics.topPages.map((page) => page.views),
                      backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'ビュー数',
                      },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </Box>
  );
}
