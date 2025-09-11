'use client';

import React from 'react';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';
import RoleManagement from '@/components/admin/RoleManagement';
import { Box, Typography, Paper } from '@mui/material';

/**
 * RBAC管理ページ
 * Issue #47: Enterprise級権限管理システム
 */
export default function AdminRBACPage() {
  return (
    <AdminLayoutEnhanced title="ロール・権限管理">
      <Box>
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant="h4" gutterBottom>
            ロールベースアクセス制御（RBAC）
          </Typography>
          <Typography variant="body1" color="text.secondary">
            管理者のロールと権限を管理します。各ロールには特定の権限が割り当てられ、
            管理者は割り当てられたロールに基づいてシステムへのアクセスが制御されます。
          </Typography>
        </Paper>

        <RoleManagement />
      </Box>
    </AdminLayoutEnhanced>
  );
}
