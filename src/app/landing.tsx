'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid2,
  Card,
  CardContent,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Forum as ForumIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const [loadingButton, setLoadingButton] = useState<string | null>(null);

  // 認証済みユーザーは掲示板にリダイレクト
  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/board');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (status === 'authenticated') {
    return null; // リダイレクト処理中
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
        {/* ヒーローセクション */}
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            掲示板アプリ
          </Typography>

          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            安全で使いやすい会員制コミュニティプラットフォーム
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={loadingButton !== 'register' ? <PersonAddIcon /> : null}
              onClick={async () => {
                setLoadingButton('register');
                router.push('/register');
                setTimeout(() => setLoadingButton(null), 2000);
              }}
              disabled={loadingButton === 'register'}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                borderRadius: 2,
              }}
            >
              {loadingButton === 'register' ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                '新規登録'
              )}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={loadingButton !== 'login' ? <LoginIcon /> : null}
              onClick={async () => {
                setLoadingButton('login');
                router.push('/login');
                setTimeout(() => setLoadingButton(null), 2000);
              }}
              disabled={loadingButton === 'login'}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                borderRadius: 2,
              }}
            >
              {loadingButton === 'login' ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'ログイン'
              )}
            </Button>
          </Stack>
        </Box>

        {/* 機能紹介セクション */}
        <Grid2 container spacing={4} sx={{ mb: 8 }}>
          <Grid2 xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <ForumIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.primary.main,
                    mb: 2,
                  }}
                />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  リアルタイム掲示板
                </Typography>
                <Typography color="text.secondary">
                  投稿・いいね・検索・並び替え機能を備えた モダンな掲示板システム
                </Typography>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <SecurityIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.secondary.main,
                    mb: 2,
                  }}
                />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  セキュリティ
                </Typography>
                <Typography color="text.secondary">
                  メール認証・ブルートフォース対策・ CSRF保護による安全な認証システム
                </Typography>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <PeopleIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.success.main,
                    mb: 2,
                  }}
                />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  会員コミュニティ
                </Typography>
                <Typography color="text.secondary">
                  認証ユーザー限定の安全な コミュニケーション環境
                </Typography>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* 利用手順セクション */}
        <Paper sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" textAlign="center" gutterBottom>
            ご利用手順
          </Typography>
          <Grid2 container spacing={4} sx={{ mt: 2 }}>
            <Grid2 xs={12} sm={4}>
              <Box textAlign="center">
                <PersonAddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  1. ユーザー登録
                </Typography>
                <Typography color="text.secondary">
                  メールアドレスでアカウントを作成し、 認証メールを確認
                </Typography>
              </Box>
            </Grid2>
            <Grid2 xs={12} sm={4}>
              <Box textAlign="center">
                <LoginIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  2. ログイン
                </Typography>
                <Typography color="text.secondary">
                  メール・Google・GitHub いずれかの方法でログイン
                </Typography>
              </Box>
            </Grid2>
            <Grid2 xs={12} sm={4}>
              <Box textAlign="center">
                <DashboardIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  3. 掲示板利用
                </Typography>
                <Typography color="text.secondary">
                  投稿作成・いいね・検索など すべての機能をご利用可能
                </Typography>
              </Box>
            </Grid2>
          </Grid2>
        </Paper>

        {/* CTAセクション */}
        <Box textAlign="center">
          <Typography variant="h5" gutterBottom>
            今すぐ参加して、コミュニティの一員になりましょう！
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={loadingButton !== 'register-cta' ? <PersonAddIcon /> : null}
            onClick={async () => {
              setLoadingButton('register-cta');
              router.push('/register');
              setTimeout(() => setLoadingButton(null), 2000);
            }}
            disabled={loadingButton === 'register-cta'}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.2rem',
              borderRadius: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
          >
            {loadingButton === 'register-cta' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              '無料で始める'
            )}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
