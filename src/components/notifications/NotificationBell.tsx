'use client';

import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Popover, Box, Typography, Button, Divider, alpha } from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { NotificationList } from './NotificationList';
import Link from 'next/link';

interface NotificationBellProps {
  showPopover?: boolean;
  popoverMaxHeight?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  showPopover = true,
  popoverMaxHeight = 400,
}) => {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [loading, setLoading] = useState(false);

  // 未読通知数の取得
  const fetchUnreadCount = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=1&filter=unread');
      const data = await response.json();

      if (response.ok) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('未読通知数取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCount();
    }
  }, [session?.user?.id]);

  // 定期的な更新（30秒間隔）
  useEffect(() => {
    if (!session?.user?.id) return;

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // 通知を既読にする
  const markNotificationsAsRead = async () => {
    if (!session?.user?.id || unreadCount === 0) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_viewed', // ポップオーバーで表示された通知を既読に
        }),
      });

      if (response.ok) {
        setUnreadCount(0); // 未読カウントをリセット
      }
    } catch (error) {
      console.error('通知既読エラー:', error);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (showPopover) {
      setAnchorEl(event.currentTarget);
      // ポップオーバーを開いた時に未読通知を既読にする
      markNotificationsAsRead();
    } else {
      // ポップオーバーを表示しない場合は通知ページに遷移
      window.location.href = '/notifications';
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: any) => {
    // ポップオーバーを閉じてから遷移
    handleClose();

    // 通知のタイプに応じてページ遷移
    setTimeout(() => {
      if (notification.metadata?.postId) {
        window.location.href = `/board/${notification.metadata.postId}`;
      } else if (notification.metadata?.linkUrl) {
        window.location.href = notification.metadata.linkUrl;
      } else if (notification.type === 'follow' && notification.fromUserId) {
        window.location.href = `/users/${notification.fromUserId}`;
      }
    }, 100);
  };

  const open = Boolean(anchorEl);

  // ログインしていない場合は表示しない
  if (!session?.user?.id) {
    return null;
  }

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        disabled={loading}
        sx={{
          '&:hover': {
            backgroundColor: alpha('#fff', 0.1),
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          overlap="circular"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              height: 16,
              minWidth: 16,
            },
          }}
        >
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      {showPopover && (
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              width: 400,
              maxWidth: '90vw',
              maxHeight: 500,
              overflow: 'hidden',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography variant="h6">
                通知
                {unreadCount > 0 && (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    ({unreadCount}件)
                  </Typography>
                )}
              </Typography>

              <Button component={Link} href="/notifications" size="small" onClick={handleClose}>
                すべて見る
              </Button>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ height: popoverMaxHeight, overflow: 'hidden' }}>
            <NotificationList
              onNotificationClick={handleNotificationClick}
              filterType="unread"
              showControls={false}
              maxHeight={popoverMaxHeight}
              onUnreadCountChange={(count) => setUnreadCount(count)}
            />
          </Box>

          {unreadCount === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                新しい通知はありません
              </Typography>
            </Box>
          )}
        </Popover>
      )}
    </>
  );
};

export default NotificationBell;
