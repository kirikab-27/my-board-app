'use client';

import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';
import dynamic from 'next/dynamic';

const PostManagementGrid = dynamic(() => import('@/components/admin/posts/PostManagementGrid'), {
  ssr: false,
  loading: () => <CircularProgress />,
});

/**
 * 管理者投稿管理ページ
 * Issue #59: 投稿管理システム（AI自動モデレーション）
 */
export default function AdminPostsPage() {
  const { isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin', 'moderator'],
  });

  if (isLoading || !hasAccess) {
    return (
      <AdminLayoutEnhanced title="投稿管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  return (
    <AdminLayoutEnhanced title="投稿管理">
      <Box sx={{ p: 3 }}>
        {/* ヘッダー */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
        >
          <ArticleIcon color="primary" />
          投稿管理・AIモデレーション
        </Typography>

        {/* PostManagementGridコンポーネント */}
        <PostManagementGrid />

        {/* 実装ステータス */}
        <Alert severity="success" sx={{ mt: 3 }}>
          ✅ Issue #59 Phase 1実装完了: 投稿管理基本機能・DataGrid統合・一括操作機能
        </Alert>
      </Box>
    </AdminLayoutEnhanced>
  );
}
