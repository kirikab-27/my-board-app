'use client';

import React, { Suspense } from 'react';
import { Box, Skeleton, CircularProgress, Typography } from '@mui/material';

// Phase 5: Total Blocking Time削減 - React.lazy 遅延読み込み
const PostList = React.lazy(() => import('@/components/PostList'));
const SortSelector = React.lazy(() => import('@/components/SortSelector'));
const InfiniteScrollContainer = React.lazy(() => import('@/components/InfiniteScrollContainer'));

// ローディングコンポーネント
const PostListSkeleton = () => (
  <Box sx={{ width: '100%' }}>
    {[1, 2, 3].map((i) => (
      <Box key={i} sx={{ mb: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2, mb: 1 }} />
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="40%" height={20} />
      </Box>
    ))}
  </Box>
);

const SortSelectorSkeleton = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Skeleton variant="text" width={60} height={20} />
    <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
  </Box>
);

const InfiniteScrollSkeleton = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
      コンテンツを読み込み中...
    </Typography>
  </Box>
);

// 遅延読み込みコンポーネントのラッパー
export const LazyPostList = (props: any) => (
  <Suspense fallback={<PostListSkeleton />}>
    <PostList {...props} />
  </Suspense>
);

export const LazySortSelector = (props: any) => (
  <Suspense fallback={<SortSelectorSkeleton />}>
    <SortSelector {...props} />
  </Suspense>
);

export const LazyInfiniteScrollContainer = (props: any) => (
  <Suspense fallback={<InfiniteScrollSkeleton />}>
    <InfiniteScrollContainer {...props} />
  </Suspense>
);