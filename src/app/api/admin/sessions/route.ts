/**
 * セッション管理API
 * Issue #54: セキュアセッション管理システム
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { SessionManager } from '@/lib/auth/sessionManager';

// GET: ユーザーのセッション一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const sessions = await SessionManager.getUserSessions(userId);

    // セッション情報の整形
    const formattedSessions = sessions.map(s => ({
      id: s._id,
      deviceInfo: {
        browser: s.deviceInfo.browser,
        os: s.deviceInfo.os,
        deviceType: s.deviceInfo.deviceType,
        ipAddress: s.deviceInfo.ipAddress,
      },
      lastActivity: s.lastActivity,
      expiresAt: s.expiresAt,
      isActive: s.isActive,
      twoFactorVerified: s.twoFactorVerified,
      location: s.loginLocation,
      isCurrent: false, // TODO: 現在のセッションを識別
      securityFlags: s.securityFlags,
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      count: formattedSessions.length,
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      { error: 'セッション情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: セッションの無効化
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { sessionId, all } = await request.json();
    const userId = (session.user as any).id;

    if (all) {
      // すべてのセッションを無効化
      const count = await SessionManager.invalidateAllUserSessions(
        userId,
        'User requested logout from all devices'
      );
      
      return NextResponse.json({
        success: true,
        message: `${count}個のセッションを無効化しました`,
        invalidatedCount: count,
      });
    } else if (sessionId) {
      // 特定のセッションを無効化
      const success = await SessionManager.invalidateDeviceSession(
        userId,
        sessionId,
        'User requested device logout'
      );
      
      if (!success) {
        return NextResponse.json(
          { error: 'セッションが見つかりません' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'セッションを無効化しました',
      });
    } else {
      return NextResponse.json(
        { error: 'セッションIDが必要です' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Session invalidation error:', error);
    return NextResponse.json(
      { error: 'セッションの無効化に失敗しました' },
      { status: 500 }
    );
  }
}