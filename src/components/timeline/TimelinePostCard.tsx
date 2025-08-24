'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Chip,
  Divider,
  Menu,
  MenuItem,
  CardMedia,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import {
  FavoriteOutlined,
  Favorite,
  ChatBubbleOutline,
  Share,
  MoreVert,
  Verified,
  PersonAdd,
  PersonRemove,
  Report,
  Link as LinkIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import { TimelinePost } from '@/hooks/useTimeline';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface TimelinePostCardProps {
  post: TimelinePost;
  onLike?: (postId: string, liked: boolean) => Promise<void>;
  onFollow?: (userId: string, following: boolean) => Promise<void>;
  onShare?: (post: TimelinePost) => void;
  onReport?: (post: TimelinePost) => void;
  showFollowButton?: boolean;
  compact?: boolean;
  showActions?: boolean;
}

export default function TimelinePostCard({
  post,
  onLike,
  onFollow,
  onShare,
  onReport,
  showFollowButton = true,
  compact = false,
  showActions = true
}: TimelinePostCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 状態管理
  const [liked, setLiked] = useState(false); // TODO: 実際のいいね状態を取得
  const [likeCount, setLikeCount] = useState(post.likes);
  const [following, setFollowing] = useState(post.isFollowing);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnPost = session?.user?.id === post.userId;

  // 相対時間フォーマット
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ja });
      } else {
        return format(date, 'M月d日 HH:mm', { locale: ja });
      }
    } catch {
      return '時刻不明';
    }
  };

  // いいね処理
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!session?.user || actionLoading) return;
    
    setActionLoading(true);
    
    try {
      const newLikedState = !liked;
      setLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
      
      if (onLike) {
        await onLike(post._id, newLikedState);
      }
    } catch (error) {
      // エラー時は元に戻す
      setLiked(!liked);
      setLikeCount(post.likes);
      console.error('いいねエラー:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // フォロー処理
  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!session?.user || actionLoading || isOwnPost) return;
    
    setActionLoading(true);
    
    try {
      const newFollowingState = !following;
      setFollowing(newFollowingState);
      
      if (onFollow) {
        await onFollow(post.userId, newFollowingState);
      }
    } catch (error) {
      // エラー時は元に戻す
      setFollowing(following);
      console.error('フォローエラー:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 投稿クリック
  const handlePostClick = () => {
    router.push(`/board/${post._id}`);
  };

  // シェア処理
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || `${post.author.name}さんの投稿`,
          text: post.content.substring(0, 100),
          url: `${window.location.origin}/board/${post._id}`
        });
      } catch (error) {
        // ユーザーがキャンセルした場合は無視
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('シェアエラー:', error);
        }
      }
    } else {
      // Web Share API が使えない場合
      if (onShare) {
        onShare(post);
      } else {
        // クリップボードにコピー
        navigator.clipboard.writeText(`${window.location.origin}/board/${post._id}`);
        // TODO: トーストで通知
      }
    }
  };

  // メニュー処理
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleReport = () => {
    handleMenuClose();
    if (onReport) {
      onReport(post);
    }
  };

  return (
    <Card 
      sx={{ 
        mb: compact ? 1 : 2, 
        cursor: 'pointer',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-1px)'
        },
        transition: 'all 0.2s ease-in-out'
      }} 
      onClick={handlePostClick}
    >
      <CardContent sx={{ pb: showActions ? 1 : 2 }}>
        {/* 投稿者情報 */}
        <Box display="flex" alignItems="flex-start" mb={compact ? 1 : 2}>
          <Avatar
            src={post.author.avatar}
            sx={{ 
              width: compact ? 40 : 48, 
              height: compact ? 40 : 48, 
              mr: 2 
            }}
          >
            {post.author.name[0]}
          </Avatar>
          
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography 
                variant={compact ? "body1" : "subtitle1"} 
                fontWeight="bold"
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {post.author.name}
              </Typography>
              
              {post.author.isVerified && (
                <Verified 
                  sx={{ 
                    fontSize: 16, 
                    color: theme.palette.primary.main 
                  }} 
                />
              )}
              
              {post.isFollowing && !isOwnPost && (
                <Chip 
                  label="フォロー中" 
                  size="small" 
                  variant="outlined"
                  color="primary"
                />
              )}
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: compact ? '0.75rem' : '0.875rem' }}
              >
                {formatRelativeTime(post.createdAt)}
              </Typography>
              
              {post.author.username && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    •
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: compact ? '0.75rem' : '0.875rem' }}
                  >
                    @{post.author.username}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          
          {/* アクションメニュー */}
          <Box display="flex" alignItems="center" gap={1}>
            {showFollowButton && !isOwnPost && session?.user && (
              <Button
                size="small"
                variant={following ? "outlined" : "contained"}
                startIcon={following ? <PersonRemove /> : <PersonAdd />}
                onClick={handleFollow}
                disabled={actionLoading}
                sx={{ minWidth: 'auto' }}
              >
                {isMobile ? '' : (following ? 'フォロー解除' : 'フォロー')}
              </Button>
            )}
            
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* 投稿タイトル */}
        {post.title && (
          <Typography 
            variant={compact ? "body1" : "h6"} 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              lineHeight: 1.3
            }}
          >
            {post.title}
          </Typography>
        )}

        {/* 投稿内容 */}
        <Typography 
          variant="body1" 
          paragraph
          sx={{ 
            mb: post.media?.length ? 2 : 1,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {post.content}
        </Typography>

        {/* メディア表示 */}
        {post.media && post.media.length > 0 && (
          <Box mb={2}>
            {post.media.map((media, index) => (
              <Box key={index} mb={index < post.media!.length - 1 ? 1 : 0}>
                {media.type === 'image' ? (
                  <Box position="relative">
                    {imageLoading && (
                      <Skeleton 
                        variant="rectangular" 
                        width="100%" 
                        height={200}
                        sx={{ borderRadius: 1 }}
                      />
                    )}
                    <Box sx={{ position: 'relative', maxHeight: 400, borderRadius: 1, overflow: 'hidden' }}>
                      <OptimizedImage
                        src={media.thumbnailUrl || media.url}
                        alt={media.alt || '投稿画像'}
                        width={600}
                        height={400}
                        quality={85}
                        objectFit="contain"
                        loading="lazy"
                        style={{ 
                          display: imageLoading ? 'none' : 'block',
                          borderRadius: 8
                        }}
                        onLoad={() => setImageLoading(false)}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '56.25%', // 16:9 aspect ratio
                      borderRadius: 1,
                      overflow: 'hidden',
                      backgroundColor: theme.palette.grey[100]
                    }}
                  >
                    <video
                      src={media.url}
                      poster={media.thumbnailUrl}
                      controls
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {showActions && (
          <>
            <Divider sx={{ my: 1 }} />

            {/* アクションボタン */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" gap={isMobile ? 1 : 2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <IconButton 
                    size="small" 
                    color={liked ? "error" : "default"}
                    onClick={handleLike}
                    disabled={!session?.user || actionLoading}
                  >
                    {liked ? <Favorite /> : <FavoriteOutlined />}
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    {likeCount}
                  </Typography>
                </Box>
                
                <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                  <ChatBubbleOutline />
                </IconButton>
                
                <IconButton size="small" onClick={handleShare}>
                  <Share />
                </IconButton>
              </Box>

              {/* パフォーマンス情報（開発環境のみ） */}
              {process.env.NODE_ENV === 'development' && (
                <Typography variant="caption" color="text.secondary">
                  ID: {post._id.slice(-8)}
                </Typography>
              )}
            </Box>
          </>
        )}
      </CardContent>

      {/* メニュー */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/board/${post._id}`);
          handleMenuClose();
        }}>
          <LinkIcon sx={{ mr: 1 }} />
          リンクをコピー
        </MenuItem>
        
        {!isOwnPost && (
          <MenuItem onClick={handleReport}>
            <Report sx={{ mr: 1 }} />
            報告
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}