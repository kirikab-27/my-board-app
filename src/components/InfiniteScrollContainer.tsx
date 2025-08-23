'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Box, CircularProgress, Typography, Alert, Button, Fade, Skeleton, useMediaQuery, useTheme, LinearProgress } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import VirtualInfiniteScrollContainer from './VirtualInfiniteScrollContainer';

interface InfiniteScrollContainerProps {
  children?: React.ReactNode;
  posts?: any[]; // 仮想スクロール用
  renderPost?: (index: number, post: any) => React.ReactNode; // 仮想スクロール用
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  onLoadMore: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  newItemsCount?: number;
  onShowNewItems?: () => void;
  endMessage?: string;
  threshold?: number; // スクロール検知の閾値（ピクセル）
  showSkeleton?: boolean;
  skeletonCount?: number;
  useVirtualization?: boolean; // 仮想スクロールを使用するかどうか
}

export function InfiniteScrollContainer({
  children,
  posts,
  renderPost,
  loading,
  error,
  hasNextPage,
  onLoadMore,
  onRefresh,
  newItemsCount = 0,
  onShowNewItems,
  endMessage = 'すべて読み込みました',
  threshold = 200,
  showSkeleton = true,
  skeletonCount = 3,
  useVirtualization = false
}: InfiniteScrollContainerProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // Intersection Observer のコールバック
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !loadingRef.current) {
        loadingRef.current = true;
        onLoadMore().finally(() => {
          loadingRef.current = false;
        });
      }
    },
    [hasNextPage, onLoadMore]
  );

  // Intersection Observer の設定（仮想スクロール時は無効）
  useEffect(() => {
    if (useVirtualization) return;

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold, useVirtualization]);

  // スケルトンローディング表示 - Phase 4強化版
  const renderSkeleton = () => (
    <>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <Box 
          key={`skeleton-${index}`} 
          sx={{ 
            mb: 2, 
            p: 2, 
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fafafa',
            animation: 'shimmer 1.5s ease-in-out infinite',
            '@keyframes shimmer': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.4 },
              '100%': { opacity: 1 }
            }
          }}
        >
          {/* ユーザー情報 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="30%" height={20} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="50%" height={16} />
            </Box>
          </Box>
          
          {/* 投稿タイトル */}
          <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
          
          {/* 投稿内容 */}
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1, mb: 2 }} />
          
          {/* アクションボタン */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      ))}
    </>
  );

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* 新着投稿通知バナー - Phase 4強化版 */}
      {newItemsCount > 0 && onShowNewItems && (
        <Fade in={true}>
          <Alert
            severity="info"
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={onShowNewItems}
                sx={{
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                表示 ({newItemsCount})
              </Button>
            }
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              mb: 2,
              borderRadius: 2,
              boxShadow: 2,
              background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
              color: 'white',
              '&.MuiAlert-standardInfo': {
                backgroundColor: 'transparent'
              },
              '& .MuiAlert-icon': {
                color: 'white'
              },
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.7)'
                },
                '50%': {
                  boxShadow: '0 0 0 8px rgba(33, 150, 243, 0)'
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)'
                }
              }
            }}
          >
            🆕 {newItemsCount}件の新着投稿があります
          </Alert>
        </Fade>
      )}

      {/* エラー表示 - Phase 4強化版 */}
      {error && (
        <Alert
          severity="error"
          action={
            onRefresh && (
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                sx={{
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                再試行
              </Button>
            )
          }
          sx={{ 
            mb: 2,
            borderRadius: 2,
            boxShadow: 1,
            '&.MuiAlert-standardError': {
              backgroundColor: '#ffebee',
              color: '#c62828',
              border: '1px solid #ef5350'
            },
            '& .MuiAlert-icon': {
              color: '#f44336'
            },
            '& .MuiAlert-message': {
              fontWeight: 500
            }
          }}
        >
          ⚠️ {error}
          {error.includes('ネットワーク') && (
            <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
              インターネット接続を確認してください
            </Typography>
          )}
        </Alert>
      )}

      {/* コンテンツ */}
      {useVirtualization && posts && renderPost ? (
        <VirtualInfiniteScrollContainer
          posts={posts}
          loading={loading}
          error={error}
          hasNextPage={hasNextPage}
          newPostsCount={newItemsCount}
          onLoadMore={onLoadMore}
          onRefresh={onRefresh || (() => {})}
          onShowNewPosts={onShowNewItems || (() => {})}
          renderPost={renderPost}
          showSkeleton={showSkeleton}
          skeletonCount={skeletonCount}
        />
      ) : (
        children
      )}

      {/* 従来のInfiniteScrollコンポーネントの要素（仮想スクロール時は非表示） */}
      {!useVirtualization && (
        <>
          {/* 初回ローディング時のスケルトン */}
          {loading && React.Children.count(children) === 0 && showSkeleton && (
            <Box sx={{ mt: 2 }}>
              {renderSkeleton()}
            </Box>
          )}

          {/* 追加読み込み時のローディング表示 - Phase 4強化版 */}
          {loading && React.Children.count(children) > 0 && (
            <Box sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  投稿を読み込み中...
                </Typography>
              </Box>
              <LinearProgress 
                variant="indeterminate" 
                sx={{
                  width: '60%',
                  mx: 'auto',
                  borderRadius: 2,
                  height: 4,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                  }
                }}
              />
            </Box>
          )}

          {/* 無限スクロールのトリガー要素 */}
          {hasNextPage && !loading && (
            <Box
              ref={loadMoreRef}
              sx={{
                height: 1,
                width: '100%'
              }}
            />
          )}

          {/* すべて読み込み完了メッセージ - Phase 4強化版 */}
          {!hasNextPage && !loading && React.Children.count(children) > 0 && (
            <Fade in={true}>
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  borderTop: '1px solid #e0e0e0',
                  mt: 2
                }}
              >
                <Box sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  px: 3, 
                  py: 1,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 20,
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    ✅ {endMessage}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  投稿作成ボタンから新しい投稿を作成できます
                </Typography>
              </Box>
            </Fade>
          )}
        </>
      )}
    </Box>
  );
}