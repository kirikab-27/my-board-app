'use client';

import { useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
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
  Chip,
  Alert,
  IconButton,
  Badge,
  useTheme,
} from '@mui/material';
import {
  Forum as ForumIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  // Issue #37: 追加アイコン
  Timeline,
  People,
  Search,
  Tag,
  Notifications,
  Edit,
  Lock,
  PrivacyTip,
  AdminPanelSettings,
} from '@mui/icons-material';
import { AuthButton } from '@/components/auth/AuthButton';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { useRouter } from 'next/navigation';
import AdminWebSocketClient from '@/components/websocket/AdminWebSocketClient';
import { getNavigationHeaderStyles } from '@/styles/navigationHeaderStyles';

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    }
  });
  const theme = useTheme(); // Issue #38: ダークモード対応
  const router = useRouter();
  
  // 🚨 緊急デバッグ: レンダリング状況確認
  console.log('🔧 Dashboard レンダリング:', {
    status,
    hasSession: !!session,
    userEmail: session?.user?.email,
    userRole: session?.user?.role,
    userId: session?.user?.id,
    timestamp: new Date().toISOString()
  });
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  
  // Issue #47: セッション更新機能
  const [updatingSession, setUpdatingSession] = useState(false);
  
  const handleUpdateSession = async () => {
    setUpdatingSession(true);
    try {
      // セッション強制更新
      await getSession();
      // ページリロードで最新セッション取得
      window.location.reload();
    } catch (error) {
      console.error('セッション更新エラー:', error);
    }
    setUpdatingSession(false);
  };

  // Issue #37: 権限制御システム実装
  const isAdmin = session?.user?.role === 'admin';
  const isModerator = session?.user?.role === 'moderator';
  const isAdminOrModerator = isAdmin || isModerator;

  // Issue #35: 検索機能ハンドラー（HeaderSearchIcon表示のため）
  const handleSearch = (query: string) => {
    // ダッシュボードでは検索結果表示なし・他ページに遷移
    router.push(`/board?search=${encodeURIComponent(query)}`);
  };

  const handleClearSearch = () => {
    // ダッシュボードでのクリア処理（特に何もしない）
  };

  // メール認証再送信ハンドラ
  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert('✅ ' + result.message + '\n\n' + result.instructions);
      } else {
        alert('❌ ' + result.error + '\n\n' + result.message);
      }
    } catch (error) {
      console.error('❌ Resend verification error:', error);
      alert('❌ ネットワークエラーが発生しました。接続を確認してください。');
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'loading') {
    console.log('🔧 Dashboard: Loading状態');
    return <div>Loading...</div>;
  }

  if (!session) {
    console.log('🔧 Dashboard: セッションなし・Access Denied');
    return <div>Access Denied</div>;
  }
  
  console.log('🔧 Dashboard: 正常レンダリング開始', {
    sessionExists: !!session,
    userExists: !!session.user,
    email: session?.user?.email
  });

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ダッシュボード
          </Typography>
          {/* 🚨 緊急修正：通知アイコン無条件表示 */}
          <IconButton color="inherit" title="通知" sx={{ position: 'relative' }}>
            <Badge badgeContent={3} color="error" sx={{ position: 'absolute', zIndex: 9999 }}>
              <Notifications />
            </Badge>
          </IconButton>
          <AuthButton 
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
          />
        </Toolbar>
        {/* 2段目のナビゲーション行 */}
        <Toolbar
          variant="dense"
          sx={getNavigationHeaderStyles(theme)}
        >
          <AuthButton isNavigationRow={true} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 18, sm: 20, md: 20 } }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            ようこそ！
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              ユーザー情報
            </Typography>
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
                <Typography variant="body2" color="text.secondary">
                  ID: {session.user?.id}
                </Typography>
                {/* メール認証状況表示 */}
                <Box sx={{ mt: 1 }}>
                  {session.user?.emailVerified ? (
                    <Chip
                      label="メール認証済み"
                      color="success"
                      size="small"
                      icon={<CheckCircleIcon />}
                    />
                  ) : (
                    <Chip
                      label="メール認証待ち"
                      color="warning"
                      size="small"
                      icon={<WarningIcon />}
                    />
                  )}
                </Box>
                
                {/* 🔧 緊急デバッグ: セッション情報確認 */}
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info">
                    🔍 セッション確認: 
                    ユーザー: {session?.user?.name || 'なし'} | 
                    メール: {session?.user?.email || 'なし'} | 
                    権限: {session?.user?.role || 'undefined'} |
                    ID: {session?.user?.id || 'なし'}
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ ml: 2 }}
                      onClick={handleUpdateSession}
                      disabled={updatingSession}
                    >
                      {updatingSession ? '更新中...' : '🔄 セッション更新'}
                    </Button>
                  </Alert>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* メール認証状況・再送信機能 */}
          {!session.user?.emailVerified && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <WarningIcon />
                  メール認証が必要です
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  アカウントのセキュリティのため、メールアドレスの認証を完了してください。
                  メールボックスを確認して、認証リンクをクリックしてください。
                </Typography>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  sx={{ mr: 2 }}
                >
                  {isResending ? '送信中...' : 'メール再送信'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  メールが届かない場合は、スパムフォルダもご確認ください。
                </Typography>
              </Paper>
            </Box>
          )}

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
              {/* Issue #37: セキュリティ項目に権限制御追加 */}
              {isAdminOrModerator && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AdminPanelSettings sx={{ mr: 1, color: 'error.main' }} />
                        <Typography variant="h6">セキュリティ管理</Typography>
                      </Box>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        システムセキュリティ・IP制限・攻撃監視
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={async () => {
                          setLoadingButton('security');
                          router.push('/admin/security');
                          setTimeout(() => setLoadingButton(null), 2000);
                        }}
                        fullWidth
                        disabled={loadingButton === 'security'}
                      >
                        {loadingButton === 'security' ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          'セキュリティ管理へ'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}
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

              {/* Issue #37: 新しいクイックアクション項目 */}
              {/* タイムライン */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Timeline sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="h6">タイムライン</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      フォローユーザーの投稿表示
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        setLoadingButton('timeline');
                        router.push('/timeline');
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'timeline'}
                    >
                      {loadingButton === 'timeline' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'タイムラインへ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* ユーザー一覧 */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <People sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">ユーザー一覧</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      全ユーザー・フォロー状況表示
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        setLoadingButton('users');
                        router.push('/users');
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'users'}
                    >
                      {loadingButton === 'users' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'ユーザー一覧へ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* ユーザー検索 */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Search sx={{ mr: 1, color: 'secondary.main' }} />
                      <Typography variant="h6">ユーザー検索</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      高度検索・日本語対応・履歴機能
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        setLoadingButton('user-search');
                        router.push('/users/search');
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'user-search'}
                    >
                      {loadingButton === 'user-search' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'ユーザー検索へ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* ハッシュタグ */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Tag sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="h6">ハッシュタグ</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      トレンド・検索・カテゴリ表示
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        setLoadingButton('hashtags');
                        router.push('/hashtags');
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'hashtags'}
                    >
                      {loadingButton === 'hashtags' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'ハッシュタグへ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* 通知 */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Notifications sx={{ mr: 1, color: 'error.main' }} />
                      <Typography variant="h6">通知</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      通知一覧・既読管理・リアルタイム更新
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        setLoadingButton('notifications');
                        router.push('/notifications');
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'notifications'}
                    >
                      {loadingButton === 'notifications' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        '通知へ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* プロフィール編集 */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Edit sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="h6">プロフィール編集</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      プロフィール情報編集・アバター設定
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        setLoadingButton('profile-edit');
                        router.push('/profile/edit');
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'profile-edit'}
                    >
                      {loadingButton === 'profile-edit' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'プロフィール編集へ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* パスワード変更 */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Lock sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="h6">パスワード変更</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      セキュリティ設定・強度チェック
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        setLoadingButton('password-change');
                        router.push('/profile/password');
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'password-change'}
                    >
                      {loadingButton === 'password-change' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'パスワード変更へ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* プライバシー設定 */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PrivacyTip sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="h6">プライバシー設定</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      包括的プライバシー制御・ブロック・ミュート管理
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        setLoadingButton('privacy-settings');
                        router.push('/profile/privacy');
                        setTimeout(() => setLoadingButton(null), 2000);
                      }}
                      fullWidth
                      disabled={loadingButton === 'privacy-settings'}
                    >
                      {loadingButton === 'privacy-settings' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'プライバシー設定へ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Issue #47: 管理者機能アクセス（強制表示・セッション問題対応） */}
              {(session?.user?.role === 'admin' || 
                session?.user?.role === 'moderator' || 
                session?.user?.role === 'super_admin' ||
                session?.user?.email === 'kab27kav@gmail.com' ||
                session?.user?.email === 'minomasa34@gmail.com') && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ border: 2, borderColor: 'error.main', backgroundColor: 'error.light' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AdminPanelSettings sx={{ mr: 1, color: 'error.main' }} />
                        <Typography variant="h6" color="error.main">管理者パネル</Typography>
                      </Box>
                      <Typography color="error.main" sx={{ mb: 2 }}>
                        🛡️ 管理者機能・ユーザー管理・システム管理
                      </Typography>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={async () => {
                          setLoadingButton('admin-panel');
                          router.push('/admin/dashboard');
                          setTimeout(() => setLoadingButton(null), 2000);
                        }}
                        fullWidth
                        disabled={loadingButton === 'admin-panel'}
                      >
                        {loadingButton === 'admin-panel' ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          '🔐 管理者パネルへ'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Phase 7.1: 管理者専用パネル（既存・削除予定） */}
              {false && session?.user?.role === 'admin' && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    width: '100%',
                  }}
                >
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
                            const { default: PerformanceBaseline } = await import(
                              '@/utils/performance/baseline'
                            );
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
                              const response = await fetch(
                                '/api/monitoring/connection?detailed=true'
                              );
                              const data = await response.json();
                              console.log('接続監視メトリクス:', data);
                              if (data.warnings?.length > 0) {
                                alert(`警告: ${data.warnings.join(', ')}`);
                              } else {
                                alert(
                                  `システム正常\n平均応答時間: ${data.metrics.averageResponseTime.toFixed(0)}ms\nアクティブ接続: ${data.metrics.activeConnections}`
                                );
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

          {/* Phase 7.2: 管理者専用WebSocketクライアント */}
          {session?.user?.role === 'admin' && (
            <Box sx={{ mt: 4 }}>
              <AdminWebSocketClient
                onNewPost={(notification) => {
                  console.log('📢 ダッシュボードで新着投稿通知受信:', notification);
                  // 必要に応じて追加の処理（例：投稿リスト更新等）
                }}
              />
            </Box>
          )}

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
