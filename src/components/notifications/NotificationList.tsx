'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Skeleton,
  Pagination,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { NotificationItem } from './NotificationItem';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  fromUserName?: string;
  fromUserAvatar?: string;
  isRead: boolean;
  isViewed: boolean;
  createdAt: string;
  metadata?: any;
  isBatched?: boolean;
  batchInfo?: any;
}

interface NotificationListProps {
  onNotificationClick?: (notification: Notification) => void;
  filterType?: string;
  showControls?: boolean;
  maxHeight?: number;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  onNotificationClick,
  filterType = 'all',
  showControls = true,
  maxHeight = 600,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(filterType);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalCount: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        filter,
      });

      if (typeFilter) {
        params.append('type', typeFilter);
      }

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '通知の取得に失敗しました');
      }

      setNotifications(data.notifications);
      setPagination(data.pagination);
      setUnreadCount(data.unreadCount);
      setError(null);

      // 親コンポーネントに未読数の変更を通知
      if (onUnreadCountChange) {
        onUnreadCountChange(data.unreadCount);
      }
    } catch (error) {
      console.error('通知取得エラー:', error);
      setError(error instanceof Error ? error.message : '通知の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [page, filter, typeFilter, onUnreadCountChange]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    // 未読の場合は既読にマーク
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    // 外部のクリックハンドラーを呼び出し
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);

        // 親コンポーネントに未読数の変更を通知
        if (onUnreadCountChange) {
          onUnreadCountChange(newUnreadCount);
        }
      }
    } catch (error) {
      console.error('既読マークエラー:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);

        // 親コンポーネントに未読数の変更を通知
        if (onUnreadCountChange) {
          onUnreadCountChange(0);
        }
      }
    } catch (error) {
      console.error('一括既読エラー:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
        fetchNotifications(); // リフレッシュして統計を更新
      }
    } catch (error) {
      console.error('通知削除エラー:', error);
    }
  };

  const handleMenuClick = (notificationId: string, anchorEl: HTMLElement) => {
    setSelectedNotificationId(notificationId);
    setMenuAnchor(anchorEl);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNotificationId(null);
  };

  const selectedNotification = notifications.find((n) => n._id === selectedNotificationId);

  if (loading && notifications.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={80} />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー・コントロール */}
      {showControls && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack spacing={2}>
            {/* タイトルと統計 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                通知
                {unreadCount > 0 && (
                  <Chip label={unreadCount} size="small" color="error" sx={{ ml: 1 }} />
                )}
              </Typography>

              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchNotifications}
                disabled={loading}
                size="small"
              >
                更新
              </Button>
            </Box>

            {/* フィルター */}
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>既読状態</InputLabel>
                <Select
                  value={filter}
                  label="既読状態"
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="unread">未読のみ</MenuItem>
                  <MenuItem value="read">既読のみ</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>種類</InputLabel>
                <Select
                  value={typeFilter}
                  label="種類"
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value="follow">フォロー</MenuItem>
                  <MenuItem value="like_post">いいね</MenuItem>
                  <MenuItem value="comment">コメント</MenuItem>
                  <MenuItem value="system">システム</MenuItem>
                </Select>
              </FormControl>

              {unreadCount > 0 && (
                <Button
                  startIcon={<MarkReadIcon />}
                  onClick={handleMarkAllAsRead}
                  variant="outlined"
                  size="small"
                >
                  すべて既読
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      )}

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* 通知リスト */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          maxHeight: showControls ? undefined : maxHeight,
        }}
      >
        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              通知がありません
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              新しい通知があるとここに表示されます
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={handleNotificationClick}
                onMarkRead={handleMarkAsRead}
                onMenuClick={handleMenuClick}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* ページネーション */}
      {showControls && pagination.totalPages > 1 && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* コンテキストメニュー */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 },
        }}
      >
        {selectedNotification && !selectedNotification.isRead && (
          <MenuItem
            onClick={() => {
              handleMarkAsRead(selectedNotificationId!);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <MarkReadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>既読にする</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            handleDeleteNotification(selectedNotificationId!);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NotificationList;
