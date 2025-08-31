'use client';

import React, { useState, useCallback, useEffect, useTransition, startTransition } from 'react';
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
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SortOption } from '@/components/SortSelector';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthGuard } from '@/components/auth/AuthGuardImproved';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getNavigationHeaderStyles } from '@/styles/navigationHeaderStyles';
// Phase 5: Total Blocking Time削減 - React.lazy遅延読み込み
import { LazyPostList, LazySortSelector, LazyInfiniteScrollContainer } from '@/components/lazy/LazyBoardComponents';
import performanceConfig from '@/config/performance';

interface BoardPageClientProps {
  initialData: {
    posts: any[];
    totalCount: number;
    hasMore: boolean;
  };
}

export default function BoardPageClient({ initialData }: BoardPageClientProps) {
  const router = useRouter();
  const theme = useTheme(); // Issue #38: ダークモード対応
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt_desc');
  
  // Phase 5 Final: Total Blocking Time削減 - React 18 useTransition
  const [isPending, startTransition] = useTransition();
  
  // 無限スクロールフックを使用（初期データ付き）
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
    pollingInterval: performanceConfig.polling.interval, // Phase 7.1: 最適化されたポーリング間隔
    sortBy, // ソート条件を渡す
    initialData: initialData.posts, // Phase 5: 初期データを渡す
    initialTotalCount: initialData.totalCount,
    initialHasMore: initialData.hasMore
  });

  // 投稿削除時のコールバック - Phase 5 Final: useTransition for TBT reduction
  const handlePostDeleted = useCallback((deletedPostId: string) => {
    // 削除後にリフレッシュ（非ブロッキング実行）
    startTransition(() => {
      refresh();
    });
  }, [refresh, startTransition]);

  // 投稿更新時のコールバック - Phase 5 Final: useTransition for TBT reduction
  const handlePostUpdated = useCallback((updatedPost: any) => {
    // 更新後にリフレッシュ（非ブロッキング実行）
    startTransition(() => {
      refresh();
    });
  }, [refresh, startTransition]);

  // いいね更新時のコールバック - Phase 5 Final: useTransition for TBT reduction
  const handleLikeUpdate = useCallback((postId: string, newLikes: number, newLikedBy: string[]) => {
    // いいね更新は即座反映のためリフレッシュ不要（パフォーマンス最適化）
    // 必要に応じて状態更新のみを非ブロッキング実行
    startTransition(() => {
      // ローカル状態更新のみ実行（将来の機能拡張用）
    });
  }, [startTransition]);

  // 投稿クリック時のコールバック
  const handlePostClick = useCallback((post: any) => {
    router.push(`/board/${post._id}`);
  }, [router]);

  // ソート変更時のコールバック - Phase 5 Final: useTransition for TBT reduction
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    startTransition(() => {
      setSortBy(newSortBy);
      // ソート変更後にリフレッシュして新しい順序で投稿を取得
      refresh();
    });
  }, [refresh, startTransition]);

  // 無限スクロール用の非ブロッキングloadMore - Phase 5 Final: useTransition for TBT reduction
  const handleLoadMore = useCallback(() => {
    startTransition(() => {
      loadMore();
    });
  }, [loadMore, startTransition]);

  // リフレッシュ用の非ブロッキング関数 - Phase 5 Final: useTransition for TBT reduction
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      refresh();
    });
  }, [refresh, startTransition]);

  // 新着投稿表示用の非ブロッキング関数 - Phase 5 Final: useTransition for TBT reduction
  const handleShowNewPosts = useCallback(() => {
    startTransition(() => {
      showNewPosts();
    });
  }, [showNewPosts, startTransition]);

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
      <LazyPostList
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
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              掲示板
            </Typography>
            <AuthButton 
              onSearch={(term) => startTransition(() => setSearchTerm(term))} 
              onClearSearch={() => startTransition(() => setSearchTerm(''))}
              searchResultCount={filteredPosts.length}
            />
          </Toolbar>
          {/* 2段目のナビゲーション行 */}
          <Toolbar variant="dense" sx={getNavigationHeaderStyles(theme)}>
            <AuthButton isNavigationRow={true} />
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: { xs: 14, sm: 16, md: 16 } }}>
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
              <LazySortSelector
                value={sortBy}
                onChange={handleSortChange}
                disabled={loading || isPending}
                size="small"
              />
            </Box>
          </Paper>

          {/* 無限スクロールコンテナ - Phase 5 Final: useTransition統合 */}
          <LazyInfiniteScrollContainer
            posts={filteredPosts}
            renderPost={renderPost}
            loading={loading || isPending}
            error={error}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMore}
            onRefresh={handleRefresh}
            newItemsCount={newPostsCount}
            onShowNewItems={handleShowNewPosts}
            endMessage="すべての投稿を読み込みました"
            threshold={300}
            showSkeleton={true}
            skeletonCount={3}
            useVirtualization={shouldUseVirtualization}
          >
            {filteredPosts.length > 0 ? (
              <LazyPostList
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
          </LazyInfiniteScrollContainer>

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