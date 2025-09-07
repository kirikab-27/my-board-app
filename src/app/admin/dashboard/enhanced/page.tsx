'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useRequire2FA } from '@/hooks/use2FACheck';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Stack,
} from '@mui/material';
import {
  People,
  Article,
  Analytics,
  TrendingUp,
  PersonAdd,
  ThumbUp,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Download,
  AccessTime,
  Speed,
} from '@mui/icons-material';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';
import { ThemeContextProvider } from '@/contexts/ThemeContext';

/**
 * 拡張管理者ダッシュボード
 * Issue #57: 管理ダッシュボードページ
 */
export default function EnhancedAdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isChecking: is2FAChecking, requiresVerification } = useRequire2FA();
  const [stats, setStats] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // グラフ用のサンプルデータ
  const [chartData] = useState({
    weeklyActivity: [
      { day: '月', users: 120, posts: 45, likes: 230 },
      { day: '火', users: 132, posts: 52, likes: 245 },
      { day: '水', users: 145, posts: 61, likes: 280 },
      { day: '木', users: 138, posts: 48, likes: 260 },
      { day: '金', users: 165, posts: 72, likes: 320 },
      { day: '土', users: 180, posts: 85, likes: 380 },
      { day: '日', users: 175, posts: 78, likes: 350 },
    ],
    userGrowth: [
      { month: '1月', total: 1200, active: 800 },
      { month: '2月', total: 1350, active: 920 },
      { month: '3月', total: 1580, active: 1100 },
      { month: '4月', total: 1820, active: 1350 },
      { month: '5月', total: 2100, active: 1620 },
      { month: '6月', total: 2450, active: 1900 },
    ],
    contentTypes: [
      { name: 'テキスト', value: 65, color: '#0088FE' },
      { name: '画像', value: 25, color: '#00C49F' },
      { name: '動画', value: 10, color: '#FFBB28' },
    ],
    systemStatus: {
      cpu: 45,
      memory: 68,
      storage: 52,
      bandwidth: 73,
    },
  });

  // 管理者権限チェック
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login?callbackUrl=/admin/dashboard/enhanced');
      return;
    }

    if (!['admin', 'moderator'].includes((session.user as any).role || '')) {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      router.push('/dashboard?error=insufficient-permissions');
      return;
    }
  }, [session, status, router]);

  // 統計情報取得
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('統計情報の取得に失敗しました' as string);
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session, fetchStats]);

  // 自動更新の設定
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 30000); // 30秒ごと
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, fetchStats]);

  const handleExport = () => {
    // TODO: レポートエクスポート機能
    alert('レポートエクスポート機能は準備中です');
  };

  if (status === 'loading' || loading || is2FAChecking) {
    return (
      <ThemeContextProvider>
        <AdminLayoutEnhanced
          title="拡張ダッシュボード"
          breadcrumbs={[{ label: '拡張ダッシュボード' }]}
        >
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        </AdminLayoutEnhanced>
      </ThemeContextProvider>
    );
  }

  if (requiresVerification) {
    return null;
  }

  if (!session?.user || !['admin', 'moderator'].includes((session.user as any).role || '')) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    return null;
  }

  return (
    <ThemeContextProvider>
      <AdminLayoutEnhanced
        title="拡張ダッシュボード"
        breadcrumbs={[{ label: '拡張ダッシュボード' }]}
      >
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
          {/* ヘッダーアクション */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              システム概況
            </Typography>
            <Stack direction="row" spacing={2}>
              <Tooltip title="データを更新">
                <IconButton onClick={fetchStats} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                variant={autoRefresh ? 'contained' : 'outlined'}
                startIcon={<AccessTime />}
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="small"
              >
                {autoRefresh ? '自動更新ON' : '自動更新OFF'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExport}
                size="small"
              >
                レポート出力
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {stats && (
            <>
              {/* KPI カード */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 3,
                  mb: 4,
                }}
              >
                <Box>
                  <Card sx={{ position: 'relative', overflow: 'visible' }}>
                    <LinearProgress
                      variant="determinate"
                      value={75}
                      sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                    />
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box>
                          <Typography color="text.secondary" gutterBottom variant="body2">
                            総ユーザー数
                          </Typography>
                          <Typography variant="h4" sx={{ mb: 1 }}>
                            {stats.users.total.toLocaleString()}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                            <Typography variant="body2" color="success.main">
                              +{stats.summary.newUsersThisWeek} 今週
                            </Typography>
                          </Box>
                        </Box>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                          <People />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Card sx={{ position: 'relative', overflow: 'visible' }}>
                    <LinearProgress
                      variant="determinate"
                      value={60}
                      color="secondary"
                      sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                    />
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box>
                          <Typography color="text.secondary" gutterBottom variant="body2">
                            アクティブ率
                          </Typography>
                          <Typography variant="h4" sx={{ mb: 1 }}>
                            {((stats.users.active / stats.users.total) * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {stats.users.active}/{stats.users.total}
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'secondary.light', width: 56, height: 56 }}>
                          <Speed />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Card sx={{ position: 'relative', overflow: 'visible' }}>
                    <LinearProgress
                      variant="determinate"
                      value={85}
                      color="success"
                      sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                    />
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box>
                          <Typography color="text.secondary" gutterBottom variant="body2">
                            総投稿数
                          </Typography>
                          <Typography variant="h4" sx={{ mb: 1 }}>
                            {stats.posts.total.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="info.main">
                            +{stats.posts.today} 今日
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                          <Article />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Card sx={{ position: 'relative', overflow: 'visible' }}>
                    <LinearProgress
                      variant="determinate"
                      value={parseInt(stats.summary.engagementRate)}
                      color="warning"
                      sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                    />
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box>
                          <Typography color="text.secondary" gutterBottom variant="body2">
                            エンゲージメント
                          </Typography>
                          <Typography variant="h4" sx={{ mb: 1 }}>
                            {stats.summary.engagementRate}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            いいね率
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                          <ThumbUp />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* グラフセクション */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                  gap: 3,
                  mb: 4,
                }}
              >
                {/* 週間アクティビティ */}
                <Box>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      週間アクティビティ
                    </Typography>
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                      {chartData.weeklyActivity.map((day) => (
                        <Box
                          key={day.day}
                          sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <Tooltip
                            title={`ユーザー: ${day.users}, 投稿: ${day.posts}, いいね: ${day.likes}`}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                              }}
                            >
                              <Box
                                sx={{
                                  width: '100%',
                                  backgroundColor: '#ffc658',
                                  height: day.likes / 2,
                                  mb: 0.5,
                                }}
                              />
                              <Box
                                sx={{
                                  width: '100%',
                                  backgroundColor: '#82ca9d',
                                  height: day.posts,
                                  mb: 0.5,
                                }}
                              />
                              <Box
                                sx={{
                                  width: '100%',
                                  backgroundColor: '#8884d8',
                                  height: day.users / 2,
                                }}
                              />
                            </Box>
                          </Tooltip>
                          <Typography variant="caption" sx={{ mt: 1 }}>
                            {day.day}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>

                {/* コンテンツタイプ分布 */}
                <Box>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      コンテンツタイプ
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      {chartData.contentTypes.map((type) => (
                        <Box key={type.name} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{type.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {type.value}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={type.value}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: 'grey.300',
                              '& .MuiLinearProgress-bar': { backgroundColor: type.color },
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>

                {/* ユーザー成長グラフ */}
                <Box>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      ユーザー成長推移
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      {chartData.userGrowth.map((month) => (
                        <Box key={month.month} sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            {month.month}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={`総数: ${month.total}`} size="small" color="primary" />
                            <Chip
                              label={`アクティブ: ${month.active}`}
                              size="small"
                              color="success"
                            />
                            <Chip
                              label={`${Math.round((month.active / month.total) * 100)}%`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>

                {/* システムステータス */}
                <Box>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      システムリソース
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      {Object.entries(chartData.systemStatus).map(([key, value]) => (
                        <Box key={key} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" textTransform="uppercase">
                              {key}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {value}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={value}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'grey.300',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor:
                                  value > 80
                                    ? 'error.main'
                                    : value > 60
                                      ? 'warning.main'
                                      : 'success.main',
                              },
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              </Box>

              {/* リアルタイムアクティビティ */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 3,
                }}
              >
                <Box>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      最近のユーザー登録
                    </Typography>
                    <List>
                      {stats.users.recent.map(
                        (
                          user: any // eslint-disable-line @typescript-eslint/no-explicit-any
                        ) => (
                          <ListItem key={user.id} sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.light' }}>
                                <PersonAdd />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={user.name} secondary={user.email} />
                            <Chip
                              label={user.role}
                              size="small"
                              color={
                                user.role === 'admin'
                                  ? 'error'
                                  : user.role === 'moderator'
                                    ? 'warning'
                                    : 'default'
                              }
                            />
                          </ListItem>
                        )
                      )}
                    </List>
                  </Paper>
                </Box>

                <Box>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      人気の投稿
                    </Typography>
                    <List>
                      {stats.posts.recent.map(
                        (
                          post: any // eslint-disable-line @typescript-eslint/no-explicit-any
                        ) => (
                          <ListItem key={post.id} sx={{ px: 0 }}>
                            <ListItemText
                              primary={<Typography noWrap>{post.content}</Typography>}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    icon={<ThumbUp />}
                                    label={post.likes}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    by {post.author?.name || '匿名'}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        )
                      )}
                    </List>
                  </Paper>
                </Box>

                <Box>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      システムアラート
                    </Typography>
                    <List>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.light' }}>
                            <CheckCircle />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="システム正常"
                          secondary="すべてのサービスが正常に動作中"
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.light' }}>
                            <Warning />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary="ストレージ使用率" secondary="52%使用中 - 監視継続" />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'info.light' }}>
                            <Analytics />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="バックアップ完了"
                          secondary="最終バックアップ: 2時間前"
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Box>
              </Box>
            </>
          )}
        </Container>
      </AdminLayoutEnhanced>
    </ThemeContextProvider>
  );
}
