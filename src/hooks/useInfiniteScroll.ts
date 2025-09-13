import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// import { useSession } from 'next-auth/react';
import { useMediaQuery, useTheme } from '@mui/material';
import { performanceMonitor } from '@/utils/performance';

export interface Post {
  _id: string;
  title?: string;
  content: string;
  likes: number;
  likedBy: string[];
  userId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    username?: string;
    displayName?: string;
  };
  authorName?: string;
  isPublic: boolean;
  hashtags?: Array<{ _id: string; name: string; count: number }>;
  media?: Array<{ url: string; type: string; publicId: string }>;
  commentsCount?: number; // コメント件数
  createdAt: string;
  updatedAt: string;
}

interface InfiniteScrollOptions {
  type?: 'timeline' | 'board' | 'user';
  username?: string;
  limit?: number;
  pollingInterval?: number; // 新着投稿チェック間隔（ミリ秒）
  sortBy?: string; // 内部ロジックのみで使用（UIは非表示）
  // Phase 5: ISR初期データ対応
  initialData?: Post[]; // 事前取得された初期投稿データ
  initialTotalCount?: number; // 初期総数
  initialHasMore?: boolean; // 初期hasMoreフラグ
}

interface UseInfiniteScrollReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  newPostsCount: number;
  showNewPosts: () => void;
  totalCount: number | null;
  shouldUseVirtualization: boolean; // 仮想スクロール使用推奨フラグ
  // Phase 4追加機能
  isLoadingMore: boolean; // 追加読み込み中フラグ
  retryCount: number; // リトライ回数
  lastError: string | null; // 最後のエラー詳細
}

export function useInfiniteScroll(options: InfiniteScrollOptions = {}): UseInfiniteScrollReturn {
  const {
    type = 'board',
    username,
    limit = 20,
    pollingInterval = 5000,
    sortBy = 'createdAt_desc', // デフォルト値を設定
    // Phase 5: ISR初期データ
    initialData = [],
    initialTotalCount = null,
    initialHasMore = true,
  } = options;
  // const { data: session } = useSession();

  // Phase 5: 初期データを設定
  const [posts, setPosts] = useState<Post[]>(initialData);
  const [loading, setLoading] = useState(false); // 初期データがある場合はfalseから開始
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(initialHasMore);
  // マイケル：「cursorの初期値を修正！初期データがある場合も最後のIDを設定」
  const [cursor, setCursor] = useState<string | null>(
    initialData.length > 0 ? initialData[initialData.length - 1]._id : null
  );

  const [totalCount, setTotalCount] = useState<number | null>(initialTotalCount);

  // Phase 4追加状態管理
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // 新着投稿管理
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const [lastPostId, setLastPostId] = useState<string | null>(null);
  const lastPostIdRef = useRef<string | null>(null);
  // const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // マイケル：「sortByをrefで管理して最新値を参照」
  const sortByRef = useRef(sortBy);
  sortByRef.current = sortBy;

  // 他の値もrefで管理（無限ループ防止）
  const typeRef = useRef(type);
  typeRef.current = type;
  const usernameRef = useRef(username);
  usernameRef.current = username;
  const limitRef = useRef(limit);
  limitRef.current = limit;

  // 初回読み込みフラグ
  const initialLoadRef = useRef(false);

  // fetchPostsをrefで保持して無限ループを防ぐ
  const fetchPostsRef = useRef<typeof fetchPosts>();

  // デバイス別仮想スクロール判定
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // デバイス別仮想化閾値
  const DEVICE_THRESHOLDS = {
    mobile: 50, // モバイル: 50件超過で仮想化
    tablet: 75, // タブレット: 75件超過で仮想化
    desktop: 100, // デスクトップ: 100件超過で仮想化
  };

  const virtualizationThreshold = useMemo(() => {
    if (isMobile) return DEVICE_THRESHOLDS.mobile;
    if (isTablet) return DEVICE_THRESHOLDS.tablet;
    return DEVICE_THRESHOLDS.desktop;
  }, [
    isMobile,
    isTablet,
    DEVICE_THRESHOLDS.mobile,
    DEVICE_THRESHOLDS.tablet,
    DEVICE_THRESHOLDS.desktop,
  ]);

  // 仮想スクロール使用推奨フラグ
  const shouldUseVirtualization = posts.length > virtualizationThreshold;

  // fetchPosts実行中フラグ
  const fetchingRef = useRef(false);

  // データ取得関数
  const fetchPosts = useCallback(async (nextCursor: string | null = null, isPolling = false) => {
    // すでに実行中ならスキップ
    if (fetchingRef.current && !isPolling) {
      return;
    }

    fetchingRef.current = true;

    // ポーリング時はローディング表示しない
    if (!isPolling) {
      setLoading(true);
      setError(null);
      // パフォーマンス測定開始
      performanceMonitor.startMeasurement(nextCursor ? 'load-more' : 'initial-load');
    }

    try {
      const params = new URLSearchParams({
        type: typeRef.current,
        limit: limitRef.current.toString(),
        sortBy: sortByRef.current, // refから最新値を取得
      });

      if (nextCursor) {
        params.append('cursor', nextCursor);
      }

      if (usernameRef.current) {
        params.append('username', usernameRef.current);
      }

      const response = await fetch(`/api/posts/infinite?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'データの取得に失敗しました');
      }

      const data = await response.json();

      if (isPolling && data.posts.length > 0 && lastPostIdRef.current) {
        // ポーリング時：新着投稿をチェック
        const newPostIndex = data.posts.findIndex((p: Post) => p._id === lastPostIdRef.current);
        if (newPostIndex > 0) {
          // 新着投稿がある
          const newPostsToAdd = data.posts.slice(0, newPostIndex);
          setNewPosts((prev) => [...newPostsToAdd, ...prev]);
        }
      } else if (!isPolling) {
        // 通常の読み込み
        if (nextCursor) {
          // 追加読み込み：重複チェック付き
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p._id));
            const newPosts = data.posts.filter((p: Post) => !existingIds.has(p._id));
            return [...prev, ...newPosts];
          });
        } else {
          // 初回読み込みまたはリフレッシュ：重複投稿を除去
          const uniquePosts = data.posts.reduce((acc: Post[], post: Post) => {
            if (!acc.find((p) => p._id === post._id)) {
              acc.push(post);
            }
            return acc;
          }, []);
          setPosts(uniquePosts);

          if (uniquePosts.length > 0) {
            setLastPostId(uniquePosts[0]._id);
            lastPostIdRef.current = uniquePosts[0]._id;
          }
        }

        setHasNextPage(data.pagination.hasNextPage);

        if (data.pagination.totalCount !== null) {
          setTotalCount(data.pagination.totalCount);
        }

        if (data.pagination.nextCursor) {
          setCursor(data.pagination.nextCursor);
        } else if (!data.pagination.hasNextPage) {
          // 次のページがない場合はcursorをnullに設定
          setCursor(null);
        }

        // パフォーマンス測定終了
        if (!isPolling) {
          performanceMonitor.endMeasurement(
            nextCursor ? 'load-more' : 'initial-load',
            data.posts.length
          );
        }
      }
    } catch (err) {
      if (!isPolling) {
        const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
        setError(errorMessage);
        setLastError(errorMessage);
        setRetryCount((prev) => prev + 1);

        // ネットワークエラーの詳細分類
        if (errorMessage.includes('fetch')) {
          setError('ネットワーク接続エラーが発生しました');
        } else if (errorMessage.includes('500')) {
          setError('サーバーエラーが発生しました（500）');
        } else if (errorMessage.includes('404')) {
          setError('データが見つかりませんでした（404）');
        } else if (errorMessage.includes('timeout')) {
          setError('接続タイムアウトが発生しました');
        }
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
        setIsLoadingMore(false);
      }
      fetchingRef.current = false;
    }
  }, []); // 依存配列を空に（無限ループの根本解決）
  // サラ：「sortByは固定値なので依存配列に入れる必要なし」

  // fetchPostsをrefに保存して最新版を参照できるようにする
  // マイケル：「毎レンダーで直接更新、useEffectを完全に除外」
  fetchPostsRef.current = fetchPosts;

  // 追加読み込み - Phase 4強化版
  const loadMore = useCallback(async () => {
    if (!hasNextPage || loading || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      // ref経由で最新のfetchPostsを呼び出す
      await fetchPostsRef.current?.(cursor);
      // 成功時はリトライカウントをリセット
      if (retryCount > 0) {
        setRetryCount(0);
        setError(null);
        setLastError(null);
      }
    } catch {
      // fetchPosts内でエラーハンドリング済み
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasNextPage, loading, isLoadingMore, retryCount]);

  // リフレッシュ - Phase 4強化版（ソート変更時の状態完全リセット）
  const refresh = useCallback(async () => {
    // 全ての状態をリセット
    setCursor(null);
    setNewPosts([]);
    setError(null);
    setLastError(null);
    setRetryCount(0);
    setHasNextPage(true);
    setLastPostId(null);
    setPosts([]); // 既存投稿を一旦クリア

    try {
      // ref経由で最新のfetchPostsを呼び出す
      await fetchPostsRef.current?.(null);
    } catch {
      // fetchPosts内でエラーハンドリング済み
    }
  }, []);

  // 新着投稿を表示
  const showNewPosts = useCallback(() => {
    if (newPosts.length > 0) {
      setPosts((prev) => [...newPosts, ...prev]);
      setLastPostId(newPosts[0]._id);
      lastPostIdRef.current = newPosts[0]._id;
      setNewPosts([]);
    }
  }, [newPosts]);

  // 初回読み込み - Phase 5: 初期データがある場合はスキップ
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;

      // 初期データがない場合のみフェッチ
      if (initialData.length === 0) {
        // setTimeoutで次のtickで実行（fetchPostsが確実に定義された後）
        setTimeout(() => {
          fetchPostsRef.current?.(null);
        }, 0);
      } else {
        // 初期データの最初の投稿IDを保存（新着投稿チェック用）
        if (initialData.length > 0) {
          setLastPostId(initialData[0]._id);
          lastPostIdRef.current = initialData[0]._id;
        }
      }
    }
  }, [initialData]); // initialDataが変わった時のみ実行

  // sortBy変更時のリフレッシュを削除（無限ループの原因）
  // タカシ：「これが無限ループの元凶だ！」

  // ポーリング設定（新着投稿チェック）
  // デバッグ用に一時的に無効化
  useEffect(() => {
    // ポーリングを再有効化
    return; // 一時的に無効化
    // if (pollingInterval > 0 && lastPostId && !cursor) {
    //   // 初回読み込み後、かつ最上部にいる場合のみポーリング
    //   pollingRef.current = setInterval(() => {
    //     fetchPostsRef.current?.(null, true);
    //   }, pollingInterval);
    //
    //   return () => {
    //     if (pollingRef.current) {
    //       clearInterval(pollingRef.current);
    //     }
    //   };
    // }
  }, [pollingInterval, lastPostId, cursor]);

  return {
    posts,
    loading,
    error,
    hasNextPage,
    loadMore,
    refresh,
    newPostsCount: newPosts.length,
    showNewPosts,
    totalCount,
    shouldUseVirtualization,
    // Phase 4追加機能
    isLoadingMore,
    retryCount,
    lastError,
  };
}
