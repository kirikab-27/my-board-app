'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
// @ts-ignore - react-window-infinite-loader型定義なし
import InfiniteLoader from 'react-window-infinite-loader';
import { Box, useMediaQuery, useTheme, Skeleton, Alert, Typography, Button, Fade } from '@mui/material';
import { Refresh } from '@mui/icons-material';

// デバイス別仮想化閾値
const DEVICE_THRESHOLDS = {
  mobile: 50,    // モバイル: 50件超過で仮想化
  tablet: 75,    // タブレット: 75件超過で仮想化
  desktop: 100   // デスクトップ: 100件超過で仮想化
};

// 投稿アイテムの高さ（Material-UIカード + マージン）
const ITEM_HEIGHT = 280;

interface VirtualInfiniteScrollContainerProps {
  posts: any[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  newPostsCount: number;
  onLoadMore: () => Promise<void>;
  onRefresh: () => void;
  onShowNewPosts: () => void;
  renderPost: (index: number, post: any) => React.ReactNode;
  showSkeleton?: boolean;
  skeletonCount?: number;
}

export function VirtualInfiniteScrollContainer({
  posts,
  loading,
  error,
  hasNextPage,
  newPostsCount,
  onLoadMore,
  onRefresh,
  onShowNewPosts,
  renderPost,
  showSkeleton = false,
  skeletonCount = 3
}: VirtualInfiniteScrollContainerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<InfiniteLoader>(null);

  // デバイス別閾値を決定
  const virtualizationThreshold = useMemo(() => {
    if (isMobile) return DEVICE_THRESHOLDS.mobile;
    if (isTablet) return DEVICE_THRESHOLDS.tablet;
    return DEVICE_THRESHOLDS.desktop;
  }, [isMobile, isTablet, isDesktop]);

  // 仮想化を使用するかどうか
  const useVirtualization = posts.length > virtualizationThreshold;

  // コンテナの高さを取得
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const windowHeight = window.innerHeight;
        const containerTop = containerRef.current.getBoundingClientRect().top;
        const availableHeight = windowHeight - containerTop - 100; // 100pxはマージン
        setContainerHeight(Math.max(400, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // アイテムがロードされているかチェック
  const isItemLoaded = useCallback((index: number) => {
    return index < posts.length;
  }, [posts.length]);

  // 追加アイテムの数（ローディング表示のため）
  const itemCount = hasNextPage ? posts.length + 1 : posts.length;

  // 仮想リストアイテムレンダラー
  const VirtualItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const post = posts[index];
    
    if (!post) {
      // ローディングスケルトン
      return (
        <div style={style}>
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={20} width="60%" />
          </Box>
        </div>
      );
    }

    return (
      <div style={style}>
        {renderPost(index, post)}
      </div>
    );
  }, [posts, renderPost]);

  // 通常のリストレンダリング（非仮想化）
  const RegularList = () => (
    <Box>
      {posts.map((post, index) => (
        <Box key={post._id || index}>
          {renderPost(index, post)}
        </Box>
      ))}
      
      {/* ローディング表示 */}
      {loading && showSkeleton && (
        <Box sx={{ mt: 2 }}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <Box key={`skeleton-${index}`} sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" height={200} sx={{ mb: 1 }} />
              <Skeleton variant="text" height={30} />
              <Skeleton variant="text" height={20} width="60%" />
            </Box>
          ))}
        </Box>
      )}
      
      {/* 終端表示 */}
      {!hasNextPage && posts.length > 0 && (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body2">
            すべての投稿を表示しました
          </Typography>
        </Box>
      )}
    </Box>
  );

  // エラー表示
  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 2 }}
        action={
          <Button color="inherit" size="small" onClick={onRefresh}>
            <Refresh sx={{ mr: 1 }} />
            再試行
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      {/* 新着投稿通知バナー - Phase 4強化版 */}
      {newPostsCount > 0 && (
        <Fade in={true}>
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2, 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
              color: 'white',
              borderRadius: 2,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.7)' },
                '50%': { boxShadow: '0 0 0 8px rgba(33, 150, 243, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)' }
              },
              '&.MuiAlert-standardInfo': {
                backgroundColor: 'transparent'
              },
              '& .MuiAlert-icon': {
                color: 'white'
              }
            }}
            onClick={onShowNewPosts}
            action={
              <Button 
                color="inherit" 
                size="small"
                sx={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                表示する ({newPostsCount})
              </Button>
            }
          >
            🆕 {newPostsCount}件の新しい投稿があります
          </Alert>
        </Fade>
      )}

      {/* 仮想化の使用状況を開発環境で表示 - Phase 4強化版 */}
      {process.env.NODE_ENV === 'development' && (
        <Alert 
          severity={useVirtualization ? 'success' : 'info'} 
          variant="outlined" 
          sx={{ 
            mb: 2, 
            fontSize: '12px',
            py: 0.5,
            '& .MuiAlert-message': {
              fontSize: 'inherit'
            }
          }}
        >
          <Typography variant="caption">
            {useVirtualization 
              ? `🚀 仮想化有効 (${posts.length}件 > ${virtualizationThreshold}件閾値)` 
              : `📋 通常表示 (${posts.length}件 ≤ ${virtualizationThreshold}件閾値)`
            }
            {` | デバイス: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}`}
            {` | 項目高さ: ${ITEM_HEIGHT}px`}
          </Typography>
        </Alert>
      )}

      {/* 仮想スクロールまたは通常のリスト */}
      {useVirtualization ? (
        <InfiniteLoader
          ref={loaderRef}
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={onLoadMore}
        >
          {({ onItemsRendered, ref }: { onItemsRendered: any; ref: any }) => (
            <List
              ref={ref}
              height={containerHeight}
              itemCount={itemCount}
              itemSize={ITEM_HEIGHT}
              onItemsRendered={onItemsRendered}
              width="100%"
              overscanCount={5} // パフォーマンス最適化のためのオーバースキャン
            >
              {VirtualItem}
            </List>
          )}
        </InfiniteLoader>
      ) : (
        <RegularList />
      )}

      {/* 投稿が0件の場合 */}
      {posts.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          投稿がまだありません。最初の投稿を作成してみましょう！
        </Alert>
      )}
    </Box>
  );
}

export default VirtualInfiniteScrollContainer;