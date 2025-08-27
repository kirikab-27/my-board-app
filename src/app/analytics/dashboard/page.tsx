'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  Box,
  Skeleton,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import { useRequireAuth } from '@/hooks/useRequireAuth';

// Dynamic import for Chart.js to reduce initial bundle size
const Line = dynamic(() => import('react-chartjs-2').then((mod) => ({ default: mod.Line })), {
  loading: () => <Skeleton variant="rectangular" width="100%" height={200} />,
  ssr: false,
});

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => ({ default: mod.Bar })), {
  loading: () => <Skeleton variant="rectangular" width="100%" height={200} />,
  ssr: false,
});

const Doughnut = dynamic(
  () => import('react-chartjs-2').then((mod) => ({ default: mod.Doughnut })),
  {
    loading: () => <Skeleton variant="rectangular" width="100%" height={200} />,
    ssr: false,
  }
);

// Dynamic Chart.js registration
const initializeChartJS = async () => {
  const chartModule = await import('chart.js');
  const {
    Chart: ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
  } = chartModule;

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
};

// データ型定義
interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
  activeUsers: number;
}

interface ContentEngagement {
  postViews: number;
  likes: number;
  comments: number;
  shares: number;
  avgEngagementRate: number;
}

interface DeviceStats {
  desktop: number;
  mobile: number;
  tablet: number;
}

interface PageAnalytics {
  path: string;
  views: number;
  uniqueVisitors: number;
  avgDuration: number;
  bounceRate: number;
}

interface AnalyticsDashboardData {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalViews: number;
    activeUsers24h: number;
    growthRate: number;
  };
  userGrowth: UserGrowthData[];
  contentEngagement: ContentEngagement;
  deviceStats: DeviceStats;
  topPages: PageAnalytics[];
  realTimeMetrics: {
    currentUsers: number;
    recentActions: Array<{
      type: string;
      count: number;
      timestamp: Date;
    }>;
  };
  conversionFunnel: {
    visitors: number;
    signups: number;
    firstPost: number;
    activeUsers: number;
  };
}

type TabValue = 'overview' | 'users' | 'content' | 'engagement' | 'technical';
type TimeRange = '1h' | '24h' | '7d' | '30d';

export default function AnalyticsDashboard() {
  // 認証必須（admin権限）
  const { user, isLoading: authLoading } = useRequireAuth({
    requiredRole: 'admin',
    redirectTo: '/login',
  });

  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartJSInitialized, setChartJSInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize Chart.js dynamically
  useEffect(() => {
    initializeChartJS()
      .then(() => {
        setChartJSInitialized(true);
      })
      .catch(console.error);
  }, []);

  // データ取得
  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/analytics/dashboard?range=${timeRange}`);
      if (!response.ok) {
        throw new Error(`分析データ取得に失敗しました: ${response.status}`);
      }
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchAnalytics();

    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, timeRange === '1h' ? 30000 : 300000);
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh, user, authLoading, fetchAnalytics]);

  // 認証チェック中
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>認証確認中...</Typography>
      </Box>
    );
  }

  // データ取得中
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          分析ダッシュボード
        </Typography>
        <LinearProgress sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // エラー表示
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          エラー: {error}
        </Alert>
        <Box display="flex" gap={2}>
          <button onClick={fetchAnalytics} disabled={loading}>
            再試行
          </button>
        </Box>
      </Box>
    );
  }

  // データがない場合
  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">分析データがありません。データ収集を開始してください。</Alert>
      </Box>
    );
  }

  // メトリクス表示用ヘルパー関数
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => `${num.toFixed(1)}%`;

  // タブ変更ハンドラ
  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  // 時間範囲変更ハンドラ
  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeRange(event.target.value as TimeRange);
  };

  // Overview Tab Content
  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  総ユーザー数
                </Typography>
                <Typography variant="h4" component="div">
                  {formatNumber(data.overview.totalUsers)}
                </Typography>
              </Box>
              <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
            <Box mt={2}>
              <Chip
                label={`+${formatPercentage(data.overview.growthRate)} 成長率`}
                color={data.overview.growthRate > 0 ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  総投稿数
                </Typography>
                <Typography variant="h4" component="div">
                  {formatNumber(data.overview.totalPosts)}
                </Typography>
              </Box>
              <AnalyticsIcon color="secondary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  総ページビュー
                </Typography>
                <Typography variant="h4" component="div">
                  {formatNumber(data.overview.totalViews)}
                </Typography>
              </Box>
              <VisibilityIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  24時間アクティブ
                </Typography>
                <Typography variant="h4" component="div">
                  {formatNumber(data.overview.activeUsers24h)}
                </Typography>
              </Box>
              <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* User Growth Chart */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader title="ユーザー成長トレンド" />
          <CardContent>
            {chartJSInitialized && (
              <Line
                data={{
                  labels: data.userGrowth.map((item) => new Date(item.date).toLocaleDateString()),
                  datasets: [
                    {
                      label: '新規ユーザー',
                      data: data.userGrowth.map((item) => item.newUsers),
                      borderColor: 'rgb(54, 162, 235)',
                      backgroundColor: 'rgba(54, 162, 235, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: 'アクティブユーザー',
                      data: data.userGrowth.map((item) => item.activeUsers),
                      borderColor: 'rgb(255, 99, 132)',
                      backgroundColor: 'rgba(255, 99, 132, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'ユーザー数',
                      },
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Device Distribution */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardHeader title="デバイス分布" />
          <CardContent>
            {chartJSInitialized && (
              <Doughnut
                data={{
                  labels: ['デスクトップ', 'モバイル', 'タブレット'],
                  datasets: [
                    {
                      data: [
                        data.deviceStats.desktop,
                        data.deviceStats.mobile,
                        data.deviceStats.tablet,
                      ],
                      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                      borderWidth: 2,
                      borderColor: '#fff',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Conversion Funnel */}
      <Grid size={12}>
        <Card>
          <CardHeader title="コンバージョンファネル" />
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={2}
            >
              {[
                { label: '訪問者', value: data.conversionFunnel.visitors, color: '#e3f2fd' },
                { label: '登録', value: data.conversionFunnel.signups, color: '#bbdefb' },
                { label: '初回投稿', value: data.conversionFunnel.firstPost, color: '#90caf9' },
                {
                  label: 'アクティブユーザー',
                  value: data.conversionFunnel.activeUsers,
                  color: '#64b5f6',
                },
              ].map((step, index) => (
                <Box
                  key={step.label}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  minWidth={120}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: step.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      {formatNumber(step.value)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {step.label}
                  </Typography>
                  {index < 3 && (
                    <Typography variant="caption" color="success.main">
                      {formatPercentage(
                        (Object.values(data.conversionFunnel)[index + 1] / step.value) * 100
                      )}{' '}
                      率
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Content Engagement Tab
  const renderContentTab = () => (
    <Grid container spacing={3}>
      {/* Engagement Metrics */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  投稿ビュー
                </Typography>
                <Typography variant="h4">
                  {formatNumber(data.contentEngagement.postViews)}
                </Typography>
              </Box>
              <VisibilityIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  いいね数
                </Typography>
                <Typography variant="h4">{formatNumber(data.contentEngagement.likes)}</Typography>
              </Box>
              <ThumbUpIcon color="secondary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  コメント数
                </Typography>
                <Typography variant="h4">
                  {formatNumber(data.contentEngagement.comments)}
                </Typography>
              </Box>
              <CommentIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  エンゲージメント率
                </Typography>
                <Typography variant="h4">
                  {formatPercentage(data.contentEngagement.avgEngagementRate)}
                </Typography>
              </Box>
              <ShareIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Pages */}
      <Grid size={12}>
        <Card>
          <CardHeader title="人気ページ" />
          <CardContent>
            {chartJSInitialized && (
              <Bar
                data={{
                  labels: data.topPages.map((page) => page.path),
                  datasets: [
                    {
                      label: 'ページビュー',
                      data: data.topPages.map((page) => page.views),
                      backgroundColor: 'rgba(54, 162, 235, 0.8)',
                      borderColor: 'rgba(54, 162, 235, 1)',
                      borderWidth: 1,
                    },
                    {
                      label: 'ユニーク訪問者',
                      data: data.topPages.map((page) => page.uniqueVisitors),
                      backgroundColor: 'rgba(255, 99, 132, 0.8)',
                      borderColor: 'rgba(255, 99, 132, 1)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: '数',
                      },
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          分析ダッシュボード
        </Typography>

        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small">
            <InputLabel>時間範囲</InputLabel>
            <Select value={timeRange} label="時間範囲" onChange={handleTimeRangeChange}>
              <MenuItem value="1h">過去1時間</MenuItem>
              <MenuItem value="24h">過去24時間</MenuItem>
              <MenuItem value="7d">過去7日</MenuItem>
              <MenuItem value="30d">過去30日</MenuItem>
            </Select>
          </FormControl>

          <Chip
            label={autoRefresh ? '自動更新中' : '手動更新'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            clickable
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="概要" value="overview" />
          <Tab label="ユーザー" value="users" />
          <Tab label="コンテンツ" value="content" />
          <Tab label="エンゲージメント" value="engagement" />
          <Tab label="技術指標" value="technical" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'content' && renderContentTab()}
      {/* 他のタブコンテンツは必要に応じて追加 */}
      {(activeTab === 'users' || activeTab === 'engagement' || activeTab === 'technical') && (
        <Alert severity="info">
          {activeTab === 'users' && 'ユーザー詳細分析機能は開発中です。'}
          {activeTab === 'engagement' && 'エンゲージメント詳細分析機能は開発中です。'}
          {activeTab === 'technical' && '技術指標分析機能は開発中です。'}
        </Alert>
      )}

      {/* Real-time Status */}
      <Box mt={4} p={2} bgcolor="background.paper" borderRadius={1}>
        <Typography variant="body2" color="textSecondary">
          リアルタイムアクティブユーザー: {data.realTimeMetrics.currentUsers}人 | 最終更新:{' '}
          {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
}
