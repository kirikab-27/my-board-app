'use client';

import React, { Suspense } from 'react';
import { Box, Skeleton, CircularProgress, Typography } from '@mui/material';

// Phase 5: Total Blocking Time削減 - タイムライン用React.lazy遅延読み込み
const FollowButton = React.lazy(() => import('@/components/follow/FollowButton'));
const SortSelector = React.lazy(() => import('@/components/SortSelector'));
const InfiniteScrollContainer = React.lazy(() => import('@/components/InfiniteScrollContainer'));
const OptimizedImage = React.lazy(() => import('@/components/ui/OptimizedImage'));

// ローディングコンポーネント
const FollowButtonSkeleton = () => (
  <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
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
      タイムラインを読み込み中...
    </Typography>
  </Box>
);

const OptimizedImageSkeleton = () => (
  <Skeleton 
    variant="rectangular" 
    width="100%" 
    height={200} 
    sx={{ borderRadius: 1 }} 
  />
);

// 遅延読み込みコンポーネントのラッパー
export const LazyFollowButton = (props: any) => (
  <Suspense fallback={<FollowButtonSkeleton />}>
    <FollowButton {...props} />
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

export const LazyOptimizedImage = (props: any) => (
  <Suspense fallback={<OptimizedImageSkeleton />}>
    <OptimizedImage {...props} />
  </Suspense>
);