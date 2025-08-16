'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Skeleton,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import { People, PersonAdd, Favorite } from '@mui/icons-material';

interface FollowStatsProps {
  userId: string;
  showRelationship?: boolean;
  compact?: boolean;
}

interface FollowStats {
  followerCount: number;
  followingCount: number;
  mutualFollowsCount: number;
  relationship?: {
    isFollowing: boolean;
    isPending: boolean;
    isMutual: boolean;
    followedAt: string | null;
  } | null;
}

export default function FollowStats({ 
  userId, 
  showRelationship = true,
  compact = false 
}: FollowStatsProps) {
  const [stats, setStats] = useState<FollowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // フォロー統計を取得
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/follow/stats?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('フォロー統計の取得に失敗しました');
      }
    } catch (error) {
      console.error('フォロー統計取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  // ローディング表示
  if (loading) {
    return (
      <Paper 
        elevation={compact ? 0 : 1} 
        sx={{ 
          p: compact ? 1 : 2,
          backgroundColor: compact ? 'transparent' : 'background.paper'
        }}
      >
        <Grid container spacing={compact ? 1 : 2}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={4} key={index}>
              <Box textAlign="center">
                <Skeleton variant="text" width={40} height={24} sx={{ mx: 'auto' }} />
                <Skeleton variant="text" width={60} height={20} sx={{ mx: 'auto', mt: 0.5 }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  if (!stats) {
    return null;
  }

  // 数値フォーマット関数
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // 統計項目の設定
  const statItems = [
    {
      label: 'フォロワー',
      value: formatCount(stats.followerCount),
      icon: <People fontSize="small" />,
      color: 'primary'
    },
    {
      label: 'フォロー中',
      value: formatCount(stats.followingCount),
      icon: <PersonAdd fontSize="small" />,
      color: 'secondary'
    },
    {
      label: '相互',
      value: formatCount(stats.mutualFollowsCount),
      icon: <Favorite fontSize="small" />,
      color: 'error'
    }
  ];

  return (
    <Paper 
      elevation={compact ? 0 : 1} 
      sx={{ 
        p: compact ? 1 : 2,
        backgroundColor: compact ? 'transparent' : 'background.paper'
      }}
    >
      {/* 基本統計 */}
      <Grid container spacing={compact ? 1 : 2}>
        {statItems.map((item, index) => (
          <Grid item xs={4} key={index}>
            <Box 
              textAlign="center"
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                },
                p: 0.5,
                transition: 'background-color 0.2s'
              }}
            >
              <Typography 
                variant={compact ? "h6" : "h5"} 
                component="div" 
                color={`${item.color}.main`}
                fontWeight="bold"
              >
                {item.value}
              </Typography>
              <Typography 
                variant={compact ? "caption" : "body2"} 
                color="text.secondary"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 0.5,
                  mt: 0.5
                }}
              >
                {!isMobile && item.icon}
                {item.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* 関係性情報 */}
      {showRelationship && stats.relationship && !compact && (
        <Box mt={2} pt={2} borderTop={1} borderColor="divider">
          <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
            {stats.relationship.isFollowing && (
              <Chip 
                label="フォロー中" 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
            {stats.relationship.isPending && (
              <Chip 
                label="承認待ち" 
                size="small" 
                color="warning" 
                variant="outlined"
              />
            )}
            {stats.relationship.isMutual && (
              <Chip 
                label="相互フォロー" 
                size="small" 
                color="success" 
                variant="filled"
                icon={<Favorite fontSize="small" />}
              />
            )}
          </Box>
          
          {stats.relationship.followedAt && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              textAlign="center" 
              display="block"
              mt={1}
            >
              {new Date(stats.relationship.followedAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })} からフォロー
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}