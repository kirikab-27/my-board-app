'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Container,
  Typography,
  Box,
  Paper,
  AppBar,
  Toolbar,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Forum as ForumIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkIcon,
} from '@mui/icons-material';
import { AuthButton } from '@/components/auth/AuthButton';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingButton, setLoadingButton] = useState<string | null>(null);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Access Denied</div>;
  }

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ダッシュボード
          </Typography>
          <AuthButton />
        </Toolbar>
        {/* 2段目のナビゲーション行 */}
        <Toolbar variant="dense" sx={{ minHeight: 48, borderTop: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }}>
          <AuthButton isNavigationRow={true} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 18, sm: 20, md: 20 } }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            ようこそ！
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>ユーザー情報</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
              {session.user?.image ? (
                <Avatar
                  src={session.user.image}
                  alt={session.user.name || 'プロフィール画像'}
                  sx={{ width: 80, height: 80 }}
                />
              ) : (
                <ProfileAvatar name={session.user?.name} size="large" />
              )}
              <Box>
                <Typography variant="h6">{session.user?.name}</Typography>
                <Typography color="text.secondary">{session.user?.email}</Typography>
                <Typography variant="body2" color="text.secondary">ID: {session.user?.id}</Typography>
              </Box>
            </Box>
          </Box>

          {/* クイックアクション */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              クイックアクション
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ForumIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">掲示板</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      投稿・いいね・検索機能を利用
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        setLoadingButton('board');
                        router.push('/board');
                        // ナビゲーション完了後にローディング解除（タイムアウト）
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'board'}
                    >
                      {loadingButton === 'board' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        '掲示板へ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SecurityIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      <Typography variant="h6">セキュリティ</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      セキュリティ管理機能
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={async () => {
                        setLoadingButton('security');
                        router.push('/admin/security');
                        // ナビゲーション完了後にローディング解除（タイムアウト）
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'security'}
                    >
                      {loadingButton === 'security' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        '管理画面へ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="h6">プロフィール</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      プロフィール情報の確認・編集
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={async () => {
                        setLoadingButton('profile');
                        router.push('/profile');
                        // ナビゲーション完了後にローディング解除（タイムアウト）
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'profile'}
                    >
                      {loadingButton === 'profile' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'プロフィールへ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Phase 7.1: 管理者専用パネル */}
              {session?.user?.role === 'admin' && (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, width: '100%' }}>
                  {/* Phase 7.1: パフォーマンス測定 */}
                  <Box sx={{ flex: 1 }}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <SpeedIcon sx={{ mr: 1, color: 'info.main' }} />
                          <Typography variant="h6">Phase 7.1 パフォーマンス測定</Typography>
                        </Box>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                          システムのベースライン測定（管理者限定）
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={async () => {
                            setLoadingButton('performance');
                            // パフォーマンス測定を実行
                            const { default: PerformanceBaseline } = await import('@/utils/performance/baseline');
                            const baseline = new PerformanceBaseline();
                            await baseline.runMultipleMeasurements(3);
                            setLoadingButton(null);
                          }}
                          fullWidth
                          disabled={loadingButton === 'performance'}
                        >
                          {loadingButton === 'performance' ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            'ベースライン測定を実行'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </Box>

                  {/* Phase 7.1: 接続監視 */}
                  <Box sx={{ flex: 1 }}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <NetworkIcon sx={{ mr: 1, color: 'success.main' }} />
                          <Typography variant="h6">Phase 7.1 接続監視</Typography>
                        </Box>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                          リアルタイム接続状況・API応答時間監視
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={async () => {
                            setLoadingButton('connection');
                            try {
                              const response = await fetch('/api/monitoring/connection?detailed=true');
                              const data = await response.json();
                              console.log('接続監視メトリクス:', data);
                              if (data.warnings?.length > 0) {
                                alert(`警告: ${data.warnings.join(', ')}`);
                              } else {
                                alert(`システム正常\n平均応答時間: ${data.metrics.averageResponseTime.toFixed(0)}ms\nアクティブ接続: ${data.metrics.activeConnections}`);
                              }
                            } catch (error) {
                              console.error('接続監視エラー:', error);
                              alert('監視データの取得に失敗しました');
                            }
                            setLoadingButton(null);
                          }}
                          fullWidth
                          disabled={loadingButton === 'connection'}
                        >
                          {loadingButton === 'connection' ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            '接続状況を確認'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              )}
            </Grid>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">認証システム状況</Typography>
            <Typography color="text.secondary">
              NextAuth.js v4による認証システムが正常に動作しています。
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
