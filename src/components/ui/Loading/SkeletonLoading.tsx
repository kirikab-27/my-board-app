'use client';

import React from 'react';
import {
  Box,
  Container,
  Paper,
  Skeleton,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import type { SkeletonLoadingProps } from '@/types/loading';

/**
 * 基本スケルトンコンポーネント
 */
export const SkeletonBase: React.FC<SkeletonLoadingProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = 40,
  lines = 1,
  animation = 'pulse',
  sx,
}) => {
  if (variant === 'text' && lines > 1) {
    return (
      <Box sx={sx}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={index === lines - 1 ? '70%' : width}
            height={height}
            animation={animation}
            sx={{ mb: index < lines - 1 ? 1 : 0 }}
          />
        ))}
      </Box>
    );
  }

  return <Skeleton variant={variant} width={width} height={height} animation={animation} sx={sx} />;
};

/**
 * 認証ページ用スケルトン
 */
export const AuthPageSkeleton: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        {/* タイトル */}
        <Skeleton variant="text" width="60%" height={48} sx={{ mb: 3, mx: 'auto' }} />

        {/* フォームフィールド */}
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        </Box>

        {/* ボタン */}
        <Skeleton variant="rectangular" height={48} sx={{ mb: 2 }} />

        {/* 区切り線 */}
        <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
          <Skeleton variant="rectangular" height={1} sx={{ flex: 1 }} />
          <Skeleton variant="text" width={60} height={24} sx={{ mx: 2 }} />
          <Skeleton variant="rectangular" height={1} sx={{ flex: 1 }} />
        </Box>

        {/* ソーシャルログインボタン */}
        <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={48} />
      </Paper>
    </Container>
  );
};

/**
 * ダッシュボード用スケルトン
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <Box>
      {/* ヘッダー */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Skeleton variant="text" width={150} height={32} />
          <Box sx={{ flexGrow: 1 }} />
          <Skeleton variant="circular" width={40} height={40} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {/* ウェルカムメッセージ */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="80%" height={20} />
        </Paper>

        {/* クイックアクション */}
        <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[1, 2].map((item) => (
            <Grid item xs={12} sm={6} key={item}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                    <Skeleton variant="text" width="40%" height={24} />
                  </Box>
                  <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={36} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 追加情報 */}
        <Skeleton variant="text" width="25%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="70%" height={20} />
      </Container>
    </Box>
  );
};

/**
 * 掲示板用スケルトン
 */
export const BoardSkeleton: React.FC = () => {
  return (
    <Box>
      {/* ヘッダー */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Skeleton variant="text" width={120} height={24} sx={{ color: 'primary.contrastText' }} />
          <Box sx={{ flexGrow: 1 }} />
          <Skeleton variant="circular" width={32} height={32} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* 投稿フォーム */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton variant="text" width={80} height={20} />
            <Skeleton variant="rectangular" width={80} height={36} />
          </Box>
        </Paper>

        {/* 検索バー */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" height={40} sx={{ flex: 1 }} />
            <Skeleton variant="rectangular" width={80} height={40} />
            <Skeleton variant="rectangular" width={60} height={40} />
          </Box>
        </Paper>

        {/* ヘッダーセクション */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width={120} height={32} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={120} height={32} />
            <Skeleton variant="rectangular" width={100} height={32} />
          </Box>
        </Box>

        {/* 投稿リスト */}
        {Array.from({ length: 5 }).map((_, index) => (
          <Paper key={index} sx={{ p: 3, mb: 2 }}>
            {/* ユーザー情報 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box>
                <Skeleton variant="text" width={100} height={20} />
                <Skeleton variant="text" width={150} height={16} />
              </Box>
            </Box>

            {/* 投稿内容 */}
            <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />

            {/* アクションボタン */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="rectangular" width={60} height={28} />
              <Skeleton variant="rectangular" width={60} height={28} />
              <Box sx={{ flexGrow: 1 }} />
              <Skeleton variant="text" width={80} height={16} />
            </Box>
          </Paper>
        ))}

        {/* ページネーション */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Skeleton variant="rectangular" width={300} height={40} />
        </Box>
      </Container>
    </Box>
  );
};

/**
 * プロフィール用スケルトン
 */
export const ProfileSkeleton: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* プロフィールヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Skeleton variant="circular" width={100} height={100} sx={{ mr: 3 }} />
          <Box>
            <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={250} height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={180} height={20} />
          </Box>
        </Box>

        {/* プロフィール情報 */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 3 }} />

            <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 3 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Skeleton variant="text" width="35%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 3 }} />

            <Skeleton variant="text" width="25%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 3 }} />
          </Grid>
        </Grid>

        {/* 保存ボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Skeleton variant="rectangular" width={120} height={40} />
        </Box>
      </Paper>
    </Container>
  );
};

/**
 * リスト項目用スケルトン
 */
export const ListItemSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="80%" height={16} />
          </Box>
          <Skeleton variant="rectangular" width={60} height={24} />
        </Box>
      ))}
    </Box>
  );
};
