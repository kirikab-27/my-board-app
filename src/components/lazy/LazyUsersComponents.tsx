'use client';

import React, { Suspense } from 'react';
import { Box, Skeleton, CircularProgress, Typography, Card, CardContent } from '@mui/material';

// Phase 5: Total Blocking Time削減 - ユーザー一覧用React.lazy遅延読み込み
const FollowButton = React.lazy(() => import('@/components/follow/FollowButton'));
const ProfileAvatar = React.lazy(() => import('@/components/profile/ProfileAvatar'));

// ローディングコンポーネント
const FollowButtonSkeleton = () => (
  <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
);

const ProfileAvatarSkeleton = () => (
  <Skeleton variant="circular" width={56} height={56} />
);

const UserCardSkeleton = () => (
  <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 1 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ProfileAvatarSkeleton />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="80%" height={20} />
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Skeleton variant="text" width={60} height={16} />
            <Skeleton variant="text" width={60} height={16} />
          </Box>
        </Box>
        <FollowButtonSkeleton />
      </Box>
    </CardContent>
  </Card>
);

const UserListSkeleton = () => (
  <Box>
    {[1, 2, 3, 4, 5].map((i) => (
      <UserCardSkeleton key={i} />
    ))}
  </Box>
);

// 遅延読み込みコンポーネントのラッパー
export const LazyFollowButton = (props: any) => (
  <Suspense fallback={<FollowButtonSkeleton />}>
    <FollowButton {...props} />
  </Suspense>
);

export const LazyProfileAvatar = (props: any) => (
  <Suspense fallback={<ProfileAvatarSkeleton />}>
    <ProfileAvatar {...props} />
  </Suspense>
);

export { UserListSkeleton };