'use client';

import React from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { AuthButton } from '@/components/auth/AuthButton';
import { NotificationList } from '@/components/notifications/NotificationList';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function NotificationsPage() {
  const { isLoading } = useRequireAuth({
    redirectTo: '/login',
    requiredRole: 'user',
  });

  const handleNotificationClick = (notification: any) => {
    // 通知のタイプに応じてページ遷移
    if (notification.metadata?.postId) {
      window.location.href = `/board/${notification.metadata.postId}`;
    } else if (notification.metadata?.linkUrl) {
      window.location.href = notification.metadata.linkUrl;
    } else if (notification.type === 'follow' && notification.fromUserId) {
      window.location.href = `/users/${notification.fromUserId}`;
    }
    // その他の通知タイプは既読マークのみ
  };

  if (isLoading) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              通知センター
            </Typography>
            <AuthButton />
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <Typography>読み込み中...</Typography>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            通知センター
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
          <NotificationList
            onNotificationClick={handleNotificationClick}
            showControls={true}
          />
        </Paper>
      </Container>
    </>
  );
}