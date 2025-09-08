'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Person as PersonIcon,
  GridView,
  TableChart,
} from '@mui/icons-material';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';

// Dynamic import for DataGrid component
const UserManagementGrid = dynamic(
  () => import('./UserManagementGrid'),
  { 
    loading: () => <CircularProgress />,
    ssr: false 
  }
);

/**
 * 管理者ユーザー管理ページ
 * Issue #58: 高度なユーザー管理システム実装
 */
export default function AdminUsersPage() {
  const { isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin', 'moderator'],
  });

  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading || !hasAccess) {
    return (
      <AdminLayoutEnhanced title="ユーザー管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  return (
    <AdminLayoutEnhanced title="ユーザー管理">
      <Container maxWidth="xl">
        {/* ヘッダー */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <PersonIcon color="primary" />
            ユーザー管理
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Issue #58: 高度なユーザー管理システム - DataGrid統合・一括操作・高速検索
          </Typography>
        </Box>

        {/* タブ切り替え */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<GridView />} label="DataGridビュー" />
            <Tab icon={<TableChart />} label="従来のテーブル" />
          </Tabs>
        </Paper>

        {/* コンテンツ */}
        {tabValue === 0 && (
          <Paper sx={{ p: 2, height: 'calc(100vh - 320px)' }}>
            <UserManagementGrid />
          </Paper>
        )}

        {tabValue === 1 && (
          <Alert severity="info">
            従来のテーブルビューは段階的に廃止予定です。DataGridビューをご利用ください。
          </Alert>
        )}

        {/* 実装状況 */}
        <Alert severity="success" sx={{ mt: 3 }}>
          ✅ Issue #58 Phase 1-3 実装完了:
          <ul style={{ margin: '8px 0 0 0' }}>
            <li>高度な検索・フィルター機能</li>
            <li>一括選択・操作機能（権限変更・停止・認証）</li>
            <li>CSV/JSONエクスポート機能</li>
            <li>リアルタイムソート・ページネーション</li>
            <li>監査ログ自動記録</li>
          </ul>
        </Alert>
      </Container>
    </AdminLayoutEnhanced>
  );
}
