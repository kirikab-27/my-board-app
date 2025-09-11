'use client';

import React, { useState, useEffect } from 'react';
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
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
  Badge,
  Tooltip,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
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
  Menu as MenuIcon,
  NavigateNext,
  Notifications,
  DarkMode,
  LightMode,
  ExpandLess,
  ExpandMore,
  PersonAdd,
  PostAdd,
  Assessment,
  KeyboardArrowUp,
  Home,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useThemeMode } from '@/contexts/ThemeContext';

interface AdminLayoutEnhancedProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

/**
 * 拡張管理者レイアウトコンポーネント
 * Issue #56: 管理画面レイアウトシステム
 */
export function AdminLayoutEnhanced({
  children,
  title = '管理者パネル',
  breadcrumbs = [],
}: AdminLayoutEnhancedProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mode, toggleMode } = useThemeMode();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scrollTrigger, setScrollTrigger] = useState(false);

  const drawerWidth = 260;

  // 現在のパスに基づいてどのグループに属するか判定
  const getActiveGroup = (path: string) => {
    if (
      path.includes('/admin/audit-logs') ||
      path.includes('/admin/security') ||
      path.includes('/admin/sessions') ||
      path.includes('/admin/rbac')
    ) {
      return 'security';
    }
    if (
      path.includes('/admin/secrets') ||
      path.includes('/admin/verification') ||
      path === '/admin/settings' ||
      path === '/admin/config'
    ) {
      return 'system';
    }
    return 'basic';
  };

  const activeGroup = getActiveGroup(pathname || '');

  // アコーディオンの開閉状態（初期値はサーバー・クライアント共通）
  const [basicMenuOpen, setBasicMenuOpen] = useState(activeGroup === 'basic');
  const [systemMenuOpen, setSystemMenuOpen] = useState(activeGroup === 'system');
  const [securityMenuOpen, setSecurityMenuOpen] = useState(activeGroup === 'security');

  // クライアントサイドでlocalStorageから状態を復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBasic = localStorage.getItem('admin-menu-basic');
      const savedSystem = localStorage.getItem('admin-menu-system');
      const savedSecurity = localStorage.getItem('admin-menu-security');

      if (savedBasic !== null) setBasicMenuOpen(savedBasic === 'true');
      if (savedSystem !== null) setSystemMenuOpen(savedSystem === 'true');
      if (savedSecurity !== null) setSecurityMenuOpen(savedSecurity === 'true');
    }
  }, []);

  // メニューの開閉状態をlocalStorageに保存
  const saveMenuState = (menuName: string, isOpen: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`admin-menu-${menuName}`, String(isOpen));
    }
  };

  // 初回レンダリング時、現在のパスのグループを確実に開く
  useEffect(() => {
    const group = getActiveGroup(pathname || '');
    // 現在のパスのグループが閉じていたら開く
    if (group === 'basic' && !basicMenuOpen) {
      setBasicMenuOpen(true);
      saveMenuState('basic', true);
    } else if (group === 'system' && !systemMenuOpen) {
      setSystemMenuOpen(true);
      saveMenuState('system', true);
    } else if (group === 'security' && !securityMenuOpen) {
      setSecurityMenuOpen(true);
      saveMenuState('security', true);
    }
  }, [pathname]);

  // 自動ブレッドクラム生成
  const generateBreadcrumbs = () => {
    const pathMap: { [key: string]: string } = {
      '/admin/dashboard': 'ダッシュボード',
      '/admin/users': 'ユーザー管理',
      '/admin/posts': '投稿管理',
      '/admin/analytics': '分析・統計',
      '/admin/logs': 'ログ管理',
      '/admin/settings': 'システム設定',
      '/admin/config': 'システム設定管理',
      '/admin/audit-logs': '監査ログ',
      '/admin/security/2fa': '2段階認証',
      '/admin/sessions': 'セッション管理',
      '/admin/secrets': '環境変数管理',
      '/admin/verification': '検証コード',
      '/admin/dashboard/enhanced': '拡張ダッシュボード',
      '/admin/rbac': 'ロール・権限管理',
    };

    // カスタムブレッドクラムが指定されていればそれを使用
    if (breadcrumbs && breadcrumbs.length > 0) {
      return breadcrumbs;
    }

    // パスから自動生成
    const generatedBreadcrumbs = [{ label: 'ホーム', href: '/admin/dashboard' }];

    if (pathname && pathname !== '/admin/dashboard') {
      const label = pathMap[pathname] || title;
      generatedBreadcrumbs.push({ label, href: pathname });
    }

    return generatedBreadcrumbs;
  };

  const finalBreadcrumbs = generateBreadcrumbs();

  // スクロール検知
  useEffect(() => {
    const handleScroll = () => {
      const trigger = window.scrollY > 100;
      setScrollTrigger(trigger);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 通知数の取得（仮実装）
  useEffect(() => {
    // TODO: 実際のAPIから取得
    setNotificationCount(3);
  }, []);

  const menuGroups = [
    {
      title: '基本機能',
      items: [
        { text: 'ダッシュボード', icon: <Dashboard />, path: '/admin/dashboard' },
        { text: 'ユーザー管理', icon: <People />, path: '/admin/users' },
        { text: '投稿管理', icon: <Article />, path: '/admin/posts' },
        { text: '分析・統計', icon: <Analytics />, path: '/admin/analytics' },
      ],
    },
    {
      title: 'セキュリティ',
      items: [
        { text: '監査ログ', icon: <Security />, path: '/admin/audit-logs' },
        { text: '2段階認証', icon: <Lock />, path: '/admin/security/2fa' },
        { text: 'セッション管理', icon: <Devices />, path: '/admin/sessions' },
        { text: 'ロール・権限管理', icon: <Security />, path: '/admin/rbac' },
      ],
    },
    {
      title: 'システム',
      show: session?.user?.role === 'admin',
      items: [
        { text: '環境変数管理', icon: <Settings />, path: '/admin/secrets' },
        { text: '検証コード', icon: <Lock />, path: '/admin/verification' },
        { text: 'システム設定', icon: <Settings />, path: '/admin/settings' },
        { text: 'システム設定管理', icon: <Settings />, path: '/admin/config' },
      ],
    },
  ];

  const quickActions = [
    {
      icon: <PersonAdd />,
      name: '新規ユーザー',
      action: () => router.push('/admin/users?action=new'),
    },
    { icon: <PostAdd />, name: '投稿作成', action: () => router.push('/admin/posts?action=new') },
    {
      icon: <Assessment />,
      name: 'レポート生成',
      action: () => router.push('/admin/analytics?action=report'),
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ロゴ・タイトル */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          🛡️ 管理者パネル
        </Typography>
        <Chip
          label={session?.user?.role?.toUpperCase()}
          size="small"
          color="error"
          sx={{ mt: 1 }}
        />
      </Box>

      {/* メニューグループ */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ px: 1 }}>
          {menuGroups.map((group) => {
            if (group.show === false) return null;

            // アコーディオンの開閉状態を管理
            const isOpen =
              group.title === '基本機能'
                ? basicMenuOpen
                : group.title === 'システム'
                  ? systemMenuOpen
                  : group.title === 'セキュリティ'
                    ? securityMenuOpen
                    : true;

            const handleToggle = () => {
              if (group.title === '基本機能') {
                const newState = !basicMenuOpen;
                setBasicMenuOpen(newState);
                saveMenuState('basic', newState);
              } else if (group.title === 'システム') {
                const newState = !systemMenuOpen;
                setSystemMenuOpen(newState);
                saveMenuState('system', newState);
              } else if (group.title === 'セキュリティ') {
                const newState = !securityMenuOpen;
                setSecurityMenuOpen(newState);
                saveMenuState('security', newState);
              }
            };

            return (
              <Box key={group.title}>
                <ListItemButton onClick={handleToggle} sx={{ py: 0.5, px: 2 }}>
                  <ListItemText
                    primary={
                      <Typography variant="caption" color="text.secondary">
                        {group.title}
                      </Typography>
                    }
                  />
                  {(group.title === '基本機能' ||
                    group.title === 'システム' ||
                    group.title === 'セキュリティ') &&
                    (isOpen ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>

                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  {group.items.map((item) => {
                    const isActive = pathname === item.path;

                    return (
                      <ListItemButton
                        key={item.path}
                        onClick={() => {
                          router.push(item.path);
                          if (isMobile) setMobileOpen(false);
                        }}
                        selected={isActive}
                        sx={{
                          mx: 1,
                          my: 0.5,
                          borderRadius: 1,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            transform: 'translateX(4px)',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                            },
                            '& .MuiListItemIcon-root': {
                              color: 'primary.contrastText',
                            },
                          },
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                    );
                  })}
                </Collapse>
              </Box>
            );
          })}
        </List>
      </Box>

      {/* フッター */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItemButton
          onClick={() => router.push('/dashboard')}
          sx={{
            mb: 1,
            borderRadius: 1,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <Home />
          </ListItemIcon>
          <ListItemText primary="通常画面に戻る" />
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'error.light',
              color: 'error.contrastText',
            },
          }}
        >
          <ListItemIcon>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText primary="ログアウト" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <AppBar
        position="fixed"
        elevation={scrollTrigger ? 4 : 1}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'error.main',
          transition: 'all 0.3s',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div">
              {title}
            </Typography>

            {/* ブレッドクラム */}
            {finalBreadcrumbs.length > 0 && (
              <Breadcrumbs
                separator={<NavigateNext fontSize="small" />}
                aria-label="breadcrumb"
                sx={{ mt: 0.5 }}
              >
                {finalBreadcrumbs.map((crumb, index) => {
                  const isLast = index === finalBreadcrumbs.length - 1;
                  return isLast ? (
                    <Typography key={index} color="text.primary">
                      {crumb.label}
                    </Typography>
                  ) : (
                    <Link
                      key={index}
                      underline="hover"
                      color="inherit"
                      href={crumb.href || '#'}
                      onClick={(e) => {
                        e.preventDefault();
                        if (crumb.href) router.push(crumb.href);
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      {crumb.label}
                    </Link>
                  );
                })}
              </Breadcrumbs>
            )}
          </Box>

          {/* 右側のアクション */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* ダークモード切り替え */}
            <Tooltip title="テーマ切り替え">
              <IconButton color="inherit" onClick={toggleMode}>
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            {/* 通知 */}
            <Tooltip title="通知">
              <IconButton color="inherit">
                <Badge badgeContent={notificationCount} color="warning">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* プロフィール */}
            <Tooltip title="アカウント">
              <IconButton onClick={handleProfileMenu} color="inherit">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'error.dark' }}>
                  {session?.user?.name?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* プロフィールメニュー */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileClose}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{session?.user?.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {session?.user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            handleProfileClose();
            router.push('/admin/profile');
          }}
        >
          プロフィール設定
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleProfileClose();
            router.push('/admin/security/2fa');
          }}
        >
          2段階認証設定
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleProfileClose();
            router.push('/dashboard');
          }}
        >
          <ListItemIcon>
            <Home fontSize="small" />
          </ListItemIcon>
          通常画面に戻る
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          ログアウト
        </MenuItem>
      </Menu>

      {/* サイドバー */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="管理メニュー"
      >
        {/* モバイル用 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // モバイルパフォーマンス向上
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor:
                theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
            },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* デスクトップ用 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor:
                theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: { xs: 7, sm: 8 },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50',
          minHeight: '100vh',
        }}
      >
        {children}

        {/* スクロールトップボタン */}
        {scrollTrigger && (
          <Tooltip title="トップへ戻る">
            <IconButton
              onClick={handleScrollTop}
              sx={{
                position: 'fixed',
                bottom: 80,
                right: 20,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
              size="large"
            >
              <KeyboardArrowUp />
            </IconButton>
          </Tooltip>
        )}

        {/* クイックアクション（SpeedDial） */}
        <SpeedDial
          ariaLabel="クイックアクション"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          {quickActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.action}
            />
          ))}
        </SpeedDial>
      </Box>
    </Box>
  );
}

// default exportも提供（互換性のため）
export default AdminLayoutEnhanced;
