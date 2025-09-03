'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  AdminPanelSettings,
  People,
  Article,
  Analytics,
  Security,
} from '@mui/icons-material';

/**
 * 管理者ダッシュボード
 * Issue #45 Phase 3: 基本構造実装
 */
export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 管理者権限チェック
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/login?callbackUrl=/admin/dashboard');
      return;
    }

    // 管理者・モデレーター権限チェック
    if (!['admin', 'moderator'].includes(session.user.role || '')) {
      router.push('/dashboard?error=insufficient-permissions');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center">
          <Typography>認証確認中...</Typography>
        </Box>
      </Container>
    );
  }

  if (!session?.user || !['admin', 'moderator'].includes(session.user.role || '')) {
    return null; // リダイレクト処理中
  }

  const isAdmin = session.user.role === 'admin';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettings color="primary" />
          管理者ダッシュボード
        </Typography>
        <Typography variant="body1" color="text.secondary">
          システム管理・ユーザー管理・コンテンツモデレーション
        </Typography>
      </Box>

      {/* 権限表示 */}
      <Alert 
        severity={isAdmin ? 'info' : 'warning'} 
        sx={{ mb: 3 }}
      >
        現在のアクセス権限: <strong>{session.user.role === 'admin' ? '管理者' : 'モデレーター'}</strong>
        {isAdmin && ' - 全機能にアクセス可能'}
        {!isAdmin && ' - ユーザー・投稿管理のみ'}
      </Alert>

      {/* クイックアクション */}
      <Grid container spacing={3}>
        {/* ユーザー管理 */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">ユーザー管理</Typography>
              </Box>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                ユーザー一覧・詳細管理・権限制御
              </Typography>
              <Typography variant="body2" color="primary">
                実装予定: Phase 2
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 投稿管理 */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Article sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">投稿管理</Typography>
              </Box>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                投稿モデレーション・一括操作・スパム対策
              </Typography>
              <Typography variant="body2" color="primary">
                実装予定: Phase 2
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 分析機能 */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Analytics sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">分析・統計</Typography>
              </Box>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                トレンド分析・レポート・KPI管理
              </Typography>
              <Typography variant="body2" color="primary">
                実装予定: Phase 3
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* システム設定（管理者のみ） */}
        {isAdmin && (
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="h6">システム設定</Typography>
                </Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  セキュリティ設定・監査ログ・システム管理
                </Typography>
                <Typography variant="body2" color="primary">
                  実装予定: Phase 3
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 開発ステータス */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          開発ステータス - Issue #45
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'success.main' }}>
            ✅ Phase 1: Git環境構築完了
          </Typography>
          <Typography variant="body2" sx={{ color: 'success.main' }}>
            ✅ Phase 2: 設定ファイル実装完了
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            🔄 Phase 3: ディレクトリ構造構築中
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ⏳ Phase 4: 動作確認予定
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}