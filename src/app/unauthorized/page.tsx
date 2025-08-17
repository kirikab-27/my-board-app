'use client';

import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  Card,
  CardContent,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Block as BlockIcon,
  Home as HomeIcon,
  Login as LoginIcon,
  ContactSupport as ContactIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const theme = useTheme();
  const { data: session, status } = useSession();
  const [loadingButton, setLoadingButton] = useState<string | null>(null);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
      display: 'flex',
      alignItems: 'center'
    }}>
      <Container maxWidth="md">
        <Card 
          sx={{ 
            p: 4,
            textAlign: 'center',
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)'
          }}
        >
          <CardContent>
            {/* エラーアイコン */}
            <BlockIcon 
              sx={{ 
                fontSize: 80, 
                color: 'error.main', 
                mb: 3 
              }} 
            />
            
            {/* タイトル */}
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'error.main',
                mb: 2
              }}
            >
              アクセス権限がありません
            </Typography>
            
            {/* 説明文 */}
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              このページにアクセスするための十分な権限がありません。
            </Typography>
            
            {/* 詳細情報 */}
            <Paper 
              sx={{ 
                p: 3, 
                mb: 4, 
                backgroundColor: alpha(theme.palette.warning.light, 0.1),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
              }}
            >
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>考えられる原因:</strong>
              </Typography>
              <Box component="ul" sx={{ textAlign: 'left', margin: 0, paddingLeft: 2 }}>
                <li>管理者権限が必要なページにアクセスしようとした</li>
                <li>ログインが必要なページに未認証でアクセスした</li>
                <li>メール認証が完了していない</li>
                <li>アカウントの権限レベルが不足している</li>
              </Box>
            </Paper>

            {/* 現在のセッション情報 */}
            <Paper 
              sx={{ 
                p: 2, 
                mb: 4, 
                backgroundColor: alpha(theme.palette.info.light, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>現在の認証状態:</strong> {
                  status === 'loading' ? '確認中...' :
                  status === 'authenticated' ? `ログイン済み (${session?.user?.email})` :
                  '未ログイン'
                }
              </Typography>
            </Paper>
            
            {/* アクションボタン */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mb: 2 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={loadingButton !== 'home' ? <HomeIcon /> : null}
                onClick={async () => {
                  setLoadingButton('home');
                  // 認証済みユーザーは掲示板へ、未認証はホームへ
                  const destination = status === 'authenticated' ? '/board' : '/';
                  router.push(destination);
                  setTimeout(() => setLoadingButton(null), 2000);
                }}
                disabled={loadingButton === 'home'}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                }}
              >
                {loadingButton === 'home' ? (
                  <CircularProgress size={24} color="inherit" />
                ) : status === 'authenticated' ? (
                  '掲示板に戻る'
                ) : (
                  'ホームに戻る'
                )}
              </Button>
              
              {status !== 'authenticated' && (
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
                    borderRadius: 2,
                  }}
                >
                  {loadingButton === 'login' ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'ログイン'
                  )}
                </Button>
              )}
              
              <Button
                variant="text"
                size="large"
                startIcon={loadingButton !== 'contact' ? <ContactIcon /> : null}
                onClick={async () => {
                  setLoadingButton('contact');
                  router.push('/contact');
                  setTimeout(() => setLoadingButton(null), 2000);
                }}
                disabled={loadingButton === 'contact'}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                }}
              >
                {loadingButton === 'contact' ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'お問い合わせ'
                )}
              </Button>
            </Stack>
            
            {/* 補足情報 */}
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mt: 3 }}
            >
              問題が解決しない場合は、お問い合わせページからご連絡ください。
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}