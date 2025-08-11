'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      // 現在のURLをcallbackUrlとして保存してリダイレクト
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [session, status, router, pathname]);

  if (status === 'loading') {
    return fallback || (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '50vh',
          gap: 2 
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          認証情報を確認中...
        </Typography>
      </Box>
    );
  }

  if (!session) {
    return fallback || (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '50vh' 
        }}
      >
        <Typography variant="h6" color="text.secondary">
          認証が必要です
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};