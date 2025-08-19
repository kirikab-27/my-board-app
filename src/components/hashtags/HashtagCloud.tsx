'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Cloud,
  Refresh,
  Shuffle,
  ZoomIn,
  ZoomOut,
  Tune,
  TrendingUp
} from '@mui/icons-material';

interface CloudHashtag {
  _id: string;
  name: string;
  displayName: string;
  stats: {
    totalPosts: number;
    trendScore: number;
    uniqueUsers: number;
  };
  isTrending: boolean;
  isOfficial: boolean;
  category: string;
}

interface HashtagCloudProps {
  limit?: number;
  category?: string;
  minSize?: number;
  maxSize?: number;
  colorMode?: 'category' | 'trend' | 'popularity';
  layout?: 'random' | 'circular' | 'spiral';
  interactive?: boolean;
  showControls?: boolean;
  autoRefresh?: number;
  onHashtagClick?: (hashtag: CloudHashtag) => void;
}

export default function HashtagCloud({
  limit = 50,
  category = 'all',
  minSize = 0.8,
  maxSize = 2.5,
  colorMode = 'trend',
  layout = 'random',
  interactive = true,
  showControls = true,
  autoRefresh,
  onHashtagClick
}: HashtagCloudProps) {
  const theme = useTheme();
  const [hashtags, setHashtags] = useState<CloudHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  // ハッシュタグデータ取得
  const fetchHashtags = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        sortBy: 'totalPosts',
        order: 'desc'
      });

      if (category !== 'all') {
        params.append('category', category);
      }

      const response = await fetch(`/api/hashtags?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ハッシュタグの取得に失敗しました');
      }

      setHashtags(data.hashtags || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
      console.error('ハッシュタグ取得エラー:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchHashtags();
  }, [category, limit]);

  // 自動更新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHashtags(true);
    }, autoRefresh * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // ハッシュタグのサイズ計算
  const getHashtagSize = (hashtag: CloudHashtag) => {
    if (hashtags.length === 0) return minSize;
    
    const maxPosts = Math.max(...hashtags.map(h => h.stats.totalPosts));
    const minPosts = Math.min(...hashtags.map(h => h.stats.totalPosts));
    const ratio = maxPosts > minPosts ? (hashtag.stats.totalPosts - minPosts) / (maxPosts - minPosts) : 0;
    
    return minSize + (maxSize - minSize) * ratio;
  };

  // ハッシュタグの色取得
  const getHashtagColor = (hashtag: CloudHashtag) => {
    switch (colorMode) {
      case 'category':
        const categoryColors = {
          technology: theme.palette.primary.main,
          entertainment: theme.palette.secondary.main,
          sports: theme.palette.success.main,
          news: theme.palette.warning.main,
          lifestyle: theme.palette.info.main,
          business: theme.palette.error.main
        };
        return categoryColors[hashtag.category as keyof typeof categoryColors] || theme.palette.text.primary;
      
      case 'trend':
        if (hashtag.stats.trendScore >= 80) return theme.palette.error.main;
        if (hashtag.stats.trendScore >= 60) return theme.palette.warning.main;
        if (hashtag.stats.trendScore >= 40) return theme.palette.info.main;
        return theme.palette.primary.main;
      
      case 'popularity':
        const maxPosts = Math.max(...hashtags.map(h => h.stats.totalPosts));
        const ratio = hashtag.stats.totalPosts / maxPosts;
        return alpha(theme.palette.primary.main, 0.5 + ratio * 0.5);
      
      default:
        return theme.palette.text.primary;
    }
  };

  // ハッシュタグの位置計算
  const getHashtagPosition = useMemo(() => {
    if (hashtags.length === 0) return [];

    return hashtags.map((hashtag, index) => {
      const size = getHashtagSize(hashtag);
      let x, y, rotation = 0;

      switch (layout) {
        case 'circular':
          const angle = (index / hashtags.length) * 2 * Math.PI;
          const radius = 150 + (size - minSize) * 50;
          x = Math.cos(angle) * radius;
          y = Math.sin(angle) * radius;
          break;
        
        case 'spiral':
          const spiralAngle = index * 0.5;
          const spiralRadius = spiralAngle * 5;
          x = Math.cos(spiralAngle) * spiralRadius;
          y = Math.sin(spiralAngle) * spiralRadius;
          break;
        
        default: // random
          x = (Math.random() - 0.5) * 400;
          y = (Math.random() - 0.5) * 300;
          rotation = (Math.random() - 0.5) * 30;
      }

      return { x, y, rotation };
    });
  }, [hashtags, layout, minSize]);

  // ハッシュタグクリック処理
  const handleHashtagClick = (hashtag: CloudHashtag) => {
    setSelectedHashtag(hashtag._id);
    if (onHashtagClick) {
      onHashtagClick(hashtag);
    }
  };

  // コントロール操作
  const handleRefresh = () => fetchHashtags(true);
  const handleShuffle = () => {
    // レイアウトを再計算（ランダム要素の再生成）
    setHashtags([...hashtags].sort(() => Math.random() - 0.5));
  };
  const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.5));

  if (loading && !refreshing) {
    return (
      <Card>
        <CardHeader
          title={<Skeleton width="60%" />}
          subheader={<Skeleton width="40%" />}
        />
        <CardContent>
          <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton variant="rectangular" width="80%" height={200} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={() => fetchHashtags()}>
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
      <CardHeader
        avatar={<Cloud />}
        title="ハッシュタグクラウド"
        subheader={`${hashtags.length}個のハッシュタグ`}
        action={
          showControls && (
            <Box>
              <Tooltip title="更新">
                <IconButton onClick={handleRefresh} disabled={refreshing}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="シャッフル">
                <IconButton onClick={handleShuffle}>
                  <Shuffle />
                </IconButton>
              </Tooltip>
              <Tooltip title="拡大">
                <IconButton onClick={handleZoomIn}>
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="縮小">
                <IconButton onClick={handleZoomOut}>
                  <ZoomOut />
                </IconButton>
              </Tooltip>
            </Box>
          )
        }
      />

      <CardContent>
        {hashtags.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Cloud sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              ハッシュタグが見つかりません
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              height: 500,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: interactive ? 'pointer' : 'default'
            }}
          >
            {/* ハッシュタグクラウド */}
            <Box
              sx={{
                position: 'relative',
                transform: `scale(${zoom})`,
                transition: 'transform 0.3s ease'
              }}
            >
              {hashtags.map((hashtag, index) => {
                const position = getHashtagPosition[index] || { x: 0, y: 0, rotation: 0 };
                const size = getHashtagSize(hashtag);
                const color = getHashtagColor(hashtag);
                const isSelected = selectedHashtag === hashtag._id;

                return (
                  <Box
                    key={hashtag._id}
                    onClick={() => interactive && handleHashtagClick(hashtag)}
                    sx={{
                      position: 'absolute',
                      left: `calc(50% + ${position.x}px)`,
                      top: `calc(50% + ${position.y}px)`,
                      transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
                      fontSize: `${size}rem`,
                      fontWeight: size > 1.5 ? 'bold' : 'normal',
                      color: color,
                      cursor: interactive ? 'pointer' : 'default',
                      transition: 'all 0.3s ease',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      opacity: isSelected ? 1 : 0.8,
                      textShadow: isSelected ? `0 0 10px ${color}` : 'none',
                      '&:hover': interactive ? {
                        transform: `translate(-50%, -50%) rotate(${position.rotation}deg) scale(1.1)`,
                        opacity: 1,
                        textShadow: `0 0 10px ${color}`,
                        zIndex: 10
                      } : {}
                    }}
                  >
                    #{hashtag.displayName}
                    {hashtag.isTrending && (
                      <TrendingUp 
                        sx={{ 
                          fontSize: '0.8em',
                          ml: 0.5,
                          verticalAlign: 'super'
                        }} 
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* 選択されたハッシュタグの詳細 */}
        {selectedHashtag && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {(() => {
              const hashtag = hashtags.find(h => h._id === selectedHashtag);
              if (!hashtag) return null;
              
              return (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    #{hashtag.displayName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={hashtag.category} size="small" />
                    <Chip 
                      label={`${hashtag.stats.totalPosts}件の投稿`}
                      size="small"
                      color="primary"
                    />
                    <Chip 
                      label={`${hashtag.stats.uniqueUsers}人のユーザー`}
                      size="small"
                      color="secondary"
                    />
                    {hashtag.isTrending && (
                      <Chip 
                        label={`トレンドスコア: ${hashtag.stats.trendScore}`}
                        size="small"
                        color="error"
                        icon={<TrendingUp />}
                      />
                    )}
                  </Box>
                </Box>
              );
            })()}
          </Box>
        )}

        {/* 凡例 */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            💡 {interactive ? 'クリックして詳細を表示 • ' : ''}サイズ: 投稿数 • 色: {
              colorMode === 'category' ? 'カテゴリ' :
              colorMode === 'trend' ? 'トレンドスコア' : '人気度'
            }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}