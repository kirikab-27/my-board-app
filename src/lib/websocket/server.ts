/**
 * Phase 7.2: WebSocketサーバー（管理者限定・新着投稿通知のみ）
 * Issue #8 保守的アプローチに従った限定実装
 */

import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import ConnectionMonitor from '@/utils/monitoring/connectionMonitor';

// WebSocketサーバーのグローバル状態管理
let io: Server | null = null;
const connectedAdmins = new Map<string, string>(); // socketId -> userId

/**
 * WebSocketサーバー初期化（管理者限定）
 */
export function initializeWebSocketServer(res: NextApiResponse) {
  const socket = res.socket as any;
  if (!socket?.server) {
    throw new Error('Socket server not available');
  }

  if (!io) {
    console.log('🚀 Phase 7.2: WebSocketサーバーを初期化中（管理者限定）...');
    
    io = new Server(socket.server, {
      path: '/api/websocket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3012',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // 接続制限（管理者限定・最大10接続）
      maxHttpBufferSize: 1e6, // 1MB
      pingTimeout: 60000,     // 60秒
      pingInterval: 25000,    // 25秒
    });

    const monitor = ConnectionMonitor.getInstance();

    io.on('connection', async (socket) => {
      console.log(`📡 WebSocket接続要求: ${socket.id}`);
      
      try {
        // 認証チェック（管理者のみ許可）
        const sessionData = socket.handshake.auth?.session;
        if (!sessionData) {
          console.log('❌ WebSocket認証失敗: セッション情報なし');
          socket.emit('auth_error', { message: '認証が必要です' });
          socket.disconnect();
          return;
        }

        // 管理者権限チェック
        if (sessionData.user?.role !== 'admin') {
          console.log(`❌ WebSocket認証失敗: 管理者権限なし (${sessionData.user?.email})`);
          socket.emit('auth_error', { message: '管理者権限が必要です' });
          socket.disconnect();
          return;
        }

        // 接続数制限チェック（管理者最大10名）
        if (connectedAdmins.size >= 10) {
          console.log('❌ WebSocket接続制限: 管理者接続数上限');
          socket.emit('connection_limit', { message: '接続数の上限に達しています' });
          socket.disconnect();
          return;
        }

        // 管理者接続を記録
        connectedAdmins.set(socket.id, sessionData.user.id);
        monitor.incrementActiveConnections();
        
        console.log(`✅ 管理者WebSocket接続成功: ${sessionData.user.email} (接続数: ${connectedAdmins.size}/10)`);
        
        // 接続成功通知
        socket.emit('connected', {
          message: 'WebSocket接続成功（管理者限定モード）',
          connectedCount: connectedAdmins.size,
          maxConnections: 10,
        });

        // 新着投稿通知のみ受信登録
        socket.join('admin-new-posts');

        // 切断処理
        socket.on('disconnect', (reason) => {
          console.log(`📡 WebSocket切断: ${socket.id} (理由: ${reason})`);
          connectedAdmins.delete(socket.id);
          monitor.decrementActiveConnections();
          console.log(`📊 管理者接続数: ${connectedAdmins.size}/10`);
        });

        // ピング・ポン（接続維持）
        socket.on('ping', () => {
          socket.emit('pong', { timestamp: new Date().toISOString() });
        });

      } catch (error) {
        console.error('WebSocket接続エラー:', error);
        socket.emit('server_error', { message: '接続処理中にエラーが発生しました' });
        socket.disconnect();
      }
    });

    console.log('✅ Phase 7.2 WebSocketサーバー初期化完了（管理者限定・新着投稿通知のみ）');
  }

  return io;
}

/**
 * 新着投稿通知を管理者に送信（Phase 7.2限定機能）
 */
export function broadcastNewPostToAdmins(postData: {
  _id: string;
  title?: string;
  content: string;
  authorName: string;
  createdAt: Date;
}) {
  try {
    // Phase 7.2: フォールバック機能強化
    if (!io) {
      console.log('📋 WebSocketサーバー未初期化 - ポーリングベース通知継続');
      return { success: false, fallback: 'polling', reason: 'server_not_initialized' };
    }

    if (connectedAdmins.size === 0) {
      console.log('📋 管理者接続なし - ポーリングベース通知継続');
      return { success: false, fallback: 'polling', reason: 'no_admin_connections' };
    }

    const notification = {
      type: 'new_post_notification',
      message: `${postData.authorName}さんが新しい投稿をしました`,
      data: {
        _id: postData._id,
        title: postData.title,
        content: postData.content.substring(0, 100),
        authorName: postData.authorName,
        createdAt: postData.createdAt,
      },
      timestamp: new Date().toISOString(),
    };

    // 管理者のみに配信
    io.to('admin-new-posts').emit('new_post_notification', notification);
    
    console.log(`📢 新着投稿通知を管理者に配信:`, {
      postId: postData._id,
      title: postData.title || '無題',
      author: postData.authorName,
      recipients: connectedAdmins.size
    });

    return { 
      success: true, 
      recipients: connectedAdmins.size,
      method: 'websocket'
    };

  } catch (error) {
    console.error('❌ WebSocket通知送信エラー:', error);
    console.log('💡 フォールバック: ポーリングベース通知継続');
    
    return { 
      success: false, 
      fallback: 'polling',
      reason: 'websocket_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * WebSocket接続状態を取得
 */
export function getWebSocketStatus() {
  return {
    isInitialized: !!io,
    connectedAdmins: connectedAdmins.size,
    maxConnections: 10,
    adminUserIds: Array.from(connectedAdmins.values()),
  };
}

/**
 * WebSocketサーバーをシャットダウン（緊急時・メンテナンス用）
 */
export function shutdownWebSocketServer() {
  if (io) {
    console.log('🔴 WebSocketサーバーをシャットダウン中...');
    io.emit('server_shutdown', { message: 'サーバーメンテナンスのため接続を切断します' });
    io.close();
    io = null;
    connectedAdmins.clear();
    console.log('✅ WebSocketサーバーシャットダウン完了');
  }
}

export { io };