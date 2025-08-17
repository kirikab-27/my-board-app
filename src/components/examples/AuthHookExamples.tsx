'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { useRequireAuth, useAuth, useRequireAdmin } from '@/hooks/useRequireAuth';

/**
 * 基本的な認証フック使用例
 */
export const BasicAuthExample: React.FC = () => {
  const { user, isLoading, error, recheckAuth } = useRequireAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>認証確認中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={recheckAuth}>
            再試行
          </Button>
        }
      >
        認証エラー: {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        ✅ 認証成功
      </Typography>
      <Typography>ようこそ、{user?.name}さん！</Typography>
      <Chip label={`権限: ${user?.role}`} color="primary" size="small" sx={{ mt: 1 }} />
    </Paper>
  );
};

/**
 * 管理者限定コンポーネント例
 */
export const AdminOnlyExample: React.FC = () => {
  const { user, isLoading, hasRequiredPermission } = useRequireAdmin({
    onUnauthorized: (reason) => {
      console.log('管理者権限が必要:', reason);
    },
  });

  if (isLoading) return <CircularProgress />;

  if (!hasRequiredPermission) {
    return <Alert severity="warning">このコンテンツは管理者のみ閲覧できます</Alert>;
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
      <Typography variant="h6">🔑 管理者限定エリア</Typography>
      <Typography>管理者として {user?.name} でログイン中</Typography>
    </Paper>
  );
};

/**
 * メール認証必須コンポーネント例
 */
export const EmailVerifiedExample: React.FC = () => {
  const { user, isLoading, error, hasRequiredPermission } = useRequireAuth({
    requireEmailVerified: true,
    redirectTo: '/auth/verify-email',
  });

  if (isLoading) return <CircularProgress />;

  if (error === 'email_not_verified') {
    return <Alert severity="info">メール認証が必要です。認証ページにリダイレクトします...</Alert>;
  }

  if (!hasRequiredPermission) {
    return <Alert severity="error">アクセス権限がありません</Alert>;
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'success.light' }}>
      <Typography variant="h6">✉️ メール認証済みエリア</Typography>
      <Typography>
        認証済みメール: {user?.email}
        <br />
        認証日時: {user?.emailVerified?.toLocaleDateString()}
      </Typography>
    </Paper>
  );
};

/**
 * カスタム権限チェック例
 */
export const CustomCheckExample: React.FC = () => {
  const { user, isLoading, error, hasRequiredPermission } = useRequireAuth({
    customCheck: (user) => {
      // 例: 特定の条件をチェック（作成から30日以内のユーザー）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return user.createdAt > thirtyDaysAgo;
    },
    onUnauthorized: () => {
      console.log('カスタムチェックに失敗しました');
    },
  });

  if (isLoading) return <CircularProgress />;

  if (error === 'custom_check_failed') {
    return (
      <Alert severity="warning">この機能は新規ユーザー（登録から30日以内）のみ利用できます</Alert>
    );
  }

  if (!hasRequiredPermission) {
    return <Alert severity="error">アクセス条件を満たしていません</Alert>;
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'info.light' }}>
      <Typography variant="h6">🆕 新規ユーザー限定機能</Typography>
      <Typography>
        登録日: {user?.createdAt.toLocaleDateString()}
        <br />
        この機能をご利用いただけます！
      </Typography>
    </Paper>
  );
};

/**
 * 認証フック使用例集
 */
export const AuthHookExamples: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        🔐 useRequireAuth フック使用例
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        現在のログインユーザー: {user?.name || '未ログイン'} ({user?.role || 'N/A'})
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                基本的な認証チェック
              </Typography>
              <BasicAuthExample />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                管理者限定エリア
              </Typography>
              <AdminOnlyExample />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                メール認証必須エリア
              </Typography>
              <EmailVerifiedExample />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                カスタムチェック例
              </Typography>
              <CustomCheckExample />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* コード例 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          使用例コード
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
            {`// 基本的な使用
const { user, isLoading, error } = useRequireAuth();

// 管理者権限必須
const { user, hasRequiredPermission } = useRequireAdmin();

// カスタム設定
const { user, isAuthenticated } = useRequireAuth({
  requiredRole: 'moderator',
  requireEmailVerified: true,
  customCheck: (user) => user.createdAt > thirtyDaysAgo,
  onUnauthorized: (reason) => console.log('Access denied:', reason)
});`}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};
