'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Button,
  Chip,
  Alert,
  Fab,
  Skeleton,
  Paper,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FavoriteOutlined,
  ChatBubbleOutline,
  Share,
  MoreVert,
  ArrowUpward,
  Edit as CreateIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import FollowButton from '@/components/follow/FollowButton';

// タイムライン投稿の型定義
interface TimelinePost {
  _id: string;
  title?: string;
  content: string;
  likes: number;
  createdAt: string;
  userId: string;
  author: {
    _id: string;
    name: string;
    username?: string;
    avatar?: string;
    isVerified?: boolean;
  };
  isFollowing: boolean;
  mediaIds?: string[];
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    alt?: string;
    width?: number;
    height?: number;
  }>;
}

// タイムラインAPIレスポンス型
interface TimelineResponse {
  posts: TimelinePost[];
  pagination: {
    currentPage: number;
    hasNextPage: boolean;
    nextCursor: string | null;
    totalLoaded: number;
  };
  metadata: {
    followingCount: number;
    followerCount: number;
    queryTime: string;
    targetUsers: number;
  };
}

// 新着チェックレスポンス型
interface UpdatesResponse {
  hasNewPosts: boolean;
  newPostsCount: number;
  lastChecked: string;
}

export default function TimelinePage() {
  const { status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 認証チェック
  const { isLoading: authLoading } = useRequireAuth({
    redirectTo: '/login?callbackUrl=' + encodeURIComponent('/timeline')
  });

  // 状態管理
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<TimelineResponse['metadata'] | null>(null);
  
  // リアルタイム更新関連
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string>(new Date().toISOString());
  
  // スクロール関連
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // タイムライン取得関数
  const fetchTimeline = useCallback(async (
    page = 1, 
    cursor: string | null = null, 
    append = false
  ) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (page > 1) params.append('page', page.toString());
      if (cursor) params.append('cursor', cursor);
      params.append('limit', '20');

      const response = await fetch(`/api/timeline?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'タイムラインの取得に失敗しました');
      }

      const data: TimelineResponse = await response.json();
      
      if (append) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
        setLastFetchTime(new Date().toISOString());
      }
      
      setHasNextPage(data.pagination.hasNextPage);
      setNextCursor(data.pagination.nextCursor);
      setMetadata(data.metadata);

    } catch (err) {
      console.error('タイムライン取得エラー:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  // 新着チェック関数
  const checkForUpdates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('since', lastFetchTime);
      
      const response = await fetch(`/api/timeline/updates?${params}`);
      
      if (response.ok) {
        const data: UpdatesResponse = await response.json();
        
        if (data.hasNewPosts && data.newPostsCount > 0) {
          setNewPostsCount(data.newPostsCount);
          setShowNewPostsBanner(true);
        }
      }
    } catch (err) {
      console.error('新着チェックエラー:', err);
    }
  }, [lastFetchTime]);

  // 無限スクロール設定
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore) {
          fetchTimeline(0, nextCursor, true);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, loadingMore, nextCursor, fetchTimeline]);

  // スクロール位置監視
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 初回読み込み
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTimeline();
    }
  }, [status, fetchTimeline]);

  // 30秒ごとの新着チェック
  useEffect(() => {
    if (status === 'authenticated') {
      const interval = setInterval(checkForUpdates, 30000);
      return () => clearInterval(interval);
    }
  }, [status, checkForUpdates]);

  // プルトゥリフレッシュ
  const handleRefresh = () => {
    setRefreshing(true);
    setShowNewPostsBanner(false);
    setNewPostsCount(0);
    fetchTimeline();
  };

  // 新着投稿を読み込み
  const loadNewPosts = () => {
    setShowNewPostsBanner(false);
    setNewPostsCount(0);
    handleRefresh();
  };

  // トップにスクロール
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 相対時間フォーマット (未使用 - 将来の機能用)
  // const formatRelativeTime = (dateString: string) => {
  //   try {
  //     return formatDistanceToNow(new Date(dateString), {
  //       addSuffix: true,
  //       locale: ja
  //     });
  //   } catch {
  //     return '時刻不明';
  //   }
  // };

  // 認証中の場合
  if (authLoading || status === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <TimelineSkeleton />
      </Container>
    );
  }

  // エラー状態
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => fetchTimeline()}>
              再試行
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2, position: 'relative' }}>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          タイムライン
        </Typography>
        
        <Box display="flex" gap={1}>
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
          
          {metadata && (
            <Chip 
              label={`${metadata.followingCount} フォロー中`} 
              size="small" 
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* 新着投稿通知バナー */}
      {showNewPostsBanner && (
        <Alert 
          severity="info" 
          sx={{ mb: 2, cursor: 'pointer' }}
          onClick={loadNewPosts}
          action={
            <Button color="inherit" size="small">
              読み込む
            </Button>
          }
        >
          {newPostsCount}件の新しい投稿があります
        </Alert>
      )}

      {/* メイン投稿リスト */}
      {loading ? (
        <TimelineSkeleton />
      ) : posts.length === 0 ? (
        <EmptyTimeline onRefresh={handleRefresh} />
      ) : (
        <Box>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
          
          {/* 無限スクロール用のトリガー */}
          <div ref={loadMoreRef} style={{ height: '20px' }}>
            {loadingMore && (
              <Box display="flex" justifyContent="center" py={2}>
                <Typography variant="body2" color="text.secondary">
                  読み込み中...
                </Typography>
              </Box>
            )}
          </div>
        </Box>
      )}

      {/* フローティングアクションボタン */}
      <Fab
        color="primary"
        sx={{ 
          position: 'fixed', 
          bottom: isMobile ? 80 : 16, 
          right: 16 
        }}
        onClick={() => router.push('/board/create')}
      >
        <CreateIcon />
      </Fab>

      {/* トップに戻るボタン */}
      {showScrollTop && (
        <Fab
          size="small"
          color="secondary"
          sx={{ 
            position: 'fixed', 
            bottom: isMobile ? 140 : 76, 
            right: 16 
          }}
          onClick={scrollToTop}
        >
          <ArrowUpward />
        </Fab>
      )}
    </Container>
  );
}

// 投稿カードコンポーネント
function PostCard({ post }: { post: TimelinePost }) {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();

  const handlePostClick = () => {
    router.push(`/board/${post._id}`);
  };

  const handleFollowChange = (isFollowing: boolean) => {
    // タイムライン投稿のフォロー状態を更新
    // 実際のアプリケーションではparent componentに通知する必要がある
    console.log(`フォロー状態変更: ${post.author?.name || '不明なユーザー'} - ${isFollowing ? 'フォロー' : 'アンフォロー'}`);
  };

  // 自分の投稿かどうかチェック
  const isOwnPost = session?.user?.id === post.userId;
  
  // 投稿者情報の安全チェック
  if (!post.author) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Alert severity="error">
            投稿者情報が見つかりません
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2, cursor: 'pointer' }} onClick={handlePostClick}>
      <CardContent>
        {/* 投稿者情報 */}
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={post.author?.avatar}
            sx={{ width: 48, height: 48, mr: 2 }}
          >
            {post.author?.name?.[0] || '?'}
          </Avatar>
          
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                {post.author?.name || '不明なユーザー'}
              </Typography>
              {post.author?.isVerified && (
                <Chip label="認証済み" size="small" color="primary" />
              )}
              {post.isFollowing && (
                <Chip label="フォロー中" size="small" variant="outlined" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: ja
              })}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {!isOwnPost && post.author && (
              <FollowButton
                targetUserId={post.userId}
                targetUserName={post.author.name}
                initialIsFollowing={post.isFollowing}
                size="small"
                variant="text"
                onFollowChange={handleFollowChange}
              />
            )}
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* 投稿タイトル */}
        {post.title && (
          <Typography variant="h6" gutterBottom>
            {post.title}
          </Typography>
        )}

        {/* 投稿内容 */}
        <Typography variant="body1" paragraph>
          {post.content}
        </Typography>

        {/* メディア表示 */}
        {post.media && post.media.length > 0 && (
          <Box mb={2}>
            {post.media.map((media, index) => (
              <Box key={index} mb={1}>
                {media.type === 'image' ? (
                  <img
                    src={media.thumbnailUrl || media.url}
                    alt={media.alt || '投稿画像'}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: theme.shape.borderRadius
                    }}
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={media.url}
                    poster={media.thumbnailUrl}
                    controls
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: theme.shape.borderRadius
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        {/* アクションボタン */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <IconButton size="small" color="primary">
                <FavoriteOutlined />
              </IconButton>
              <Typography variant="body2">{post.likes}</Typography>
            </Box>
            
            <IconButton size="small">
              <ChatBubbleOutline />
            </IconButton>
            
            <IconButton size="small">
              <Share />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// スケルトンローディング
function TimelineSkeleton() {
  return (
    <Box>
      {[...Array(5)].map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
              <Box flex={1}>
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="20%" />
              </Box>
            </Box>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// 空のタイムライン
function EmptyTimeline({ onRefresh }: { onRefresh: () => void }) {
  const router = useRouter();

  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        タイムラインが空です
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        フォローしている人がまだ投稿をしていないか、フォローしている人がいません
      </Typography>
      <Box display="flex" gap={2} justifyContent="center" mt={2}>
        <Button variant="outlined" onClick={onRefresh}>
          更新
        </Button>
        <Button variant="contained" onClick={() => router.push('/board')}>
          投稿を探す
        </Button>
      </Box>
    </Paper>
  );
}