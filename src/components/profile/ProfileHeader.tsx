'use client';

import { AppBar, Toolbar, Typography, useTheme } from '@mui/material';
import { AuthButton } from '@/components/auth/AuthButton';
import { getNavigationHeaderStyles } from '@/styles/navigationHeaderStyles';

interface ProfileHeaderProps {
  title?: string;
}

export function ProfileHeader({ title = 'プロフィール' }: ProfileHeaderProps) {
  const theme = useTheme(); // Issue #38: ダークモード対応

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <AuthButton />
      </Toolbar>
      {/* 2段目のナビゲーション行 */}
      <Toolbar variant="dense" sx={getNavigationHeaderStyles(theme)}>
        <AuthButton isNavigationRow={true} />
      </Toolbar>
    </AppBar>
  );
}
