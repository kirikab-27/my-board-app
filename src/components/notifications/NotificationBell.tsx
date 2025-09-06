'use client';

import React, { useState } from 'react';
import { Badge, IconButton, Popover, Box, Typography, Button } from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
} from '@mui/icons-material';

interface NotificationBellProps {
  showPopover?: boolean;
  popoverMaxHeight?: number;
}

/**
 * シンプル通知ベルコンポーネント（緊急修正版）
 * セッション依存除去・構文エラー解消・安定表示
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  showPopover = true,
  popoverMaxHeight = 400,
}) => {
  const [unreadCount, setUnreadCount] = useState(0); // 正常値（空の通知なし）
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (showPopover) {
      setAnchorEl(event.currentTarget);
      // 通知ポップオーバーを開く（カウント操作なし）
    } else {
      // 通知ページに遷移
      window.location.href = '/notifications';
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-describedby={open ? 'notification-popover' : undefined}
        title={`通知 (${unreadCount}件の未読)`}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      {showPopover && (
        <Popover
          id="notification-popover"
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
          sx={{
            '& .MuiPopover-paper': {
              mt: 1,
              minWidth: 320,
              maxWidth: 400,
              maxHeight: popoverMaxHeight,
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                通知 ({unreadCount})
              </Typography>
              {unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllRead}>
                  全て既読
                </Button>
              )}
            </Box>
            
            {unreadCount > 0 ? (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {unreadCount}件の未読通知があります
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => window.location.href = '/notifications'}
                >
                  全ての通知を見る
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                新しい通知はありません
              </Typography>
            )}
          </Box>
        </Popover>
      )}
    </>
  );
};

export default NotificationBell;