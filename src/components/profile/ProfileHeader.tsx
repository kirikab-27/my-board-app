'use client';

import { AppBar, Toolbar, Typography } from '@mui/material';
import { AuthButton } from '@/components/auth/AuthButton';

interface ProfileHeaderProps {
  title?: string;
}

export function ProfileHeader({ title = 'プロフィール' }: ProfileHeaderProps) {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <AuthButton />
      </Toolbar>
    </AppBar>
  );
}
