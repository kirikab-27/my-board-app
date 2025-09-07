'use client';

import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  People,
  Article,
  Analytics,
  Settings,
  ExitToApp,
  Lock,
  Security,
  Devices,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * 管理者機能専用レイアウトコンポーネント
 * Issue #45 Phase 3: 基本UI構造
 */
export function AdminLayout({ children, title = '管理者パネル' }: AdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { data: session } = useSession();

  const drawerWidth = 240;

  const menuItems = [
    { text: 'ダッシュボード', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'ユーザー管理', icon: <People />, path: '/admin/users' },
    { text: '投稿管理', icon: <Article />, path: '/admin/posts' },
    { text: '分析・統計', icon: <Analytics />, path: '/admin/analytics' },
    { text: '監査ログ', icon: <Security />, path: '/admin/audit-logs' },
    { text: '検証コード管理', icon: <Settings />, path: '/admin/verification' },
    { text: '秘密情報管理', icon: <Lock />, path: '/admin/secrets' },
    { text: '2段階認証', icon: <Security />, path: '/admin/security/2fa' },
    { text: 'セッション管理', icon: <Devices />, path: '/admin/sessions' },
    ...(session?.user?.role === 'admin' ? [
      { text: 'システム設定', icon: <Settings />, path: '/admin/settings' }
    ] : []),
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const sidebarContent = (
    <Box>
      {/* ロゴ・タイトル */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          🛡️ 管理者パネル
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {session?.user?.name}（{session?.user?.role}）
        </Typography>
      </Box>

      {/* メニュー */}
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => router.push(item.path)}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ color: 'primary.main' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}

        {/* ログアウト */}
        <ListItemButton
          onClick={handleLogout}
          sx={{
            mt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: 'error.light',
              color: 'error.contrastText',
            }
          }}
        >
          <ListItemIcon>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText primary="ログアウト" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* ヘッダー */}
      <AppBar
        position="fixed"
        sx={{
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
          ml: isMobile ? 0 : `${drawerWidth}px`,
          backgroundColor: 'error.main', // 管理者モードの視覚的識別
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* サイドバー */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // AppBarの高さ分
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}