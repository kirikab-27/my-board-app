'use client';

import React from 'react';
import { Box, Container, AppBar, Toolbar, Typography, IconButton, Paper } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function PrivacySettingsPage() {
  const router = useRouter();

  // 認証必須
  const { isLoading } = useRequireAuth({
    requiredRole: 'user',
    redirectTo: '/login?callbackUrl=/profile/privacy',
  });

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: { xs: 10, sm: 12, md: 12 } }}>
        <Box display="flex" justifyContent="center" py={4}>
          <Typography>読み込み中...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      {/* ヘッダー */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <SecurityIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            プライバシー設定
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 10, sm: 12, md: 12 }, pb: 4 }}>
        {/* ユーザー情報表示 */}
        <Paper elevation={2} sx={{ mb: 3, p: 3 }}>
          <Typography variant="h5" gutterBottom>
            プライバシーとセキュリティ (Minimal Version)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This is a minimal version to test Lambda generation.
          </Typography>
        </Paper>
      </Container>
    </>
  );
}
