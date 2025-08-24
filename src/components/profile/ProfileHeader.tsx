'use client';

import { AppBar, Toolbar, Typography } from '@mui/material';
import { AuthButton } from '@/components/auth/AuthButton';

interface ProfileHeaderProps {
  title?: string;
}

export function ProfileHeader({ title = 'プロフィール' }: ProfileHeaderProps) {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <AuthButton />
      </Toolbar>
      {/* 2段目のナビゲーション行 */}
      <Toolbar variant="dense" sx={{ minHeight: 48, borderTop: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }}>
        <AuthButton isNavigationRow={true} />
      </Toolbar>
    </AppBar>
  );
}
