'use client';

import React from 'react';
import {
  Alert,
  Button,
  Box,
  Typography,
  Chip,
  Slide,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  KeyboardArrowUp,
  Close as CloseIcon
} from '@mui/icons-material';

interface NewPostsBannerProps {
  newPostsCount: number;
  visible: boolean;
  onLoadNewPosts: () => void;
  onDismiss?: () => void;
  position?: 'fixed' | 'sticky' | 'relative';
  animated?: boolean;
}

export default function NewPostsBanner({
  newPostsCount,
  visible,
  onLoadNewPosts,
  onDismiss,
  position = 'sticky',
  animated = true
}: NewPostsBannerProps) {
  const theme = useTheme();

  if (!visible || newPostsCount <= 0) {
    return null;
  }

  const bannerContent = (
    <Alert
      severity="info"
      sx={{
        mb: position === 'relative' ? 2 : 0,
        cursor: 'pointer',
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
        border: `1px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
        boxShadow: theme.shadows[4],
        '&:hover': {
          backgroundColor: theme.palette.primary.main,
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out'
        },
        ...(position === 'fixed' && {
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          minWidth: '300px',
          maxWidth: '90vw'
        }),
        ...(position === 'sticky' && {
          position: 'sticky',
          top: 0,
          zIndex: 100
        })
      }}
      onClick={onLoadNewPosts}
      action={
        <Box display="flex" alignItems="center" gap={1}>
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onLoadNewPosts();
            }}
            sx={{
              color: 'inherit',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            読み込む
          </Button>
          
          {onDismiss && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              sx={{
                color: 'inherit',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      }
    >
      <Box display="flex" alignItems="center" gap={2}>
        <KeyboardArrowUp sx={{ fontSize: 20 }} />
        
        <Box>
          <Typography variant="body1" fontWeight="bold">
            新しい投稿があります
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Chip
              label={`${newPostsCount}件`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'inherit',
                fontWeight: 'bold'
              }}
            />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              クリックして更新
            </Typography>
          </Box>
        </Box>
      </Box>
    </Alert>
  );

  if (animated) {
    return (
      <Slide direction="down" in={visible} mountOnEnter unmountOnExit>
        <div>{bannerContent}</div>
      </Slide>
    );
  }

  return bannerContent;
}

// プルトゥリフレッシュインジケーター
interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
  pullProgress: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  threshold,
  isRefreshing,
  pullProgress
}: PullToRefreshIndicatorProps) {
  const theme = useTheme();

  if (pullDistance <= 0 && !isRefreshing) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: Math.min(pullDistance, 80),
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 1200,
        transform: `translateY(${Math.min(pullDistance - 80, 0)}px)`,
        transition: isRefreshing ? 'transform 0.2s ease-out' : 'none'
      }}
    >
      <Box textAlign="center">
        {isRefreshing ? (
          <>
            <RefreshIcon
              sx={{
                animation: 'spin 1s linear infinite',
                fontSize: 24,
                color: theme.palette.primary.main,
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)'
                  },
                  '100%': {
                    transform: 'rotate(360deg)'
                  }
                }
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              更新中...
            </Typography>
          </>
        ) : (
          <>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: `2px solid ${theme.palette.grey[300]}`,
                borderTop: `2px solid ${theme.palette.primary.main}`,
                transform: `rotate(${pullProgress * 360}deg)`,
                transition: 'transform 0.1s ease-out',
                mx: 'auto'
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {pullProgress >= 1 ? '離して更新' : 'プルして更新'}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}

// リアルタイム接続ステータス表示
interface ConnectionStatusProps {
  isOnline: boolean;
  lastUpdate?: string;
  isConnecting?: boolean;
}

export function ConnectionStatus({
  isOnline,
  lastUpdate,
  isConnecting = false
}: ConnectionStatusProps) {
  const theme = useTheme();

  if (isOnline && !isConnecting) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 1000,
        backgroundColor: isOnline 
          ? theme.palette.warning.main 
          : theme.palette.error.main,
        color: theme.palette.getContrastText(
          isOnline ? theme.palette.warning.main : theme.palette.error.main
        ),
        px: 2,
        py: 1,
        borderRadius: 2,
        boxShadow: theme.shadows[4],
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          animation: isConnecting ? 'pulse 1.5s ease-in-out infinite' : 'none',
          '@keyframes pulse': {
            '0%': {
              opacity: 1
            },
            '50%': {
              opacity: 0.5
            },
            '100%': {
              opacity: 1
            }
          }
        }}
      />
      
      <Typography variant="body2" fontWeight="bold">
        {isConnecting 
          ? '接続中...' 
          : isOnline 
            ? '接続中' 
            : 'オフライン'
        }
      </Typography>
      
      {lastUpdate && (
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          • 最終更新: {new Date(lastUpdate).toLocaleTimeString('ja-JP')}
        </Typography>
      )}
    </Box>
  );
}