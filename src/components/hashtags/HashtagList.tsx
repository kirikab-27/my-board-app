'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  TrendingUp,
  TrendingFlat,
  TrendingDown,
  Tag as TagIcon,
  Verified,
  MoreVert,
  Favorite,
  Visibility,
  Share,
  Info
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface HashtagStats {
  totalPosts: number;
  totalComments: number;
  uniqueUsers: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  trendScore: number;
  lastUsed?: Date;
}

interface HashtagItem {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  stats: HashtagStats;
  isTrending: boolean;
  isOfficial: boolean;
  createdAt: Date;
  relatedTags?: Array<{
    tagName: string;
    correlation: number;
  }>;
}

interface HashtagListProps {
  hashtags: HashtagItem[];
  loading?: boolean;
  variant?: 'card' | 'list' | 'compact';
  showStats?: boolean;
  showDescription?: boolean;
  showRelated?: boolean;
  showActions?: boolean;
  onHashtagClick?: (hashtag: HashtagItem) => void;
  onFollowToggle?: (hashtag: HashtagItem, isFollowing: boolean) => void;
}

export default function HashtagList({
  hashtags,
  loading = false,
  variant = 'card',
  showStats = true,
  showDescription = true,
  showRelated = false,
  showActions = true,
  onHashtagClick,
  onFollowToggle
}: HashtagListProps) {
  const [menuAnchor, setMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});

  // トレンドアイコン取得
  const getTrendIcon = (growth: number) => {
    if (growth > 10) return <TrendingUp color="success" />;
    if (growth < -10) return <TrendingDown color="error" />;
    return <TrendingFlat color="disabled" />;
  };

  // トレンドスコアの色取得
  const getTrendColor = (score: number) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'info';
    return 'primary';
  };

  // カテゴリ色取得
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' } = {
      technology: 'primary',
      entertainment: 'secondary',
      sports: 'success',
      news: 'warning',
      lifestyle: 'info',
      business: 'error'
    };
    return colors[category] || 'default';
  };

  // メニュー開閉
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, hashtagId: string) => {
    setMenuAnchor({ ...menuAnchor, [hashtagId]: event.currentTarget });
  };

  const handleMenuClose = (hashtagId: string) => {
    setMenuAnchor({ ...menuAnchor, [hashtagId]: null });
  };

  // フォロー状態切り替え
  const handleFollowToggle = (hashtag: HashtagItem) => {
    const isCurrentlyFollowing = followingStates[hashtag._id] || false;
    const newFollowingState = !isCurrentlyFollowing;
    
    setFollowingStates({
      ...followingStates,
      [hashtag._id]: newFollowingState
    });

    if (onFollowToggle) {
      onFollowToggle(hashtag, newFollowingState);
    }
  };

  // ハッシュタグクリック処理
  const handleHashtagClick = (hashtag: HashtagItem) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          ハッシュタグを読み込み中...
        </Typography>
      </Box>
    );
  }

  if (hashtags.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <TagIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          ハッシュタグが見つかりません
        </Typography>
        <Typography variant="body2" color="text.secondary">
          別のキーワードで検索してみてください
        </Typography>
      </Box>
    );
  }

  // カード形式表示
  if (variant === 'card') {
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {hashtags.map((hashtag) => (
          <Box key={hashtag._id} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onClick={() => handleHashtagClick(hashtag)}
            >
              <CardContent>
                {/* ヘッダー */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TagIcon color="primary" />
                    <Typography variant="h6" component="h3">
                      #{hashtag.displayName}
                    </Typography>
                    {hashtag.isOfficial && <Verified fontSize="small" color="primary" />}
                  </Box>
                  
                  {showActions && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, hashtag._id);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                </Box>

                {/* カテゴリとトレンド */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip 
                    label={hashtag.category} 
                    size="small" 
                    color={getCategoryColor(hashtag.category)}
                  />
                  {hashtag.isTrending && (
                    <Chip 
                      label={`トレンド ${hashtag.stats.trendScore}`}
                      size="small"
                      color={getTrendColor(hashtag.stats.trendScore)}
                      icon={<TrendingUp />}
                    />
                  )}
                </Box>

                {/* 説明 */}
                {showDescription && hashtag.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {hashtag.description}
                  </Typography>
                )}

                {/* 統計情報 */}
                {showStats && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Tooltip title="投稿数">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TagIcon fontSize="small" color="action" />
                        <Typography variant="caption">
                          {hashtag.stats.totalPosts.toLocaleString()}
                        </Typography>
                      </Box>
                    </Tooltip>
                    
                    <Tooltip title="ユーザー数">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Visibility fontSize="small" color="action" />
                        <Typography variant="caption">
                          {hashtag.stats.uniqueUsers.toLocaleString()}
                        </Typography>
                      </Box>
                    </Tooltip>
                    
                    <Tooltip title="週間成長率">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getTrendIcon(hashtag.stats.weeklyGrowth)}
                        <Typography variant="caption">
                          {hashtag.stats.weeklyGrowth > 0 ? '+' : ''}{hashtag.stats.weeklyGrowth.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                )}

                {/* 関連タグ */}
                {showRelated && hashtag.relatedTags && hashtag.relatedTags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      関連タグ:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {hashtag.relatedTags.slice(0, 3).map((related, index) => (
                        <Chip 
                          key={index}
                          label={`#${related.tagName}`}
                          size="small"
                          variant="outlined"
                          clickable
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* 最終更新 */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {hashtag.stats.lastUsed 
                    ? `最終使用: ${formatDistanceToNow(new Date(hashtag.stats.lastUsed), { addSuffix: true, locale: ja })}`
                    : `作成: ${formatDistanceToNow(hashtag.createdAt, { addSuffix: true, locale: ja })}`
                  }
                </Typography>
              </CardContent>

              {/* メニュー */}
              <Menu
                anchorEl={menuAnchor[hashtag._id]}
                open={Boolean(menuAnchor[hashtag._id])}
                onClose={() => handleMenuClose(hashtag._id)}
              >
                <MenuItem onClick={() => handleFollowToggle(hashtag)}>
                  <Favorite sx={{ mr: 1 }} />
                  {followingStates[hashtag._id] ? 'フォロー解除' : 'フォローする'}
                </MenuItem>
                <MenuItem>
                  <Share sx={{ mr: 1 }} />
                  共有
                </MenuItem>
                <MenuItem>
                  <Info sx={{ mr: 1 }} />
                  詳細を見る
                </MenuItem>
              </Menu>
            </Card>
          </Box>
        ))}
      </Box>
    );
  }

  // リスト形式表示
  return (
    <List>
      {hashtags.map((hashtag, index) => (
        <React.Fragment key={hashtag._id}>
          <ListItem
            alignItems="flex-start"
            sx={{ cursor: 'pointer' }}
            onClick={() => handleHashtagClick(hashtag)}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <TagIcon />
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Typography variant="subtitle1" component="span">
                    #{hashtag.displayName}
                  </Typography>
                  {hashtag.isOfficial && <Verified fontSize="small" color="primary" />}
                  {hashtag.isTrending && (
                    <Typography variant="caption" component="span" sx={{ 
                      fontSize: '0.75rem',
                      backgroundColor: 'error.main',
                      color: 'error.contrastText',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <TrendingUp fontSize="small" />
                      トレンド
                    </Typography>
                  )}
                </span>
              }
              secondary={
                <span>
                  {showDescription && hashtag.description && (
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mb: 0.5 }}>
                      {hashtag.description}
                    </Typography>
                  )}
                  
                  {showStats && (
                    <span style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      <Typography variant="caption" color="text.secondary" component="span">
                        投稿: {hashtag.stats.totalPosts.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="span">
                        ユーザー: {hashtag.stats.uniqueUsers.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="span">
                        成長率: {hashtag.stats.weeklyGrowth > 0 ? '+' : ''}{hashtag.stats.weeklyGrowth.toFixed(1)}%
                      </Typography>
                    </span>
                  )}
                </span>
              }
            />
            
            {showActions && (
              <ListItemSecondaryAction>
                <IconButton onClick={(e) => handleMenuClick(e, hashtag._id)}>
                  <MoreVert />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </ListItem>
          
          {index < hashtags.length - 1 && <Divider variant="inset" component="li" />}
          
          {/* メニュー */}
          <Menu
            anchorEl={menuAnchor[hashtag._id]}
            open={Boolean(menuAnchor[hashtag._id])}
            onClose={() => handleMenuClose(hashtag._id)}
          >
            <MenuItem onClick={() => handleFollowToggle(hashtag)}>
              <Favorite sx={{ mr: 1 }} />
              {followingStates[hashtag._id] ? 'フォロー解除' : 'フォローする'}
            </MenuItem>
            <MenuItem>
              <Share sx={{ mr: 1 }} />
              共有
            </MenuItem>
            <MenuItem>
              <Info sx={{ mr: 1 }} />
              詳細を見る
            </MenuItem>
          </Menu>
        </React.Fragment>
      ))}
    </List>
  );
}