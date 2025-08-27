'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getWebSocketClient, WebSocketClient } from '@/lib/realtime/websocket-client';
import { TimelinePost } from './useTimeline';

// リアルタイム更新のイベント型
export interface RealtimeEvent {
  type: 'new-post' | 'post-updated' | 'post-deleted' | 'post-liked' | 'user-followed';
  data: any;
  timestamp: number;
}

// フック設定オプション
interface UseRealtimeUpdatesOptions {
  enabled?: boolean;
  autoConnect?: boolean;
  onNewPost?: (post: TimelinePost) => void;
  onPostUpdated?: (post: TimelinePost) => void;
  onPostDeleted?: (postId: string) => void;
  onPostLiked?: (data: { postId: string; userId: string; likes: number }) => void;
  onUserFollowed?: (data: { followerId: string; followingId: string }) => void;
  debug?: boolean;
}

// フック戻り値型
interface UseRealtimeUpdatesReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  eventCount: number;
  lastEvent: RealtimeEvent | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (type: string, data?: any) => boolean;
  clearEventHistory: () => void;
}

export function useRealtimeUpdates(
  options: UseRealtimeUpdatesOptions = {}
): UseRealtimeUpdatesReturn {
  const {
    enabled = true,
    autoConnect = true,
    onNewPost,
    onPostUpdated,
    onPostDeleted,
    onPostLiked,
    onUserFollowed,
    debug = false
  } = options;

  const { data: session, status } = useSession();
  const clientRef = useRef<WebSocketClient | null>(null);
  
  // 状態管理
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'connecting'>('disconnected');
  const [eventCount, setEventCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  // デバッグログ
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[useRealtimeUpdates]', ...args);
    }
  }, [debug]);

  // WebSocketクライアント初期化
  const initializeClient = useCallback(() => {
    if (!enabled || clientRef.current) return;

    log('WebSocketクライアントを初期化します');
    
    clientRef.current = getWebSocketClient({
      debug: debug,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000
    });

    // イベントリスナー設定
    const client = clientRef.current;

    // 接続状態イベント
    client.on('connection-status', (status) => {
      log('接続状態変更:', status);
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
      setIsConnecting(status === 'connecting');
    });

    // エラーイベント
    client.on('error', (error) => {
      log('WebSocketエラー:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      setIsConnecting(false);
    });

    // 新規投稿イベント
    client.on('new-post', (post) => {
      log('新規投稿受信:', post);
      const event: RealtimeEvent = {
        type: 'new-post',
        data: post,
        timestamp: Date.now()
      };
      setLastEvent(event);
      setEventCount(prev => prev + 1);
      onNewPost?.(post);
    });

    // 投稿更新イベント
    client.on('post-updated', (post) => {
      log('投稿更新受信:', post);
      const event: RealtimeEvent = {
        type: 'post-updated',
        data: post,
        timestamp: Date.now()
      };
      setLastEvent(event);
      setEventCount(prev => prev + 1);
      onPostUpdated?.(post);
    });

    // 投稿削除イベント
    client.on('post-deleted', (postId) => {
      log('投稿削除受信:', postId);
      const event: RealtimeEvent = {
        type: 'post-deleted',
        data: postId,
        timestamp: Date.now()
      };
      setLastEvent(event);
      setEventCount(prev => prev + 1);
      onPostDeleted?.(postId);
    });

    // いいねイベント
    client.on('post-liked', (data) => {
      log('いいね受信:', data);
      const event: RealtimeEvent = {
        type: 'post-liked',
        data,
        timestamp: Date.now()
      };
      setLastEvent(event);
      setEventCount(prev => prev + 1);
      onPostLiked?.(data);
    });

    // フォローイベント
    client.on('user-followed', (data) => {
      log('フォロー受信:', data);
      const event: RealtimeEvent = {
        type: 'user-followed',
        data,
        timestamp: Date.now()
      };
      setLastEvent(event);
      setEventCount(prev => prev + 1);
      onUserFollowed?.(data);
    });

  }, [enabled, debug, log, onNewPost, onPostUpdated, onPostDeleted, onPostLiked, onUserFollowed]);

  // 接続関数
  const connect = useCallback(() => {
    if (!enabled || !session?.user?.id) {
      log('接続条件が満たされていません');
      return;
    }

    if (!clientRef.current) {
      initializeClient();
    }

    if (clientRef.current && !clientRef.current.isConnected()) {
      log('WebSocket接続を開始します');
      setIsConnecting(true);
      setConnectionStatus('connecting');
      
      // 認証トークンと一緒に接続
      // TODO: JWTトークンまたはセッションIDを渡す
      clientRef.current.connect();
    }
  }, [enabled, session?.user?.id, initializeClient, log]);

  // 切断関数
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      log('WebSocket接続を切断します');
      clientRef.current.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
    }
  }, [log]);

  // メッセージ送信関数
  const sendMessage = useCallback((type: string, data?: any) => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      log('メッセージ送信失敗: 未接続');
      return false;
    }

    log('メッセージ送信:', { type, data });
    return clientRef.current.send(type, data);
  }, [log]);

  // イベント履歴クリア
  const clearEventHistory = useCallback(() => {
    setEventCount(0);
    setLastEvent(null);
    log('イベント履歴をクリアしました');
  }, [log]);

  // 自動接続
  useEffect(() => {
    if (enabled && autoConnect && status === 'authenticated') {
      connect();
    }

    return () => {
      if (clientRef.current) {
        disconnect();
      }
    };
  }, [enabled, autoConnect, status, connect, disconnect]);

  // ページの可視性による接続制御
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        log('ページが非表示になりました - 接続維持');
        // バックグラウンドでも接続を維持
      } else {
        log('ページが表示されました');
        if (!isConnected && session?.user?.id) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isConnected, session?.user?.id, connect, log]);

  // オンライン/オフライン状態による接続制御
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      log('オンラインになりました');
      if (session?.user?.id) {
        connect();
      }
    };

    const handleOffline = () => {
      log('オフラインになりました');
      disconnect();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, session?.user?.id, connect, disconnect, log]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    connectionStatus,
    eventCount,
    lastEvent,
    connect,
    disconnect,
    sendMessage,
    clearEventHistory
  };
}