'use client';

import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { Flag as FlagIcon } from '@mui/icons-material';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';
import dynamic from 'next/dynamic';

const ReportManagementGrid = dynamic(
  () => import('@/components/admin/reports/ReportManagementGrid'),
  {
    ssr: false,
    loading: () => <CircularProgress />,
  }
);

/**
 * 管理者通報管理ページ
 * Issue #60: レポート・通報システム
 */
export default function AdminReportsPage() {
  const { isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin', 'moderator'],
  });

  if (isLoading || !hasAccess) {
    return (
      <AdminLayoutEnhanced title="通報管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  return (
    <AdminLayoutEnhanced title="通報管理">
      <Box sx={{ p: 3 }}>
        {/* ヘッダー */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
        >
          <FlagIcon color="error" />
          通報管理システム
        </Typography>

        {/* 説明 */}
        <Alert severity="info" sx={{ mb: 3 }}>
          ユーザーから通報されたコンテンツを管理します。
          優先度の高い通報から順に対応し、24時間以内の初回対応を目指してください。
        </Alert>

        {/* ReportManagementGridコンポーネント */}
        <ReportManagementGrid />

        {/* 実装ステータス */}
        <Alert severity="success" sx={{ mt: 3 }}>
          ✅ Issue #60 Phase 1-2実装完了: 通報受付・管理機能・DataGrid統合
        </Alert>
      </Box>
    </AdminLayoutEnhanced>
  );
}
