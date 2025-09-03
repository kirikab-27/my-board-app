'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp,
  TrendingDown,
  People,
  Article,
  ThumbUp,
  Comment,
  Download,
} from '@mui/icons-material';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { AdminDashboardStats } from '@/types/admin';

/**
 * 管理者分析・統計ページ
 * Issue #46 Phase 2: 分析機能・レポート実装
 */
export default function AdminAnalyticsPage() {
  const { session, isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin', 'moderator', 'audit']
  });

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ダミー統計データ（Phase 2実装用）
  useEffect(() => {
    if (!hasAccess) return;

    setLoading(true);
    
    // Phase 2: ダミーデータで UI 確認
    setTimeout(() => {
      const dummyStats: AdminDashboardStats = {
        users: {
          total: 1247,
          active: 892,
          newToday: 23,
          suspended: 5
        },
        posts: {
          total: 8945,
          todayCount: 156,
          reported: 12,
          deleted: 34
        },
        engagement: {
          totalLikes: 45678,
          totalComments: 12890,
          activeUsers24h: 456
        },
        moderation: {
          pendingReports: 8,
          resolvedToday: 15,
          autoModerated: 67
        }
      };
      
      setStats(dummyStats);
      setLoading(false);
    }, 800);
  }, [hasAccess]);

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon, 
    color = 'primary' 
  }: { 
    title: string; 
    value: number; 
    change?: number; 
    icon: React.ReactNode; 
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>
              {value.toLocaleString()}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {change >= 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography 
                  variant="body2" 
                  color={change >= 0 ? 'success.main' : 'error.main'}
                >
                  {change >= 0 ? '+' : ''}{change}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (isLoading || !hasAccess) {
    return (
      <AdminLayout title="分析・統計">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout title="分析・統計">
        <Alert severity="error">統計データの取得に失敗しました</Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="分析・統計">
      <Container maxWidth="lg">
        {/* ヘッダー */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon color="primary" />
            分析・統計ダッシュボード
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Download />}>
              レポートエクスポート
            </Button>
            <Button variant="outlined">
              期間指定
            </Button>
          </Box>
        </Box>

        {/* 統計カード */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="総ユーザー数"
              value={stats.users.total}
              change={12}
              icon={<People fontSize="large" />}
              color="primary"
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="アクティブユーザー"
              value={stats.users.active}
              change={8}
              icon={<People fontSize="large" />}
              color="success"
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="総投稿数"
              value={stats.posts.total}
              change={5}
              icon={<Article fontSize="large" />}
              color="secondary"
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="今日の投稿"
              value={stats.posts.todayCount}
              change={-3}
              icon={<Article fontSize="large" />}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* エンゲージメント統計 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            エンゲージメント統計
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                title="総いいね数"
                value={stats.engagement.totalLikes}
                icon={<ThumbUp fontSize="large" />}
                color="primary"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                title="総コメント数"
                value={stats.engagement.totalComments}
                icon={<Comment fontSize="large" />}
                color="secondary"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                title="24時間アクティブ"
                value={stats.engagement.activeUsers24h}
                icon={<People fontSize="large" />}
                color="success"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* モデレーション統計 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            モデレーション状況
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                title="未処理報告"
                value={stats.moderation.pendingReports}
                icon={<Article fontSize="large" />}
                color="error"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                title="今日の処理済み"
                value={stats.moderation.resolvedToday}
                icon={<Article fontSize="large" />}
                color="success"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                title="自動処理"
                value={stats.moderation.autoModerated}
                icon={<Article fontSize="large" />}
                color="warning"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* 開発ステータス */}
        <Alert severity="info" sx={{ mt: 3 }}>
          🚧 Phase 2実装中: 統計UI完成・リアルタイムデータ取得・チャート機能は次のPhase予定
        </Alert>
      </Container>
    </AdminLayout>
  );
}