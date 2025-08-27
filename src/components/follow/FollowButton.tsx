'use client';

import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { PersonAdd, PersonRemove, Schedule, Block } from '@mui/icons-material';
import { useSession } from 'next-auth/react';

interface FollowButtonProps {
  targetUserId: string;
  targetUserName?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'contained' | 'outlined' | 'text';
  fullWidth?: boolean;
  onFollowChange?: (isFollowing: boolean, isPending: boolean) => void;
}

interface FollowState {
  isFollowing: boolean;
  isPending: boolean;
  isLoading: boolean;
}

export default function FollowButton({
  targetUserId,
  targetUserName = 'ユーザー',
  size = 'medium',
  variant = 'contained',
  fullWidth = false,
  onFollowChange
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [followState, setFollowState] = useState<FollowState>({
    isFollowing: false,
    isPending: false,
    isLoading: false
  });

  // 自分自身かどうかチェック
  const isSelf = session?.user?.id === targetUserId;

  // フォロー状態を取得
  const fetchFollowStatus = async () => {
    if (!session?.user?.id || isSelf) return;

    try {
      const response = await fetch(`/api/follow?targetUserId=${targetUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowState(prev => ({
          ...prev,
          isFollowing: data.isFollowing,
          isPending: data.isPending
        }));
      }
    } catch (error) {
      console.error('フォロー状態の取得に失敗しました:', error);
    }
  };

  // フォロー/アンフォロー実行
  const handleFollowToggle = async () => {
    if (!session?.user?.id || isSelf) return;

    setFollowState(prev => ({ ...prev, isLoading: true }));

    try {
      if (followState.isFollowing || followState.isPending) {
        // フォロー解除
        const response = await fetch(`/api/follow?targetUserId=${targetUserId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setFollowState({
            isFollowing: false,
            isPending: false,
            isLoading: false
          });
          onFollowChange?.(false, false);
        } else {
          throw new Error('フォロー解除に失敗しました');
        }
      } else {
        // フォロー実行
        const response = await fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetUserId }),
        });

        if (response.ok) {
          const data = await response.json();
          const newState = {
            isFollowing: data.follow?.isAccepted || false,
            isPending: data.follow?.isPending || false,
            isLoading: false
          };
          setFollowState(newState);
          onFollowChange?.(newState.isFollowing, newState.isPending);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'フォローに失敗しました');
        }
      }
    } catch (error) {
      console.error('フォロー処理エラー:', error);
      setFollowState(prev => ({ ...prev, isLoading: false }));
      // TODO: エラートーストを表示
    }
  };

  // 初回ロード時にフォロー状態を取得
  useEffect(() => {
    fetchFollowStatus();
  }, [session?.user?.id, targetUserId]);

  // 自分自身の場合は表示しない
  if (isSelf) {
    return null;
  }

  // 未認証の場合
  if (!session?.user?.id) {
    return (
      <Button
        size={size}
        variant="outlined"
        fullWidth={fullWidth}
        disabled
        startIcon={<PersonAdd />}
      >
        ログインしてフォロー
      </Button>
    );
  }

  // ボタンの状態に応じた設定
  const getButtonConfig = () => {
    if (followState.isLoading) {
      return {
        text: '処理中...',
        icon: <CircularProgress size={16} />,
        color: 'primary' as const,
        disabled: true
      };
    }

    if (followState.isPending) {
      return {
        text: 'リクエスト中',
        icon: <Schedule />,
        color: 'warning' as const,
        disabled: false,
        tooltip: 'クリックでリクエストを取り消します'
      };
    }

    if (followState.isFollowing) {
      return {
        text: 'フォロー中',
        icon: <PersonRemove />,
        color: 'success' as const,
        disabled: false,
        tooltip: `${targetUserName}さんのフォローを解除`
      };
    }

    return {
      text: 'フォロー',
      icon: <PersonAdd />,
      color: 'primary' as const,
      disabled: false,
      tooltip: `${targetUserName}さんをフォロー`
    };
  };

  const config = getButtonConfig();

  const button = (
    <Button
      size={size}
      variant={variant}
      color={config.color}
      fullWidth={fullWidth}
      disabled={config.disabled}
      startIcon={config.icon}
      onClick={handleFollowToggle}
      sx={{
        minWidth: fullWidth ? 'auto' : '120px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: followState.isLoading ? 'none' : 'translateY(-1px)',
        }
      }}
    >
      {config.text}
    </Button>
  );

  // ツールチップ付きで返す
  if (config.tooltip) {
    return (
      <Tooltip title={config.tooltip} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
}