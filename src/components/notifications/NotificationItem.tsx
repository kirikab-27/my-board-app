'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Chip,
  Stack,
  Divider,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  PersonAdd as PersonAddIcon,
  Comment as CommentIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  EmojiEvents as MilestoneIcon,
  MoreVert as MoreVertIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
// import { formatDistanceToNow } from 'date-fns';
// import { ja } from 'date-fns/locale';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

export interface NotificationItemProps {
  notification: {
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
    metadata?: {
      postId?: string;
      commentId?: string;
      followId?: string;
      linkUrl?: string;
    };
    isBatched?: boolean;
    batchInfo?: {
      count: number;
      sampleUsers: string[];
    };
  };
  onClick?: (notification: any) => void;
  onMarkRead?: (notificationId: string) => void;
  onMenuClick?: (notificationId: string, anchorEl: HTMLElement) => void;
}

const getNotificationIcon = (type: string, priority: string) => {
  const iconProps = {
    fontSize: 'small' as const,
    color: (priority === 'urgent' ? 'error' : priority === 'high' ? 'warning' : 'primary') as 'error' | 'warning' | 'primary',
  };

  switch (type) {
    case 'follow':
    case 'follow_accept':
      return <PersonAddIcon {...iconProps} />;
    case 'like_post':
    case 'like_comment':
      return <FavoriteIcon {...iconProps} />;
    case 'comment':
    case 'reply':
    case 'mention_post':
    case 'mention_comment':
      return <CommentIcon {...iconProps} />;
    case 'security':
      return <SecurityIcon {...iconProps} />;
    case 'milestone':
      return <MilestoneIcon {...iconProps} />;
    default:
      return <NotificationsIcon {...iconProps} />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'normal':
      return 'primary';
    case 'low':
      return 'default';
    default:
      return 'primary';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onMarkRead,
  onMenuClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (onMenuClick) {
      onMenuClick(notification._id, event.currentTarget);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'たった今';
      if (diffMins < 60) return `${diffMins}分前`;
      if (diffHours < 24) return `${diffHours}時間前`;
      if (diffDays < 7) return `${diffDays}日前`;
      
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '不明';
    }
  };

  const isUrgent = notification.priority === 'urgent';
  const isHigh = notification.priority === 'high';

  return (
    <Card
      sx={{
        mb: 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: notification.isRead ? 1 : 2,
        borderColor: notification.isRead 
          ? 'divider' 
          : isUrgent 
            ? 'error.main' 
            : isHigh 
              ? 'warning.main' 
              : 'primary.main',
        backgroundColor: notification.isRead 
          ? 'background.paper' 
          : alpha('#1976d2', 0.02),
        '&:hover': {
          elevation: 3,
          backgroundColor: alpha('#1976d2', 0.04),
        },
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* アバターとアイコン */}
          <Box sx={{ position: 'relative' }}>
            {notification.fromUserName ? (
              notification.fromUserAvatar ? (
                <Avatar 
                  src={notification.fromUserAvatar}
                  sx={{ width: 40, height: 40 }}
                >
                  {notification.fromUserName.charAt(0).toUpperCase()}
                </Avatar>
              ) : (
                <ProfileAvatar 
                  name={notification.fromUserName} 
                  size="medium"
                />
              )
            ) : (
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: `${getPriorityColor(notification.priority)}.main` 
                }}
              >
                {getNotificationIcon(notification.type, notification.priority)}
              </Avatar>
            )}
            
            {/* 未読インジケーター */}
            {!notification.isRead && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  border: '2px solid white',
                }}
              />
            )}
          </Box>

          {/* 通知内容 */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack spacing={1}>
              {/* タイトルと時間 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: notification.isRead ? 'normal' : 'bold',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {notification.title}
                </Typography>
                
                {/* 優先度チップ */}
                {(isUrgent || isHigh) && (
                  <Chip
                    label={isUrgent ? '緊急' : '重要'}
                    size="small"
                    color={isUrgent ? 'error' : 'warning'}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
                
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(notification.createdAt)}
                </Typography>
              </Box>

              {/* メッセージ */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontWeight: notification.isRead ? 'normal' : 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {notification.message}
              </Typography>

              {/* バッチ情報 */}
              {notification.isBatched && notification.batchInfo && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`他 ${notification.batchInfo.count - 1}件`}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              )}
            </Stack>
          </Box>

          {/* メニューボタン */}
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ 
              opacity: 0.7,
              '&:hover': { opacity: 1 },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationItem;