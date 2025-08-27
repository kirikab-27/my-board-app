import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import PrivacySetting, { IPrivacySetting } from '@/models/PrivacySetting';
import User from '@/models/User';

// PrivacySetting型定義拡張
interface PrivacySettingModelType extends mongoose.Model<IPrivacySetting> {
  createDefault(userId: string): Promise<IPrivacySetting>;
}

// プライバシー設定取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    // 既存のプライバシー設定を取得、なければデフォルト作成
    let privacySettings = await PrivacySetting.findOne({ userId: session.user.id });
    if (!privacySettings) {
      privacySettings = await (PrivacySetting as unknown as PrivacySettingModelType).createDefault(session.user.id);
    }

    return NextResponse.json({
      success: true,
      settings: privacySettings,
    });
  } catch (error) {
    console.error('プライバシー設定取得エラー:', error);
    return NextResponse.json(
      { error: 'プライバシー設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// プライバシー設定更新
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: '設定データが必要です' }, { status: 400 });
    }

    // 既存設定を更新、なければ作成
    let privacySettings = await PrivacySetting.findOne({ userId: session.user.id });
    if (!privacySettings) {
      privacySettings = new PrivacySetting({ userId: session.user.id });
    }

    // 設定を更新
    if (settings.account) {
      privacySettings.account = { ...privacySettings.account, ...settings.account };
    }
    if (settings.profile) {
      privacySettings.profile = { ...privacySettings.profile, ...settings.profile };
    }
    if (settings.followers) {
      privacySettings.followers = { ...privacySettings.followers, ...settings.followers };
    }
    if (settings.posts) {
      privacySettings.posts = { ...privacySettings.posts, ...settings.posts };
    }
    if (settings.notifications) {
      privacySettings.notifications = { ...privacySettings.notifications, ...settings.notifications };
    }
    if (settings.discovery) {
      privacySettings.discovery = { ...privacySettings.discovery, ...settings.discovery };
    }
    if (settings.activity) {
      privacySettings.activity = { ...privacySettings.activity, ...settings.activity };
    }

    await privacySettings.save();

    // ユーザーモデルのisPrivateも更新
    if (settings.account?.isPrivate !== undefined) {
      await User.findByIdAndUpdate(
        session.user.id,
        { isPrivate: settings.account.isPrivate },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'プライバシー設定を更新しました',
      settings: privacySettings,
    });
  } catch (error) {
    console.error('プライバシー設定更新エラー:', error);
    return NextResponse.json(
      { error: 'プライバシー設定の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// プライバシー設定リセット（デフォルトに戻す）
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await connectDB();

    // 既存設定を削除
    await PrivacySetting.findOneAndDelete({ userId: session.user.id });

    // デフォルト設定を作成
    const defaultSettings = await (PrivacySetting as unknown as PrivacySettingModelType).createDefault(session.user.id);

    // ユーザーモデルのisPrivateもリセット
    await User.findByIdAndUpdate(
      session.user.id,
      { isPrivate: false },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'プライバシー設定をリセットしました',
      settings: defaultSettings,
    });
  } catch (error) {
    console.error('プライバシー設定リセットエラー:', error);
    return NextResponse.json(
      { error: 'プライバシー設定のリセットに失敗しました' },
      { status: 500 }
    );
  }
}