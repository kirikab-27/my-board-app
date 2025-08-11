'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Typography, Box, Paper, AppBar, Toolbar, Button, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import { Forum as ForumIcon, Security as SecurityIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { AuthButton } from '@/components/auth/AuthButton';
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
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ダッシュボード
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            ようこそ！
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">ユーザー情報</Typography>
            <Typography>名前: {session.user?.name}</Typography>
            <Typography>メール: {session.user?.email}</Typography>
            <Typography>ID: {session.user?.id}</Typography>
          </Box>

          {/* クイックアクション */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              クイックアクション
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
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