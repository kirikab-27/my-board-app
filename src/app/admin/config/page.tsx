'use client';

import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';
import ConfigManagement from '@/components/admin/config/ConfigManagement';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Box, Alert } from '@mui/material';

/**
 * システム設定管理ページ
 * Issue #61: システム設定管理（環境別・ホットリロード）
 */
export default function AdminConfigPage() {
  const { isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin'], // 管理者のみ
  });

  if (isLoading) {
    return (
      <AdminLayoutEnhanced title="システム設定管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <Alert severity="info">読み込み中...</Alert>
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  if (!hasAccess) {
    return (
      <AdminLayoutEnhanced title="システム設定管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <Alert severity="warning">
            管理者権限が必要です。adminロールでログインしてください。
          </Alert>
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  return (
    <AdminLayoutEnhanced title="システム設定管理">
      <ConfigManagement />
    </AdminLayoutEnhanced>
  );
}
