'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

// タイムライン投稿の型定義
export interface TimelinePost {
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
export interface TimelineResponse {
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

// フック設定型
interface UseTimelineOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// フック戻り値型
interface UseTimelineReturn {
  // データ
  posts: TimelinePost[];
  metadata: TimelineResponse['metadata'] | null;
  
  // 状態
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  
  // ページネーション
  hasNextPage: boolean;
  nextCursor: string | null;
  
  // リアルタイム
  newPostsCount: number;
  hasNewPosts: boolean;
  
  // アクション
  fetchTimeline: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  loadNewPosts: () => Promise<void>;
  
  // ユーティリティ
  lastFetchTime: string;
  isOnline: boolean;
}

export function useTimeline(options: UseTimelineOptions = {}): UseTimelineReturn {
  const {
    limit = 20,
    autoRefresh = true,
    refreshInterval = 30000 // 30秒
  } = options;

  const { data: session, status } = useSession();
  
  // 状態管理
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [metadata, setMetadata] = useState<TimelineResponse['metadata'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<string>(new Date().toISOString());
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // リフレッシュタイマー
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // オンライン状態監視
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // タイムライン取得関数
  const fetchTimeline = useCallback(async (
    cursor: string | null = null,
    append = false
  ) => {
    if (!session?.user?.id) return;

    try {
      // 前のリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/timeline?${params}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'タイムラインの取得に失敗しました');
      }

      const data: TimelineResponse = await response.json();
      
      if (append) {
        setPosts(prev => {
          // 重複を防ぐ
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = data.posts.filter(p => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      } else {
        setPosts(data.posts);
        setLastFetchTime(new Date().toISOString());
      }
      
      setHasNextPage(data.pagination.hasNextPage);
      setNextCursor(data.pagination.nextCursor);
      setMetadata(data.metadata);
      setError(null);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // キャンセルされたリクエストは無視
      }
      
      console.error('タイムライン取得エラー:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [session?.user?.id, limit]);

  // 新着チェック関数
  const checkForUpdates = useCallback(async () => {
    if (!session?.user?.id || !isOnline) return;

    try {
      const params = new URLSearchParams();
      params.append('since', lastFetchTime);
      
      const response = await fetch(`/api/timeline/updates?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.hasNewPosts && data.newPostsCount > 0) {
          setNewPostsCount(data.newPostsCount);
        }
      }
    } catch (err) {
      console.error('新着チェックエラー:', err);
    }
  }, [session?.user?.id, lastFetchTime, isOnline]);

  // より多くの投稿を読み込み
  const loadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore) return;
    await fetchTimeline(nextCursor, true);
  }, [hasNextPage, loadingMore, nextCursor, fetchTimeline]);

  // リフレッシュ
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setNewPostsCount(0);
    await fetchTimeline();
  }, [fetchTimeline]);

  // 新着投稿を読み込み
  const loadNewPosts = useCallback(async () => {
    setNewPostsCount(0);
    await refresh();
  }, [refresh]);

  // 初回読み込み
  useEffect(() => {
    if (status === 'authenticated' && isOnline) {
      fetchTimeline();
    }
  }, [status, fetchTimeline, isOnline]);

  // 自動リフレッシュ設定
  useEffect(() => {
    if (!autoRefresh || !session?.user?.id || !isOnline) return;

    const startRefreshTimer = () => {
      refreshTimerRef.current = setInterval(checkForUpdates, refreshInterval);
    };

    const stopRefreshTimer = () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };

    // 페이지가 보이는 동안에만 자동 새로고침
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRefreshTimer();
      } else {
        startRefreshTimer();
        // 페이지로 돌아왔을 때 즉시 체크
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 초기 타이머 시작
    if (!document.hidden) {
      startRefreshTimer();
    }

    return () => {
      stopRefreshTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh, session?.user?.id, refreshInterval, checkForUpdates, isOnline]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  return {
    // データ
    posts,
    metadata,
    
    // 状態
    loading,
    loadingMore,
    refreshing,
    error,
    
    // ページネーション
    hasNextPage,
    nextCursor,
    
    // リアルタイム
    newPostsCount,
    hasNewPosts: newPostsCount > 0,
    
    // アクション
    fetchTimeline: () => fetchTimeline(),
    loadMore,
    refresh,
    checkForUpdates,
    loadNewPosts,
    
    // ユーティリティ
    lastFetchTime,
    isOnline
  };
}