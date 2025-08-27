/**
 * Phase 7.2: WebSocket API エンドポイント（管理者限定・新着投稿通知のみ）
 * Issue #8 保守的アプローチに従った限定実装
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeWebSocketServer } from '@/lib/websocket/server';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket = res.socket as any;
  if (!socket?.server) {
    res.status(500).json({ error: 'Socket server not available' });
    return;
  }

  // Phase 7.2: 管理者限定WebSocketサーバー初期化
  try {
    const io = initializeWebSocketServer(res);
    
    res.status(200).json({
      success: true,
      message: 'Phase 7.2 WebSocketサーバー（管理者限定）が初期化されました',
      features: {
        adminOnly: true,
        notifications: ['new_post'],
        maxConnections: 10,
        fallbackSupport: true,
      },
    });
  } catch (error) {
    console.error('WebSocket初期化エラー:', error);
    res.status(500).json({
      error: 'WebSocketサーバーの初期化に失敗しました',
      fallback: 'ポーリングベースの通知が継続されます',
    });
  }
}

// Next.js API RouteでWebSocketを有効化
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};