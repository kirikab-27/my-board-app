import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';

// メンション通知API
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      mentionedUsernames, 
      postId, 
      commentId, 
      content, 
      type = 'mention' // 'mention_post' | 'mention_comment'
    } = body;

    // 入力バリデーション
    if (!mentionedUsernames || !Array.isArray(mentionedUsernames) || mentionedUsernames.length === 0) {
      return NextResponse.json(
        { error: 'mentionedUsernamesが必要です' },
        { status: 400 }
      );
    }

    if (!postId && !commentId) {
      return NextResponse.json(
        { error: 'postIdまたはcommentIdが必要です' },
        { status: 400 }
      );
    }

    // データベース接続
    await dbConnect();

    // メンションされたユーザーを取得
    const mentionedUsers = await User.find({
      username: { $in: mentionedUsernames }
    })
    .select('_id username name')
    .lean();

    if (mentionedUsers.length === 0) {
      return NextResponse.json({
        message: 'メンションユーザーが見つかりませんでした',
        notificationsSent: 0
      });
    }

    // 通知作成
    const notifications = [];
    for (const mentionedUser of mentionedUsers) {
      // 自分自身をメンションした場合はスキップ
      if (mentionedUser._id?.toString() === session.user.id) {
        continue;
      }

      // 通知メッセージ生成
      let notificationMessage = '';
      let notificationType = 'mention';
      
      if (commentId) {
        notificationMessage = `${session.user.name}さんがコメントであなたをメンションしました`;
        notificationType = 'mention_comment';
      } else {
        notificationMessage = `${session.user.name}さんが投稿であなたをメンションしました`;
        notificationType = 'mention_post';
      }

      // コンテンツプレビュー（最初の50文字）
      const contentPreview = content 
        ? content.substring(0, 50) + (content.length > 50 ? '...' : '')
        : '';

      const notification = {
        userId: mentionedUser._id,
        type: notificationType,
        message: notificationMessage,
        data: {
          fromUserId: session.user.id,
          fromUserName: session.user.name,
          mentionedUsername: (mentionedUser as any).username,
          postId: postId || null,
          commentId: commentId || null,
          contentPreview: contentPreview,
          originalContent: content
        },
        isRead: false,
        priority: 'normal',
        category: 'mention',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
      };

      notifications.push(notification);
    }

    // 通知を一括作成
    let createdNotifications: any[] = [];
    if (notifications.length > 0) {
      createdNotifications = await Notification.insertMany(notifications);
    }

    return NextResponse.json({
      message: `${notifications.length}件のメンション通知を送信しました`,
      notificationsSent: notifications.length,
      mentionedUsers: mentionedUsers.map(user => ({
        _id: user._id?.toString(),
        username: (user as any).username,
        name: (user as any).name
      })),
      notifications: createdNotifications.map(n => ({
        _id: n._id.toString(),
        userId: n.userId.toString(),
        type: n.type,
        message: n.message
      }))
    });

  } catch (error) {
    console.error('Mention notification error:', error);
    return NextResponse.json(
      { error: 'メンション通知の送信中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}