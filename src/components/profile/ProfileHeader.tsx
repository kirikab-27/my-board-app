'use client';

import { AppBar, Toolbar, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { AuthButton } from '@/components/auth/AuthButton';
import { getNavigationHeaderStyles } from '@/styles/navigationHeaderStyles';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

interface ProfileHeaderProps {
  title?: string;
}

export function ProfileHeader({ title = 'プロフィール' }: ProfileHeaderProps) {
  const theme = useTheme(); // Issue #38: ダークモード対応
  const [isMounted, setIsMounted] = useState(false);

  // Hydration安全: Issue #42で学んだ解決策適用
  useIsomorphicLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  // SSR時は固定スタイル・CSR時はテーマ適応スタイル
  const navigationStyles = isMounted 
    ? getNavigationHeaderStyles(theme)
    : {
        minHeight: 48, 
        borderTop: 1, 
        borderColor: 'rgba(255, 255, 255, 0.12)',
        bgcolor: 'primary.main' 
      };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <AuthButton />
      </Toolbar>
      {/* 2段目のナビゲーション行 */}
      <Toolbar variant="dense" sx={navigationStyles}>
        <AuthButton isNavigationRow={true} />
      </Toolbar>
    </AppBar>
  );
}
