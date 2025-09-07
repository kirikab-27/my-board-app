'use client';

import React from 'react';
import { useRequire2FA } from '@/hooks/use2FACheck';
import { Box, CircularProgress } from '@mui/material';
import { AdminLayout } from './AdminLayout';

interface Admin2FAWrapperProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * 管理者ページ用2FAチェックラッパー
 * すべての管理者ページで使用し、2FA検証を強制
 */
export function Admin2FAWrapper({ children, title = '管理者パネル' }: Admin2FAWrapperProps) {
  const { isChecking, requiresVerification } = useRequire2FA();

  // 2FAチェック中
  if (isChecking) {
    return (
      <AdminLayout title={title}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  // 2FA検証が必要（リダイレクト処理中）
  if (requiresVerification) {
    return (
      <AdminLayout title={title}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  // 2FAチェック完了
  return <>{children}</>;
}