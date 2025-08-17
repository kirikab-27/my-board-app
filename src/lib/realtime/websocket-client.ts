'use client';

import { EventEmitter } from 'events';

// WebSocketイベント型定義
export interface WebSocketEvents {
  'new-post': (post: any) => void;
  'post-updated': (post: any) => void;
  'post-deleted': (postId: string) => void;
  'post-liked': (data: { postId: string; userId: string; likes: number }) => void;
  'user-followed': (data: { followerId: string; followingId: string }) => void;
  'connection-status': (status: 'connected' | 'disconnected' | 'error') => void;
  'error': (error: Error) => void;
}

// WebSocketクライアント設定
interface WebSocketClientOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

// WebSocketクライアントクラス
export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private heartbeatInterval: number;
  private debug: boolean;
  
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private shouldReconnect = true;
  
  constructor(options: WebSocketClientOptions = {}) {
    super();
    
    const {
      url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/websocket`,
      reconnectInterval = 3000,
      maxReconnectAttempts = 10,
      heartbeatInterval = 30000,
      debug = false
    } = options;
    
    this.url = url;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.heartbeatInterval = heartbeatInterval;
    this.debug = debug;
  }

  // 接続開始
  connect(token?: string): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.log('WebSocket接続を開始します...');

    try {
      const wsUrl = token ? `${this.url}?token=${token}` : this.url;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
    } catch (error) {
      this.isConnecting = false;
      this.log('WebSocket接続エラー:', error);
      this.emit('error', error);
      this.scheduleReconnect();
    }
  }

  // 接続終了
  disconnect(): void {
    this.shouldReconnect = false;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    
    this.emit('connection-status', 'disconnected');
    this.log('WebSocket接続を終了しました');
  }

  // メッセージ送信
  send(type: string, data?: any): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.log('WebSocketが接続されていません');
      return false;
    }

    try {
      const message = JSON.stringify({ type, data, timestamp: Date.now() });
      this.ws.send(message);
      this.log('メッセージ送信:', { type, data });
      return true;
    } catch (error) {
      this.log('メッセージ送信エラー:', error);
      this.emit('error', error as Error);
      return false;
    }
  }

  // 接続状態確認
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // 接続ハンドラ
  private handleOpen(event: Event): void {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();
    
    this.log('WebSocket接続が確立されました');
    this.emit('connection-status', 'connected');
    
    // ハートビート開始
    this.startHeartbeat();
  }

  // メッセージハンドラ
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      const { type, data } = message;
      
      this.log('メッセージ受信:', { type, data });

      // ハートビート応答
      if (type === 'pong') {
        return;
      }

      // イベント別処理
      switch (type) {
        case 'new-post':
          this.emit('new-post', data);
          break;
        case 'post-updated':
          this.emit('post-updated', data);
          break;
        case 'post-deleted':
          this.emit('post-deleted', data.postId);
          break;
        case 'post-liked':
          this.emit('post-liked', data);
          break;
        case 'user-followed':
          this.emit('user-followed', data);
          break;
        default:
          this.log('未知のメッセージタイプ:', type);
      }
      
    } catch (error) {
      this.log('メッセージパースエラー:', error);
      this.emit('error', error as Error);
    }
  }

  // 切断ハンドラ
  private handleClose(event: CloseEvent): void {
    this.isConnecting = false;
    this.clearHeartbeat();
    
    this.log('WebSocket接続が切断されました:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });

    if (this.shouldReconnect) {
      this.emit('connection-status', 'disconnected');
      this.scheduleReconnect();
    }
  }

  // エラーハンドラ
  private handleError(event: Event): void {
    this.isConnecting = false;
    this.log('WebSocketエラー:', event);
    this.emit('connection-status', 'error');
    this.emit('error', new Error('WebSocket connection error'));
  }

  // 再接続スケジュール
  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('再接続試行を中止します');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.log(`${delay}ms後に再接続を試行します (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // ハートビート開始
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping');
      }
    }, this.heartbeatInterval);
  }

  // ハートビート停止
  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 再接続タイマークリア
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // 全タイマークリア
  private clearTimers(): void {
    this.clearHeartbeat();
    this.clearReconnectTimer();
  }

  // デバッグログ
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[WebSocketClient]', ...args);
    }
  }
}

// シングルトンインスタンス
let websocketClient: WebSocketClient | null = null;

// WebSocketクライアント取得
export function getWebSocketClient(options?: WebSocketClientOptions): WebSocketClient {
  if (!websocketClient) {
    websocketClient = new WebSocketClient({
      debug: process.env.NODE_ENV === 'development',
      ...options
    });
  }
  return websocketClient;
}

// WebSocketクライアント破棄
export function destroyWebSocketClient(): void {
  if (websocketClient) {
    websocketClient.disconnect();
    websocketClient = null;
  }
}