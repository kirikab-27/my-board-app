'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
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
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings,
  People,
  Article,
  Analytics,
  Security,
  TrendingUp,
  PersonAdd,
  ThumbUp,
} from '@mui/icons-material';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * 管理者ダッシュボード
 * Issue #51: 管理者ページ基本機能実装
 */
export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 管理者権限チェック
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/login?callbackUrl=/admin/dashboard');
      return;
    }

    // 管理者・モデレーター権限チェック
    if (!['admin', 'moderator'].includes((session.user as any).role || '')) {
      router.push('/dashboard?error=insufficient-permissions');
      return;
    }
  }, [session, status, router]);

  // 統計情報取得
  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('統計情報の取得に失敗しました');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout title="管理者ダッシュボード">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (!session?.user || !['admin', 'moderator'].includes((session.user as any).role || '')) {
    return null; // リダイレクト処理中
  }

  const isAdmin = (session.user as any).role === 'admin';

  return (
    <AdminLayout title="管理者ダッシュボード">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 統計カード */}
        {stats && (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* 総ユーザー数 */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          総ユーザー数
                        </Typography>
                        <Typography variant="h4">
                          {stats.users.total}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          +{stats.summary.newUsersThisWeek} 今週
                        </Typography>
                      </Box>
                      <People sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* アクティブユーザー */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          アクティブユーザー
                        </Typography>
                        <Typography variant="h4">
                          {stats.users.active}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          過去7日間
                        </Typography>
                      </Box>
                      <TrendingUp sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 総投稿数 */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          総投稿数
                        </Typography>
                        <Typography variant="h4">
                          {stats.posts.total}
                        </Typography>
                        <Typography variant="body2" color="info.main">
                          +{stats.posts.today} 今日
                        </Typography>
                      </Box>
                      <Article sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* エンゲージメント率 */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          エンゲージメント率
                        </Typography>
                        <Typography variant="h4">
                          {stats.summary.engagementRate}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          いいね率
                        </Typography>
                      </Box>
                      <ThumbUp sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 詳細情報 */}
            <Grid container spacing={3}>
              {/* ユーザー分布 */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    ユーザー分布
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">管理者</Typography>
                      <Chip label={stats.users.byRole.admin} color="error" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">モデレーター</Typography>
                      <Chip label={stats.users.byRole.moderator} color="warning" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">一般ユーザー</Typography>
                      <Chip label={stats.users.byRole.user} color="primary" size="small" />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    今週の新規登録: {stats.summary.newUsersThisWeek}人
                  </Typography>
                </Paper>
              </Grid>

              {/* 最近のユーザー */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    最近のユーザー登録
                  </Typography>
                  <List dense>
                    {stats.users.recent.map((user: any) => (
                      <ListItem key={user.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <PersonAdd fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.name}
                          secondary={user.email}
                        />
                        <Chip 
                          label={user.role} 
                          size="small" 
                          color={user.role === 'admin' ? 'error' : user.role === 'moderator' ? 'warning' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* 最近の投稿 */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    最近の投稿
                  </Typography>
                  <List dense>
                    {stats.posts.recent.map((post: any) => (
                      <ListItem key={post.id}>
                        <ListItemText
                          primary={post.content}
                          secondary={
                            <>
                              {post.author?.name || '匿名'} • ♥ {post.likes}
                            </>
                          }
                          primaryTypographyProps={{
                            noWrap: true,
                            style: { fontSize: '0.875rem' }
                          }}
                          secondaryTypographyProps={{
                            component: 'span'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>

            {/* 今週のサマリー */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                今週のサマリー
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Alert severity="info" icon={<People />}>
                    新規ユーザー: {stats.summary.newUsersThisWeek}人
                  </Alert>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Alert severity="success" icon={<Article />}>
                    新規投稿: {stats.summary.postsThisWeek}件
                  </Alert>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Alert severity="warning" icon={<Analytics />}>
                    エンゲージメント: {stats.summary.engagementRate}
                  </Alert>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}
      </Container>
    </AdminLayout>
  );
}