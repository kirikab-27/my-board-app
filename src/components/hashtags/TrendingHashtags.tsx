'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Button,
  Skeleton,
  Alert,
  Tooltip,
  LinearProgress,
  Tab,
  Tabs,
  Collapse
} from '@mui/material';
import {
  TrendingUp,
  Whatshot,
  Tag as TagIcon,
  Verified,
  Refresh,
  ExpandMore,
  ExpandLess,
  AccessTime,
  Visibility
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TrendingHashtag {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  stats: {
    totalPosts: number;
    totalComments: number;
    uniqueUsers: number;
    weeklyGrowth: number;
    trendScore: number;
    lastUsed?: Date;
  };
  isTrending: boolean;
  isOfficial: boolean;
  createdAt: Date;
}

interface CategoryStats {
  _id: string;
  count: number;
  totalPosts: number;
  avgTrendScore: number;
  topHashtag: {
    name: string;
    displayName: string;
    trendScore: number;
  };
}

interface TrendStats {
  totalTrending: number;
  averageScore: number;
  categoryBreakdown: CategoryStats[];
  timeframe: string;
  lastUpdated: Date;
}

interface TrendingHashtagsProps {
  limit?: number;
  category?: string;
  timeframe?: '24h' | '7d' | '30d';
  showStats?: boolean;
  showCategories?: boolean;
  showRefresh?: boolean;
  variant?: 'card' | 'list' | 'minimal';
  autoRefresh?: number; // 自動更新間隔（秒）
  onHashtagClick?: (hashtag: TrendingHashtag) => void;
}

export default function TrendingHashtags({
  limit = 10,
  category = 'all',
  timeframe = '24h',
  showStats = true,
  showCategories = false,
  showRefresh = true,
  autoRefresh,
  onHashtagClick
}: TrendingHashtagsProps) {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [stats, setStats] = useState<TrendStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // トレンドハッシュタグ取得
  const fetchTrendingHashtags = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        timeframe: selectedTimeframe,
        category: category !== 'all' ? category : ''
      });

      const response = await fetch(`/api/hashtags/trending?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'トレンドハッシュタグの取得に失敗しました');
      }

      setHashtags(data.trendingHashtags || []);
      setStats(data.stats || null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
      console.error('トレンドハッシュタグ取得エラー:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchTrendingHashtags();
  }, [category, selectedTimeframe, limit]);

  // 自動更新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTrendingHashtags(true);
    }, autoRefresh * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // 手動更新
  const handleRefresh = () => {
    fetchTrendingHashtags(true);
  };

  // 期間変更
  const handleTimeframeChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTimeframe(newValue as '24h' | '7d' | '30d');
  };

  // ハッシュタグクリック
  const handleHashtagClick = (hashtag: TrendingHashtag) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag);
    }
  };

  // トレンドスコアの色取得
  const getTrendScoreColor = (score: number) => {
    if (score >= 90) return 'error';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'info';
    return 'primary';
  };

  // 期間ラベル取得
  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case '24h': return '24時間';
      case '7d': return '7日間';
      case '30d': return '30日間';
      default: return tf;
    }
  };

  if (loading && !refreshing) {
    return (
      <Card>
        <CardHeader
          avatar={<Skeleton variant="circular" width={40} height={40} />}
          title={<Skeleton width="60%" />}
          subheader={<Skeleton width="40%" />}
        />
        <CardContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton width="80%" />
                <Skeleton width="60%" />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={() => fetchTrendingHashtags()}>
            再試行
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Card>
      {/* ヘッダー */}
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'error.main' }}>
            <Whatshot />
          </Avatar>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">トレンドハッシュタグ</Typography>
            {refreshing && <LinearProgress sx={{ width: 100 }} />}
          </Box>
        }
        subheader={`${getTimeframeLabel(selectedTimeframe)}のトレンド`}
        action={
          showRefresh && (
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh />
            </IconButton>
          )
        }
      />

      {/* 期間選択タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs
          value={selectedTimeframe}
          onChange={handleTimeframeChange}
        >
          <Tab label="24時間" value="24h" />
          <Tab label="7日間" value="7d" />
          <Tab label="30日間" value="30d" />
        </Tabs>
      </Box>

      <CardContent>
        {/* 統計情報 */}
        {showStats && stats && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              📊 トレンド統計
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`${stats.totalTrending}個のトレンド`}
                size="small"
                icon={<TrendingUp />}
              />
              <Chip 
                label={`平均スコア: ${stats.averageScore.toFixed(1)}`}
                size="small"
                color="primary"
              />
              <Chip 
                label={`更新: ${formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true, locale: ja })}`}
                size="small"
                icon={<AccessTime />}
              />
            </Box>
          </Box>
        )}

        {/* トレンドハッシュタグリスト */}
        {hashtags.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Whatshot sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              トレンドハッシュタグがありません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getTimeframeLabel(selectedTimeframe)}の期間でトレンド中のハッシュタグが見つかりませんでした
            </Typography>
          </Box>
        ) : (
          <List>
            {hashtags.slice(0, expanded ? hashtags.length : 5).map((hashtag, index) => (
              <ListItem
                key={hashtag._id}
                sx={{ 
                  cursor: 'pointer',
                  borderRadius: 1, 
                  mb: 1, 
                  '&:hover': { 
                    bgcolor: 'action.hover' 
                  } 
                }}
                onClick={() => handleHashtagClick(hashtag)}
              >
                <ListItemIcon>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: getTrendScoreColor(hashtag.stats.trendScore) + '.main',
                        fontSize: '0.75rem'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    {index < 3 && (
                      <Whatshot 
                        sx={{ 
                          position: 'absolute', 
                          top: -2, 
                          right: -2, 
                          fontSize: 16,
                          color: 'error.main'
                        }} 
                      />
                    )}
                  </Box>
                </ListItemIcon>

                <ListItemText
                  primary={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Typography variant="subtitle2" fontWeight="bold" component="span">
                        #{hashtag.displayName}
                      </Typography>
                      {hashtag.isOfficial && (
                        <Verified fontSize="small" color="primary" />
                      )}
                      <Chip 
                        label={hashtag.stats.trendScore.toFixed(0)}
                        size="small"
                        color={getTrendScoreColor(hashtag.stats.trendScore)}
                        sx={{ minWidth: 45 }}
                      />
                    </span>
                  }
                  secondary={
                    <span>
                      {hashtag.description && (
                        <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          {hashtag.description}
                        </Typography>
                      )}
                      <span style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                        <Tooltip title="投稿数">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TagIcon sx={{ fontSize: 12 }} />
                            <Typography variant="caption" component="span">
                              {hashtag.stats.totalPosts.toLocaleString()}
                            </Typography>
                          </span>
                        </Tooltip>
                        
                        <Tooltip title="ユーザー数">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Visibility sx={{ fontSize: 12 }} />
                            <Typography variant="caption" component="span">
                              {hashtag.stats.uniqueUsers.toLocaleString()}
                            </Typography>
                          </span>
                        </Tooltip>
                        
                        <Tooltip title="成長率">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp sx={{ fontSize: 12 }} />
                            <Typography variant="caption" component="span">
                              +{hashtag.stats.weeklyGrowth.toFixed(1)}%
                            </Typography>
                          </span>
                        </Tooltip>
                      </span>
                    </span>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* 展開/折りたたみボタン */}
        {hashtags.length > 5 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setExpanded(!expanded)}
              size="small"
            >
              {expanded ? '少なく表示' : `さらに${hashtags.length - 5}個表示`}
            </Button>
          </Box>
        )}

        {/* カテゴリ別統計 */}
        {showCategories && stats?.categoryBreakdown && (
          <Collapse in={expanded}>
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                📈 カテゴリ別トレンド
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {stats.categoryBreakdown.slice(0, 5).map((cat) => (
                  <Chip
                    key={cat._id}
                    label={`${cat._id}: ${cat.count}個`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
}