'use client';

import React from 'react';
import { Button, Menu, MenuItem, Box, Typography, IconButton, useMediaQuery, useTheme, Avatar } from '@mui/material';
import {
  Login as LoginIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Forum as ForumIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  Tag as TagIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { HeaderSearchIcon } from '@/components/ui/HeaderSearchIcon';

interface AuthButtonProps {
  isNavigationRow?: boolean;
  onSearch?: (query: string) => void;
  onClearSearch?: () => void;
  searchResultCount?: number;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ 
  isNavigationRow = false, 
  onSearch, 
  onClearSearch, 
  searchResultCount 
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = () => {
    signIn();
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut({ callbackUrl: '/' });
  };

  const handleProfile = () => {
    handleMenuClose();
    router.push('/profile');
  };

  const handleProfileEdit = () => {
    handleMenuClose();
    router.push('/profile/edit');
  };

  const handlePasswordChange = () => {
    handleMenuClose();
    router.push('/profile/password');
  };

  const handleBoard = () => {
    handleMenuClose();
    router.push('/board');
  };

  const handleHome = () => {
    handleMenuClose();
    router.push('/dashboard');
  };

  const handleUsers = () => {
    handleMenuClose();
    router.push('/users');
  };

  const handleTimeline = () => {
    handleMenuClose();
    router.push('/timeline');
  };

  const handleNotifications = () => {
    handleMenuClose();
    router.push('/notifications');
  };

  const handleHashtags = () => {
    handleMenuClose();
    router.push('/hashtags');
  };

  const handleUserSearch = () => {
    handleMenuClose();
    router.push('/users/search');
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    // 未認証時は2段目のナビゲーション行は表示しない
    if (isNavigationRow) {
      return null;
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ThemeToggle />
        <Button variant="outlined" startIcon={<LoginIcon />} onClick={handleLogin}>
          ログイン
        </Button>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleRegister}>
          新規登録
        </Button>
      </Box>
    );
  }

  // 2段目のナビゲーション行の場合
  if (isNavigationRow) {
    // デスクトップでのみナビゲーションボタンを表示
    if (!isMobile) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="text"
            startIcon={<HomeIcon />}
            onClick={handleHome}
            sx={{ color: 'inherit' }}
          >
            ダッシュボード
          </Button>
          <Button
            variant="text"
            startIcon={<ForumIcon />}
            onClick={handleBoard}
            sx={{ color: 'inherit' }}
          >
            掲示板
          </Button>
          <Button
            variant="text"
            startIcon={<TimelineIcon />}
            onClick={handleTimeline}
            sx={{ color: 'inherit' }}
          >
            タイムライン
          </Button>
          <Button
            variant="text"
            startIcon={<PeopleIcon />}
            onClick={handleUsers}
            sx={{ color: 'inherit' }}
          >
            ユーザー一覧
          </Button>
          <Button
            variant="text"
            startIcon={<TagIcon />}
            onClick={handleHashtags}
            sx={{ color: 'inherit' }}
          >
            ハッシュタグ
          </Button>
        </Box>
      );
    }
    // モバイルでは2段目は何も表示しない（アバターメニューに含める）
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ThemeToggle />
      {onSearch && onClearSearch && (
        <HeaderSearchIcon 
          onSearch={onSearch} 
          onClear={onClearSearch}
          resultCount={searchResultCount}
          placeholder="投稿を検索..."
        />
      )}
      <NotificationBell />
      <IconButton
        onClick={handleMenuOpen}
        sx={{ p: 0 }}
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        {session.user?.image ? (
          <Avatar
            src={session.user.image}
            alt={session.user.name || 'プロフィール画像'}
            sx={{ width: 32, height: 32 }}
          />
        ) : (
          <ProfileAvatar name={session.user?.name} size="small" />
        )}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" noWrap>
            {session.user?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {session.user?.email}
          </Typography>
        </Box>
        {/* モバイルでのみナビゲーションメニューを表示 */}
        {isMobile && [
          <MenuItem key="home" onClick={handleHome}>
            <HomeIcon sx={{ mr: 1 }} />
            ダッシュボード
          </MenuItem>,
          <MenuItem key="board" onClick={handleBoard}>
            <ForumIcon sx={{ mr: 1 }} />
            掲示板
          </MenuItem>,
          <MenuItem key="timeline" onClick={handleTimeline}>
            <TimelineIcon sx={{ mr: 1 }} />
            タイムライン
          </MenuItem>,
          <MenuItem key="users" onClick={handleUsers}>
            <PeopleIcon sx={{ mr: 1 }} />
            ユーザー一覧
          </MenuItem>,
          <MenuItem key="hashtags" onClick={handleHashtags}>
            <TagIcon sx={{ mr: 1 }} />
            ハッシュタグ
          </MenuItem>,
          <Box key="divider" sx={{ borderBottom: 1, borderColor: 'divider', my: 1 }} />
        ]}
        {/* ユーザー関連メニュー */}
        <MenuItem onClick={handleProfile}>
          <PersonIcon sx={{ mr: 1 }} />
          プロフィール表示
        </MenuItem>
        <MenuItem onClick={handleProfileEdit}>
          <EditIcon sx={{ mr: 1 }} />
          プロフィール編集
        </MenuItem>
        <MenuItem onClick={handlePasswordChange}>
          <LockIcon sx={{ mr: 1 }} />
          パスワード変更
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          ログアウト
        </MenuItem>
      </Menu>
    </Box>
  );
};
