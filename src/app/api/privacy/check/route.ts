import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import PrivacySetting, { IPrivacySetting } from '@/models/PrivacySetting';
import Block, { IBlock } from '@/models/Block';
import Follow from '@/models/Follow';
import User from '@/models/User';

// Block型定義拡張
interface BlockModelType extends mongoose.Model<IBlock> {
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
  isMutuallyBlocked(userId1: string, userId2: string): Promise<boolean>;
}

// PrivacySetting型定義拡張
interface PrivacySettingModelType extends mongoose.Model<IPrivacySetting> {
  createDefault(userId: string): Promise<IPrivacySetting>;
}

// プライバシーチェック API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;

    await connectDB();

    const body = await request.json();
    const { targetUserId, field, action } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: '対象ユーザーIDが必要です' }, { status: 400 });
    }

    // 対象ユーザーの存在確認
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 本人の場合は全てアクセス可能
    if (viewerId === targetUserId) {
      return NextResponse.json({
        success: true,
        canAccess: true,
        reason: 'owner',
      });
    }

    // ブロック関係チェック
    if (viewerId) {
      const isBlocked = await (Block as unknown as BlockModelType).isMutuallyBlocked(viewerId, targetUserId);
      if (isBlocked) {
        return NextResponse.json({
          success: true,
          canAccess: false,
          reason: 'blocked',
        });
      }
    }

    // プライバシー設定取得
    let privacySettings = await PrivacySetting.findOne({ userId: targetUserId });
    if (!privacySettings) {
      privacySettings = await (PrivacySetting as unknown as PrivacySettingModelType).createDefault(targetUserId);
    }

    // フォロー関係チェック
    const isFollower = viewerId ? await Follow.findOne({
      follower: viewerId,
      following: targetUserId
    }) : null;

    // プライバシーチェック実行
    let canAccess = false;
    let reason = 'privacy_restricted';

    if (field) {
      // 特定フィールドのアクセス権限チェック
      canAccess = privacySettings.canView(
        field,
        viewerId,
        !!isFollower,
        false
      );
    } else if (action) {
      // アクション権限チェック
      canAccess = await checkActionPermission(
        privacySettings,
        action,
        viewerId,
        !!isFollower
      );
    } else {
      // 全般的なプロフィールアクセス権限
      const profileVisibility = privacySettings.profile.basicInfo;
      switch (profileVisibility) {
        case 'public':
          canAccess = true;
          reason = 'public';
          break;
        case 'followers':
          canAccess = !!isFollower;
          reason = isFollower ? 'follower' : 'not_follower';
          break;
        case 'private':
          canAccess = false;
          reason = 'private';
          break;
        default:
          canAccess = false;
      }
    }

    // 非公開アカウントの場合の追加チェック
    if (privacySettings.account.isPrivate && !isFollower && viewerId !== targetUserId) {
      canAccess = false;
      reason = 'private_account';
    }

    return NextResponse.json({
      success: true,
      canAccess,
      reason,
      isFollower: !!isFollower,
      isPrivateAccount: privacySettings.account.isPrivate,
    });
  } catch (error) {
    console.error('プライバシーチェックエラー:', error);
    return NextResponse.json(
      { error: 'プライバシーチェックに失敗しました' },
      { status: 500 }
    );
  }
}

// アクション権限チェック補助関数
async function checkActionPermission(
  privacySettings: any,
  action: string,
  viewerId?: string,
  isFollower = false
): Promise<boolean> {
  switch (action) {
    case 'comment':
      return checkVisibilityLevel(privacySettings.posts.allowComments, viewerId, isFollower);
    case 'like':
      return checkVisibilityLevel(privacySettings.posts.allowLikes, viewerId, isFollower);
    case 'follow':
      return !privacySettings.account.isPrivate || privacySettings.account.requireFollowApproval;
    case 'message':
      // 将来のダイレクトメッセージ機能用
      return checkVisibilityLevel('followers', viewerId, isFollower);
    case 'tag':
      return checkVisibilityLevel(privacySettings.discovery.allowTagging, viewerId, isFollower);
    default:
      return false;
  }
}

// 可視性レベルチェック補助関数
function checkVisibilityLevel(
  level: string,
  viewerId?: string,
  isFollower = false
): boolean {
  switch (level) {
    case 'public':
      return true;
    case 'followers':
      return isFollower;
    case 'private':
      return false;
    default:
      return false;
  }
}