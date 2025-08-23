'use client';

import React, { useState, useCallback } from 'react';
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
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FavoriteOutlined,
  FavoriteBorder,
  ChatBubbleOutline,
  Share,
  MoreVert,
  ArrowUpward,
  Edit as CreateIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import FollowButton from '@/components/follow/FollowButton';
import SortSelector, { SortOption } from '@/components/SortSelector';
import { AuthButton } from '@/components/auth/AuthButton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { InfiniteScrollContainer } from '@/components/InfiniteScrollContainer';
import Link from 'next/link';

export default function TimelinePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sortBy, setSortBy] = useState<SortOption>('createdAt_desc');
  
  // 認証必須
  useRequireAuth({ redirectTo: '/login' });
  
  // 無限スクロールフックを使用
  const {
    posts,
    loading,
    error,
    hasNextPage,
    loadMore,
    refresh,
    newPostsCount,
    showNewPosts,
    totalCount,
    shouldUseVirtualization
  } = useInfiniteScroll({
    type: 'timeline',
    limit: 20,
    pollingInterval: 5000, // 5秒ごとに新着投稿をチェック
    sortBy // ソート条件を渡す
  });

  // いいね処理
  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!session?.user?.id) return;
    
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${postId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // ローカル更新（必要に応じて）
        // 今回はリフレッシュで対応
        refresh();
      }
    } catch (error) {
      console.error('いいねエラー:', error);
    }
  }, [session, refresh]);

  // 投稿クリック処理
  const handlePostClick = useCallback((post: any) => {
    sessionStorage.setItem('returnPath', '/timeline');
    router.push(`/board/${post._id}`);
  }, [router]);

  // ソート変更時のコールバック
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    // ソート変更後にリフレッシュして新しい順序で投稿を取得
    refresh();
  }, [refresh]);

  // トップへスクロール
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            タイムライン
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            フォロー中のユーザーの投稿
            {totalCount !== null && totalCount > 0 && (
              <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 2 }}>
                （{totalCount}件）
              </Typography>
            )}
          </Typography>
        </Box>

        {/* ソート機能 */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2 
          }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              並び順
            </Typography>
            <SortSelector
              value={sortBy}
              onChange={handleSortChange}
              disabled={loading}
              size="small"
            />
          </Box>
        </Paper>

        {/* 無限スクロールコンテナ */}
        <InfiniteScrollContainer
          loading={loading}
          error={error}
          hasNextPage={hasNextPage}
          onLoadMore={loadMore}
          onRefresh={refresh}
          newItemsCount={newPostsCount}
          onShowNewItems={showNewPosts}
          endMessage="すべての投稿を読み込みました"
          threshold={300}
          showSkeleton={true}
          skeletonCount={3}
        >
          {posts.length > 0 ? (
            posts.map((post) => {
              const isLiked = post.likedBy?.includes(session?.user?.id || '');
              
              return (
                <Card
                  key={post._id}
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => handlePostClick(post)}
                >
                  <CardContent>
                    {/* ユーザー情報 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={post.userId?.avatar}
                        alt={post.userId?.name}
                        sx={{ mr: 2 }}
                      >
                        {post.userId?.name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {post.userId?.displayName || post.userId?.name || '名無しさん'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{post.userId?.username || 'unknown'} ・{' '}
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </Typography>
                      </Box>
                      {post.userId?._id !== session?.user?.id && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <FollowButton
                            targetUserId={post.userId?._id || ''}
                            size="small"
                          />
                        </div>
                      )}
                    </Box>

                    {/* 投稿内容 */}
                    {post.title && (
                      <Typography variant="h6" gutterBottom>
                        {post.title}
                      </Typography>
                    )}
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </Typography>

                    {/* ハッシュタグ */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {post.hashtags.map((tag) => (
                          <Chip
                            key={tag._id}
                            label={`#${tag.name}`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/hashtags/${tag.name}`);
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    {/* メディア表示 */}
                    {post.media && post.media.length > 0 && (
                      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {post.media.map((media, index) => (
                          <Box
                            key={index}
                            sx={{
                              width: post.media!.length === 1 ? '100%' : 'calc(50% - 4px)',
                              aspectRatio: '16/9',
                              borderRadius: 2,
                              overflow: 'hidden',
                              bgcolor: 'grey.100',
                            }}
                          >
                            {media.type.startsWith('image') ? (
                              <img
                                src={media.url}
                                alt=""
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <video
                                src={media.url}
                                controls
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />

                    {/* アクションボタン */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post._id, isLiked);
                        }}
                        color={isLiked ? 'error' : 'default'}
                      >
                        {isLiked ? <FavoriteOutlined /> : <FavoriteBorder />}
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          {post.likes}
                        </Typography>
                      </IconButton>
                      
                      <IconButton size="small">
                        <ChatBubbleOutline />
                      </IconButton>
                      
                      <IconButton size="small">
                        <Share />
                      </IconButton>
                      
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            !loading && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  タイムラインに投稿がありません
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  他のユーザーをフォローして、タイムラインを充実させましょう！
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => router.push('/users')}
                >
                  ユーザーを探す
                </Button>
              </Paper>
            )
          )}
        </InfiniteScrollContainer>

        {/* スクロールトップボタン */}
        {posts.length > 5 && (
          <Fab
            color="secondary"
            size="small"
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: 999,
            }}
          >
            <ArrowUpward />
          </Fab>
        )}

        {/* 投稿作成ボタン */}
        <Fab
          color="primary"
          onClick={() => router.push('/board/create')}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <CreateIcon />
        </Fab>
      </Container>
    </Box>
  );
}