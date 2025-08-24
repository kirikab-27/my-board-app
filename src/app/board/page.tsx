'use client';

import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  AppBar,
  Toolbar,
  Button,
  Fab,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PostList from '@/components/PostList';
import SortSelector, { SortOption } from '@/components/SortSelector';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthGuard } from '@/components/auth/AuthGuardImproved';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { InfiniteScrollContainer } from '@/components/InfiniteScrollContainer';

export default function BoardPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt_desc');
  
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
    type: 'board',
    limit: 20,
    pollingInterval: 5000, // 5秒ごとに新着投稿をチェック
    sortBy // ソート条件を渡す
  });

  // 投稿削除時のコールバック
  const handlePostDeleted = useCallback((deletedPostId: string) => {
    // 削除後にリフレッシュ
    refresh();
  }, [refresh]);

  // 投稿更新時のコールバック
  const handlePostUpdated = useCallback((updatedPost: any) => {
    // 更新後にリフレッシュ
    refresh();
  }, [refresh]);

  // いいね更新時のコールバック
  const handleLikeUpdate = useCallback((postId: string, newLikes: number, newLikedBy: string[]) => {
    // いいね更新後にリフレッシュ（必要に応じて）
    // 今回はローカル更新で対応可能なのでリフレッシュしない
  }, []);

  // 投稿クリック時のコールバック
  const handlePostClick = useCallback((post: any) => {
    router.push(`/board/${post._id}`);
  }, [router]);

  // ソート変更時のコールバック
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    // ソート変更後にリフレッシュして新しい順序で投稿を取得
    refresh();
  }, [refresh]);

  // 検索フィルタリング
  const filteredPosts = searchTerm
    ? posts.filter(post =>
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : posts;

  // 仮想スクロール用の投稿レンダリング関数
  const renderPost = useCallback((index: number, post: any) => (
    <Box key={post._id} sx={{ mb: 2 }}>
      <PostList
        posts={[post]}
        onPostDeleted={handlePostDeleted}
        onPostUpdated={handlePostUpdated}
        onLikeUpdate={handleLikeUpdate}
        searchTerm={searchTerm}
        sessionUserId={null}
      />
    </Box>
  ), [handlePostDeleted, handlePostUpdated, handleLikeUpdate, searchTerm]);

  return (
    <AuthGuard>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ mb: 3 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              掲示板
            </Typography>
            <AuthButton 
              onSearch={setSearchTerm} 
              onClearSearch={() => setSearchTerm('')}
              searchResultCount={filteredPosts.length}
            />
          </Toolbar>
          {/* 2段目のナビゲーション行 */}
          <Toolbar variant="dense" sx={{ minHeight: 48, borderTop: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }}>
            <AuthButton isNavigationRow={true} />
          </Toolbar>
        </AppBar>

        <Container maxWidth="md">
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              みんなの投稿
              {totalCount !== null && (
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
            posts={filteredPosts}
            renderPost={renderPost}
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
            useVirtualization={shouldUseVirtualization}
          >
            {filteredPosts.length > 0 ? (
              <PostList
                posts={filteredPosts}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
                onLikeUpdate={handleLikeUpdate}
                onPostClick={handlePostClick}
                searchTerm={searchTerm}
                sessionUserId={null}
              />
            ) : (
              !loading && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {searchTerm
                    ? '検索結果が見つかりませんでした。'
                    : 'まだ投稿がありません。最初の投稿を作成してみましょう！'}
                </Alert>
              )
            )}
          </InfiniteScrollContainer>

          {/* 投稿作成ボタン（固定） */}
          <Fab
            color="primary"
            aria-label="add"
            component={Link}
            href="/board/create"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <AddIcon />
          </Fab>
        </Container>
      </Box>
    </AuthGuard>
  );
}