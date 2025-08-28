'use client';

import React from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  VolumeOff as MuteIcon,
  NotificationsActive as NotificationsIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { PrivacySettingsForm } from '@/components/privacy/PrivacySettingsForm';
import { BlockedUsersManager } from '@/components/privacy/BlockedUsersManager';
import { MuteManager } from '@/components/privacy/MuteManager';
import { NotificationController } from '@/components/privacy/NotificationController';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = React.useState(0);

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

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
            プライバシーとセキュリティ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            あなたの情報の公開範囲と、誰があなたのコンテンツにアクセスできるかを管理します。
          </Typography>
        </Paper>

        {/* タブナビゲーション */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<SecurityIcon />} label="プライバシー設定" iconPosition="start" />
            <Tab icon={<BlockIcon />} label="ブロック管理" iconPosition="start" />
            <Tab icon={<MuteIcon />} label="ミュート管理" iconPosition="start" />
            <Tab icon={<NotificationsIcon />} label="通知制御" iconPosition="start" />
          </Tabs>
        </Paper>

        {/* タブコンテンツ */}
        <Paper elevation={2} sx={{ p: 3 }}>
          {currentTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                プライバシー設定
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                あなたの情報がどこまで公開されるかを詳細に設定できます。
              </Typography>
              <PrivacySettingsForm />
            </Box>
          )}

          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                ブロック管理
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                ブロックしたユーザーの管理と、新しいユーザーのブロックができます。
              </Typography>
              <BlockedUsersManager />
            </Box>
          )}

          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                ミュート管理
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                ユーザー、キーワード、ハッシュタグ、ドメインのミュート設定ができます。
              </Typography>
              <MuteManager />
            </Box>
          )}

          {currentTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                通知制御
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                通知の送信者制限、内容フィルタ、受信時間帯、優先度設定ができます。
              </Typography>
              <NotificationController />
            </Box>
          )}
        </Paper>

        {/* ヘルプテキスト */}
        <Paper elevation={1} sx={{ mt: 3, p: 2, bgcolor: 'info.main', color: 'info.contrastText' }}>
          <Typography variant="body2">
            💡 <strong>ヒント:</strong> プライバシー設定はいつでも変更できます。
            設定を変更した場合、新しい設定は即座に適用されます。
          </Typography>
        </Paper>

        {/* 注意事項 */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            ⚠️ ブロック機能は相互に適用されます。あなたがユーザーをブロックすると、
            そのユーザーもあなたのコンテンツを見ることができなくなります。
          </Typography>
        </Box>
      </Container>
    </>
  );
}
