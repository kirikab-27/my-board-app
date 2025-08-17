'use client';

import React from 'react';
import { Button, Menu, MenuItem, Box, Typography, IconButton } from '@mui/material';
import {
  Login as LoginIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Forum as ForumIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';

export const AuthButton: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="outlined" startIcon={<LoginIcon />} onClick={handleLogin}>
          ログイン
        </Button>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleRegister}>
          新規登録
        </Button>
      </Box>
    );
  }

  return (
    <>
      <IconButton
        onClick={handleMenuOpen}
        sx={{ p: 0 }}
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <ProfileAvatar name={session.user?.name} size="small" />
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
        <MenuItem onClick={handleBoard}>
          <ForumIcon sx={{ mr: 1 }} />
          掲示板
        </MenuItem>
        <MenuItem onClick={handleProfile}>
          <PersonIcon sx={{ mr: 1 }} />
          プロフィール
        </MenuItem>
        <MenuItem onClick={handleUsers}>
          <PeopleIcon sx={{ mr: 1 }} />
          ユーザー一覧
        </MenuItem>
        <MenuItem onClick={handleHome}>
          <HomeIcon sx={{ mr: 1 }} />
          ホーム
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          ログアウト
        </MenuItem>
      </Menu>
    </>
  );
};
