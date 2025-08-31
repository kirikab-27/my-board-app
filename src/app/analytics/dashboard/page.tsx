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
  Chip,
  LinearProgress,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  Container,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  ThumbUp as ThumbUpIcon,
  Analytics as AnalyticsIcon,
  PostAdd as PostAddIcon,
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useRouter } from 'next/navigation';
import { AuthButton } from '@/components/auth/AuthButton';
import { getNavigationHeaderStyles } from '@/styles/navigationHeaderStyles';

// Dynamic import for Chart.js to reduce initial bundle size
const Line = dynamic(() => import('react-chartjs-2').then((mod) => ({ default: mod.Line })), {
  loading: () => <Skeleton variant="rectangular" width="100%" height={200} />,
  ssr: false,
});

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => ({ default: mod.Bar })), {
  loading: () => <Skeleton variant="rectangular" width="100%" height={200} />,
  ssr: false,
});

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
    Title,
    Tooltip,
    Legend,
    Filler
  );
};

// ユーザー分析データ型定義
interface UserAnalytics {
  overview: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalFollowers: number;
    totalFollowing: number;
    profileViews: number;
    postsThisWeek: number;
    likesThisWeek: number;
    followersGrowthRate: number;
    engagementRate: number;
  };
  weeklyStats: Array<{
    date: string;
    posts: number;
    likes: number;
    comments: number;
    followers: number;
  }>;
  topPosts: Array<{
    id: string;
    title?: string;
    content: string;
    likes: number;
    comments: number;
    createdAt: string;
    engagementScore: number;
  }>;
  engagementTrends: {
    thisWeek: number;
    lastWeek: number;
    change: number;
  };
}

type TabValue = 'overview' | 'posts' | 'engagement' | 'followers';

export default function AnalyticsDashboard() {
  // 認証必須（全ユーザー対象）
  const { user, isLoading: authLoading } = useRequireAuth({
    redirectTo: '/login',
  });
  
  const router = useRouter();
  const theme = useTheme(); // Issue #38: ダークモード対応

  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartJSInitialized, setChartJSInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

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
      const response = await fetch('/api/analytics/stats');
      if (!response.ok) {
        throw new Error(`分析データ取得に失敗しました: ${response.status}`);
      }
      const analyticsData = await response.json();
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 30秒間隔で自動更新
  useEffect(() => {
    if (authLoading || !user) return;

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading, fetchAnalytics]);

  // 認証チェック中
  if (authLoading) {
    return (
      <>
        {/* Fixed Header */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              個人分析ダッシュボード
            </Typography>
            <AuthButton />
          </Toolbar>
          {/* 2段目のナビゲーション行 */}
          <Toolbar variant="dense" sx={getNavigationHeaderStyles(theme)}>
            <AuthButton isNavigationRow />
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: { xs: 14, sm: 16, md: 16 }, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>認証確認中...</Typography>
          </Box>
        </Container>
      </>
    );
  }

  // データ取得中
  if (loading) {
    return (
      <>
        {/* Fixed Header */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              個人分析ダッシュボード
            </Typography>
            <AuthButton />
          </Toolbar>
          {/* 2段目のナビゲーション行 */}
          <Toolbar variant="dense" sx={getNavigationHeaderStyles(theme)}>
            <AuthButton isNavigationRow />
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: { xs: 14, sm: 16, md: 16 }, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            分析レポート
          </Typography>
          <LinearProgress sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <Skeleton variant="rectangular" height={150} />
              </Box>
            ))}
          </Box>
        </Container>
      </>
    );
  }

  // エラー表示
  if (error) {
    return (
      <>
        {/* Fixed Header */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              個人分析ダッシュボード
            </Typography>
            <AuthButton />
          </Toolbar>
          {/* 2段目のナビゲーション行 */}
          <Toolbar variant="dense" sx={getNavigationHeaderStyles(theme)}>
            <AuthButton isNavigationRow />
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: { xs: 14, sm: 16, md: 16 }, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            エラー: {error}
          </Alert>
          <Box display="flex" gap={2}>
            <Chip label="再試行" onClick={fetchAnalytics} clickable color="primary" />
          </Box>
        </Container>
      </>
    );
  }

  // データがない場合
  if (!analytics) {
    return (
      <>
        {/* Fixed Header */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              個人分析ダッシュボード
            </Typography>
            <AuthButton />
          </Toolbar>
          {/* 2段目のナビゲーション行 */}
          <Toolbar variant="dense" sx={getNavigationHeaderStyles(theme)}>
            <AuthButton isNavigationRow />
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: { xs: 14, sm: 16, md: 16 }, mb: 4 }}>
          <Alert severity="info">
            分析データがありません。投稿やフォロー活動を開始して、統計データを蓄積しましょう。
          </Alert>
        </Container>
      </>
    );
  }

  // メトリクス表示用ヘルパー関数
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;

  // タブ変更ハンドラ
  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  // 投稿クリックハンドラ
  const handlePostClick = (postId: string) => {
    router.push(`/board/${postId}`);
  };

  // Overview Tab Content
  const renderOverviewTab = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {/* Key Metrics Cards */}
      <Box sx={{ flex: '1 1 200px', minWidth: 200, maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' } }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  総投稿数
                </Typography>
                <Typography variant="h4" component="div">
                  {formatNumber(analytics.overview.totalPosts)}
                </Typography>
              </Box>
              <PostAddIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
            <Box mt={1}>
              <Typography variant="body2" color="textSecondary">
                今週: {analytics.overview.postsThisWeek}投稿
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200, maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' } }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  総いいね数
                </Typography>
                <Typography variant="h4" component="div">
                  {formatNumber(analytics.overview.totalLikes)}
                </Typography>
              </Box>
              <ThumbUpIcon color="secondary" sx={{ fontSize: 40 }} />
            </Box>
            <Box mt={1}>
              <Typography variant="body2" color="textSecondary">
                今週: {analytics.overview.likesThisWeek}いいね
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200, maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' } }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  フォロワー
                </Typography>
                <Typography variant="h4" component="div">
                  {formatNumber(analytics.overview.totalFollowers)}
                </Typography>
              </Box>
              <PeopleIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
            <Box mt={1}>
              <Chip
                label={formatPercentage(analytics.overview.followersGrowthRate)}
                color={analytics.overview.followersGrowthRate > 0 ? 'success' : 'default'}
                size="small"
                icon={analytics.overview.followersGrowthRate > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200, maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' } }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  エンゲージメント率
                </Typography>
                <Typography variant="h4" component="div">
                  {analytics.overview.engagementRate.toFixed(1)}
                </Typography>
              </Box>
              <AnalyticsIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
            <Box mt={1}>
              <Typography variant="body2" color="textSecondary">
                投稿あたりのエンゲージメント
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Weekly Activity Chart */}
      <Box sx={{ flex: '2 1 500px', minWidth: 500, maxWidth: { xs: '100%', md: 'calc(66.67% - 12px)' } }}>
        <Card>
          <CardHeader title="週間アクティビティトレンド" />
          <CardContent>
            {chartJSInitialized && analytics.weeklyStats.length > 0 && (
              <Line
                data={{
                  labels: analytics.weeklyStats.map((item) => 
                    new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [
                    {
                      label: '投稿数',
                      data: analytics.weeklyStats.map((item) => item.posts),
                      borderColor: 'rgb(54, 162, 235)',
                      backgroundColor: 'rgba(54, 162, 235, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: 'いいね数',
                      data: analytics.weeklyStats.map((item) => item.likes),
                      borderColor: 'rgb(255, 99, 132)',
                      backgroundColor: 'rgba(255, 99, 132, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: 'コメント数',
                      data: analytics.weeklyStats.map((item) => item.comments),
                      borderColor: 'rgb(255, 206, 86)',
                      backgroundColor: 'rgba(255, 206, 86, 0.1)',
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
                        text: '数',
                      },
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Engagement Summary */}
      <Box sx={{ flex: '1 1 300px', minWidth: 300, maxWidth: { xs: '100%', md: 'calc(33.33% - 12px)' } }}>
        <Card>
          <CardHeader title="エンゲージメント変化" />
          <CardContent>
            <Box textAlign="center">
              <Typography variant="h3" color="primary" gutterBottom>
                {formatPercentage(analytics.engagementTrends.change)}
              </Typography>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                先週比
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    今週
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(analytics.engagementTrends.thisWeek)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    先週
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(analytics.engagementTrends.lastWeek)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  // Top Posts Tab Content
  const renderPostsTab = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: '1 1 100%', width: '100%' }}>
        <Card>
          <CardHeader title="人気投稿ランキング" subheader="エンゲージメントスコア順" />
          <CardContent>
            {analytics.topPosts.length > 0 ? (
              <List>
                {analytics.topPosts.map((post, index) => (
                  <Box key={post.id}>
                    <ListItem 
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' }}}
                      onClick={() => handlePostClick(post.id)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={post.title || post.content.substring(0, 50) + '...'}
                        secondary={
                          <>
                            {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                            <br />
                            👍 {post.likes} 💬 {post.comments} 📊 スコア: {post.engagementScore}
                          </>
                        }
                      />
                    </ListItem>
                    {index < analytics.topPosts.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                まだ投稿がありません。投稿を作成して、統計データを蓄積しましょう。
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  // Engagement Analysis Tab
  const renderEngagementTab = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: '1 1 400px', minWidth: 400, maxWidth: { xs: '100%', md: 'calc(50% - 12px)' } }}>
        <Card>
          <CardHeader title="総コメント数" />
          <CardContent>
            <Typography variant="h3" color="primary" gutterBottom>
              {formatNumber(analytics.overview.totalComments)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              全投稿に対するコメント数の合計
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 400px', minWidth: 400, maxWidth: { xs: '100%', md: 'calc(50% - 12px)' } }}>
        <Card>
          <CardHeader title="フォロー中" />
          <CardContent>
            <Typography variant="h3" color="secondary" gutterBottom>
              {formatNumber(analytics.overview.totalFollowing)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              フォローしているユーザー数
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 週間統計チャート */}
      <Box sx={{ flex: '1 1 100%', width: '100%' }}>
        <Card>
          <CardHeader title="週間エンゲージメント統計" />
          <CardContent>
            {chartJSInitialized && analytics.weeklyStats.length > 0 && (
              <Bar
                data={{
                  labels: analytics.weeklyStats.map((item) => 
                    new Date(item.date).toLocaleDateString('ja-JP', { weekday: 'short', month: 'short', day: 'numeric' })
                  ),
                  datasets: [
                    {
                      label: 'いいね',
                      data: analytics.weeklyStats.map((item) => item.likes),
                      backgroundColor: 'rgba(255, 99, 132, 0.8)',
                      borderColor: 'rgba(255, 99, 132, 1)',
                      borderWidth: 1,
                    },
                    {
                      label: 'コメント',
                      data: analytics.weeklyStats.map((item) => item.comments),
                      backgroundColor: 'rgba(54, 162, 235, 0.8)',
                      borderColor: 'rgba(54, 162, 235, 1)',
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
                        text: 'エンゲージメント数',
                      },
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  // Followers Analysis Tab
  const renderFollowersTab = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: '1 1 300px', minWidth: 300, maxWidth: { xs: '100%', md: 'calc(33.33% - 12px)' } }}>
        <Card>
          <CardHeader title="フォロワー成長" />
          <CardContent>
            <Box textAlign="center">
              <Typography variant="h3" color={analytics.overview.followersGrowthRate > 0 ? 'success.main' : 'text.secondary'}>
                {formatPercentage(analytics.overview.followersGrowthRate)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                週間成長率
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '2 1 500px', minWidth: 500, maxWidth: { xs: '100%', md: 'calc(66.67% - 12px)' } }}>
        <Card>
          <CardHeader title="フォロワー数推移" />
          <CardContent>
            {chartJSInitialized && analytics.weeklyStats.length > 0 && (
              <Line
                data={{
                  labels: analytics.weeklyStats.map((item) => 
                    new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [
                    {
                      label: 'フォロワー数',
                      data: analytics.weeklyStats.map((item) => item.followers),
                      borderColor: 'rgb(75, 192, 192)',
                      backgroundColor: 'rgba(75, 192, 192, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'フォロワー数',
                      },
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </Box>

      {/* フォロワー統計サマリー */}
      <Box sx={{ flex: '1 1 100%', width: '100%' }}>
        <Alert severity="info">
          <Typography variant="body2">
            💡 <strong>改善のヒント:</strong> 定期的な投稿とフォロワーとの交流で成長率を向上させましょう。
            エンゲージメント率が高いほど、新しいフォロワーを獲得しやすくなります。
          </Typography>
        </Alert>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Fixed Header */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            個人分析ダッシュボード
          </Typography>
          <AuthButton />
        </Toolbar>
        {/* 2段目のナビゲーション行 */}
        <Toolbar variant="dense" sx={getNavigationHeaderStyles(theme)}>
          <AuthButton isNavigationRow />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: { xs: 14, sm: 16, md: 16 }, mb: 4 }}>
        {/* Status Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            分析レポート
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <Chip
              label="30秒ごと自動更新"
              color="success"
              size="small"
              icon={<AnalyticsIcon />}
            />
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="概要" value="overview" />
            <Tab label="人気投稿" value="posts" />
            <Tab label="エンゲージメント" value="engagement" />
            <Tab label="フォロワー分析" value="followers" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'posts' && renderPostsTab()}
        {activeTab === 'engagement' && renderEngagementTab()}
        {activeTab === 'followers' && renderFollowersTab()}

        {/* Last Update Info */}
        <Box mt={4} p={2} bgcolor="background.paper" borderRadius={1} textAlign="center">
          <Typography variant="body2" color="textSecondary">
            最終更新: {new Date().toLocaleString('ja-JP')} | データは30秒ごとに自動更新されます
          </Typography>
        </Box>
      </Container>
    </>
  );
}