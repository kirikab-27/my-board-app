'use client';

import React, { Suspense } from 'react';
import { Box, Skeleton, CircularProgress, Typography } from '@mui/material';

// Phase 5: Total Blocking Time削減 - Chart.js遅延読み込み（71.4KB削減）
const MonitoringDashboard = React.lazy(() => 
  import('@/app/monitoring/dashboard/page').then(module => ({ default: module.default }))
);

// Chart.js用のスケルトンローダー
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <Box sx={{ width: '100%', height }}>
    <Skeleton 
      variant="rectangular" 
      width="100%" 
      height={height} 
      sx={{ borderRadius: 2, mb: 2 }} 
    />
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
      <CircularProgress size={24} />
      <Typography variant="body2" color="text.secondary">
        チャートを読み込み中...
      </Typography>
    </Box>
  </Box>
);

const DashboardSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      <Skeleton width={200} />
    </Typography>
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <ChartSkeleton height={250} />
      <ChartSkeleton height={250} />
      <ChartSkeleton height={200} />
      <ChartSkeleton height={200} />
    </Box>
  </Box>
);

// 遅延読み込みコンポーネントのラッパー
export const LazyMonitoringDashboard = (props: any) => (
  <Suspense fallback={<DashboardSkeleton />}>
    <MonitoringDashboard {...props} />
  </Suspense>
);

export { ChartSkeleton };