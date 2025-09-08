/**
 * Phase 7.2: 管理者専用WebSocketクライアント
 * 新着投稿通知のリアルタイム受信（管理者のみ）
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { /* io, */ Socket } from 'socket.io-client';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Alert, 
  Snackbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { 
  NotificationsActive,
  SignalWifiOff,
  PostAdd
} from '@mui/icons-material';

interface WebSocketNotification {
  type: string;
  message: string;
  data: {
    postId: string;
    title?: string;
    content: string;
    authorName: string;
    createdAt: Date;
  };
  timestamp: string;
}

interface AdminWebSocketClientProps {
  onNewPost?: (notification: WebSocketNotification) => void;
}

export default function AdminWebSocketClient({ }: AdminWebSocketClientProps) {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [notifications] = useState<WebSocketNotification[]>([]);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [latestNotification] = useState<WebSocketNotification | null>(null);
  // const [connectedCount, setConnectedCount] = useState(0);

  // 管理者のみWebSocket接続を試行
  const connectWebSocket = useCallback(() => {
    if (status !== 'authenticated' || !session?.user || (session.user as any)?.role !== 'admin') {
      return;
    }

    // WebSocket機能を一時的に無効化（サーバー未実装のため）
    console.log('⚠️ WebSocket機能は現在無効化されています');
    // setConnectionStatus('disconnected'); // 削除: readonlyのため
    return;

    // 以下のコードは将来的にWebSocketサーバー実装時に有効化
    /*
    console.log('🚀 Phase 7.2: 管理者WebSocket接続試行中...');
    setConnectionStatus('connecting');

    // Socket.IO クライアント初期化
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || window.location.origin, {
      path: '/api/websocket',
      auth: {
        session: {
          user: {
            id: session.user.id,
            email: session.user.email,
            role: (session.user as any).role
          }
        }
      },
      timeout: 5000,
      retries: 3
    });

    // 接続成功
    socketInstance.on('connected', (data) => {
      console.log('✅ 管理者WebSocket接続成功:', data);
      setConnectionStatus('connected');
      setConnectedCount(data.connectedCount);
    });

    // 新着投稿通知受信
    socketInstance.on('new_post_notification', (notification: WebSocketNotification) => {
      console.log('📢 新着投稿通知受信:', notification);
      
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // 最新10件保持
      setLatestNotification(notification);
      setShowSnackbar(true);
      
      // 親コンポーネントへのコールバック
      if (onNewPost) {
        onNewPost(notification);
      }
    });

    // 認証エラー
    socketInstance.on('auth_error', (error) => {
      console.error('❌ WebSocket認証エラー:', error);
      setConnectionStatus('error');
    });

    // 接続制限エラー
    socketInstance.on('connection_limit', (error) => {
      console.error('❌ WebSocket接続制限:', error);
      setConnectionStatus('error');
    });

    // サーバーエラー
    socketInstance.on('server_error', (error) => {
      console.error('❌ WebSocketサーバーエラー:', error);
      setConnectionStatus('error');
    });

    // 切断
    socketInstance.on('disconnect', (reason) => {
      console.log('📡 WebSocket切断:', reason);
      setConnectionStatus('disconnected');
    });

    // 接続エラー
    socketInstance.on('connect_error', (error) => {
      console.error('❌ WebSocket接続エラー:', error);
      setConnectionStatus('error');
      
      // 3秒後にポーリングフォールバック
      setTimeout(() => {
        setConnectionStatus('disconnected');
        console.log('💡 WebSocketエラー - ポーリングベースで継続します');
      }, 3000);
    });

    // pong レスポンス（接続維持確認）
    socketInstance.on('pong', (data) => {
      console.log('🏓 WebSocket pong:', data.timestamp);
    });

    setSocket(socketInstance);
    */
  }, [session, status]);

  // セッション確立後にWebSocket接続開始
  useEffect(() => {
    if (status === 'authenticated' && session?.user && (session.user as any)?.role === 'admin') {
      connectWebSocket();
    }

    return () => {
      if (socket) {
        console.log('🔌 WebSocket切断中...');
        socket.disconnect();
        setSocket(null);
        // setConnectionStatus('disconnected'); // 削除: readonlyのため
      }
    };
  }, [session, status, connectWebSocket]);

  // 管理者以外は表示しない
  if (status !== 'authenticated' || !session?.user || (session.user as any)?.role !== 'admin') {
    return null;
  }

  // 接続状態インジケーター（未使用）
  /* const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <SignalWifi4Bar />;
      case 'connecting': return <FiberManualRecord sx={{ animation: 'pulse 1s infinite' }} />;
      case 'error': return <SignalWifiOff />;
      default: return <SignalWifiOff />;
    }
  }; */

  return (
    <Box>
      {/* WebSocket接続状態 */}
      <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton size="small" sx={{ mr: 1 }}>
              <SignalWifiOff />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              リアルタイム通知（現在無効）
            </Typography>
            <Chip 
              label="無効化" 
              color="default"
              size="small"
            />
          </Box>
          
          <Alert severity="info" sx={{ mt: 1 }}>
            ℹ️ WebSocket機能は現在メンテナンス中です。通知機能は通常のポーリングで動作します。
          </Alert>
        </CardContent>
      </Card>

      {/* 最新通知一覧 */}
      {notifications.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              リアルタイム新着投稿 ({notifications.length})
            </Typography>
            <List dense>
              {notifications.map((notification, index) => (
                <React.Fragment key={`${notification.timestamp}-${index}`}>
                  <ListItem>
                    <ListItemIcon>
                      <PostAdd color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.data.title || '無題'}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {notification.data.authorName}さん
                          </Typography>
                          {" — " + notification.data.content.substring(0, 50) + (notification.data.content.length > 50 ? '...' : '')}
                          <br />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {new Date(notification.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* スナックバー通知 */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity="info" 
          onClose={() => setShowSnackbar(false)}
          icon={<NotificationsActive />}
        >
          <Typography variant="subtitle2">
            新着投稿: {latestNotification?.data.authorName}さん
          </Typography>
          <Typography variant="body2">
            {latestNotification?.data.title || latestNotification?.data.content.substring(0, 30) + '...'}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
}