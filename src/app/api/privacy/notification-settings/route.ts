import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import NotificationSettings, { INotificationSettings, NotificationSenderRestriction, NotificationPriority } from '@/models/NotificationSettings';
import mongoose from 'mongoose';

interface NotificationSettingsModelType extends mongoose.Model<INotificationSettings> {
  createDefault(userId: string): Promise<INotificationSettings>;
  shouldFilterNotification(
    userId: string,
    senderId: string,
    content: string,
    notificationType: string,
    priority?: NotificationPriority
  ): Promise<boolean>;
}

// 通知設定取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await dbConnect();

    let settings = await NotificationSettings.findOne({ 
      userId: session.user.id 
    });

    // 設定が存在しない場合はデフォルト設定を作成
    if (!settings) {
      settings = await (NotificationSettings as unknown as NotificationSettingsModelType)
        .createDefault(session.user.id);
    }

    return NextResponse.json({
      settings,
      message: '通知設定を取得しました',
    });

  } catch (error) {
    console.error('通知設定取得エラー:', error);
    return NextResponse.json(
      { error: '通知設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 通知設定更新
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await req.json();
    const {
      senderRestriction,
      contentFilter,
      timeControl,
      prioritySettings,
      notificationTypes,
      globalSettings,
    } = body;

    // バリデーション
    if (senderRestriction && !['all', 'followers', 'verified', 'mutual'].includes(senderRestriction)) {
      return NextResponse.json({ error: '送信者制限の値が無効です' }, { status: 400 });
    }

    // 時間帯制御のバリデーション
    if (timeControl?.allowedTimeSlots) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      for (const slot of timeControl.allowedTimeSlots) {
        if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
          return NextResponse.json({ error: '時刻はHH:mm形式で入力してください' }, { status: 400 });
        }
      }
    }

    // キーワードフィルタのバリデーション
    if (contentFilter?.keywords) {
      if (contentFilter.keywords.length > 50) {
        return NextResponse.json({ error: 'フィルタキーワードは50個以内にしてください' }, { status: 400 });
      }
      for (const keyword of contentFilter.keywords) {
        if (typeof keyword !== 'string' || keyword.length > 100) {
          return NextResponse.json({ error: 'キーワードは100文字以内で入力してください' }, { status: 400 });
        }
      }
    }

    await dbConnect();

    // 既存設定取得または作成
    let settings = await NotificationSettings.findOne({ 
      userId: session.user.id 
    });

    if (!settings) {
      settings = await (NotificationSettings as unknown as NotificationSettingsModelType)
        .createDefault(session.user.id);
    }

    // 設定更新
    const updateData: any = {
      'stats.lastUpdated': new Date(),
    };

    if (senderRestriction !== undefined) {
      updateData.senderRestriction = senderRestriction;
    }

    if (contentFilter !== undefined) {
      updateData.contentFilter = {
        ...settings.contentFilter,
        ...contentFilter,
      };
    }

    if (timeControl !== undefined) {
      updateData.timeControl = {
        ...settings.timeControl,
        ...timeControl,
      };
    }

    if (prioritySettings !== undefined) {
      // Map形式への変換
      const priorityMap = new Map();
      Object.entries(prioritySettings).forEach(([key, value]) => {
        if (['low', 'normal', 'high'].includes(value as string)) {
          priorityMap.set(key, value);
        }
      });
      updateData.prioritySettings = priorityMap;
    }

    if (notificationTypes !== undefined) {
      updateData.notificationTypes = {
        ...settings.notificationTypes,
        ...notificationTypes,
      };
    }

    if (globalSettings !== undefined) {
      updateData.globalSettings = {
        ...settings.globalSettings,
        ...globalSettings,
      };
    }

    const updatedSettings = await NotificationSettings.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      settings: updatedSettings,
      message: '通知設定を更新しました',
    });

  } catch (error) {
    console.error('通知設定更新エラー:', error);
    return NextResponse.json(
      { error: '通知設定の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 通知設定リセット
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await dbConnect();

    // 既存設定を削除
    await NotificationSettings.findOneAndDelete({ 
      userId: session.user.id 
    });

    // デフォルト設定を作成
    const defaultSettings = await (NotificationSettings as unknown as NotificationSettingsModelType)
      .createDefault(session.user.id);

    return NextResponse.json({
      settings: defaultSettings,
      message: '通知設定をリセットしました',
    });

  } catch (error) {
    console.error('通知設定リセットエラー:', error);
    return NextResponse.json(
      { error: '通知設定のリセットに失敗しました' },
      { status: 500 }
    );
  }
}

// 通知フィルタテスト
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      senderId, 
      content, 
      notificationType = 'comment',
      priority = 'normal' 
    } = body;

    if (!senderId) {
      return NextResponse.json({ error: '送信者IDが必要です' }, { status: 400 });
    }

    await dbConnect();

    // フィルタテスト実行
    const shouldFilter = await (NotificationSettings as unknown as NotificationSettingsModelType)
      .shouldFilterNotification(
        session.user.id,
        senderId,
        content || '',
        notificationType,
        priority
      );

    // 設定詳細取得
    const settings = await NotificationSettings.findOne({ 
      userId: session.user.id 
    });

    return NextResponse.json({
      shouldFilter,
      result: shouldFilter ? 'filtered' : 'allowed',
      testData: {
        userId: session.user.id,
        senderId,
        content: content || '',
        notificationType,
        priority,
      },
      currentSettings: settings ? {
        senderRestriction: settings.senderRestriction,
        contentFilterEnabled: settings.contentFilter.enabled,
        timeControlEnabled: settings.timeControl.enabled,
        globalEnabled: settings.globalSettings.enabled,
      } : null,
    });

  } catch (error) {
    console.error('通知フィルタテストエラー:', error);
    return NextResponse.json(
      { error: '通知フィルタテストに失敗しました' },
      { status: 500 }
    );
  }
}