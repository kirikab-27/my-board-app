'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Fade,
  Backdrop,
  useTheme,
  alpha
} from '@mui/material';
import type { BaseLoadingProps } from '@/types/loading';

/**
 * 基本ローディングコンポーネント
 */
export const BaseLoading: React.FC<BaseLoadingProps> = ({
  variant = 'circular',
  size = 'medium',
  color = 'primary',
  loading = true,
  text,
  sx,
  fullScreen = false,
  overlay = false,
  duration = 800,
  delay = 200
}) => {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  // 遅延表示の制御
  useEffect(() => {
    if (!loading) {
      setShow(false);
      return;
    }

    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [loading, delay]);

  if (!loading || !show) {
    return null;
  }

  // サイズの決定
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 20, height: 20 };
      case 'large':
        return { width: 60, height: 60 };
      default:
        return { width: 40, height: 40 };
    }
  };

  // ローディングコンテンツの描画
  const renderLoadingContent = () => {
    const sizeProps = getSize();

    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <LinearProgress color={color} sx={{ height: size === 'large' ? 6 : 4 }} />
            {text && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, textAlign: 'center' }}
              >
                {text}
              </Typography>
            )}
          </Box>
        );

      case 'dots':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: size === 'small' ? 6 : size === 'large' ? 12 : 8,
                  height: size === 'small' ? 6 : size === 'large' ? 12 : 8,
                  borderRadius: '50%',
                  bgcolor: `${color}.main`,
                  animation: `loading-dots ${duration}ms ease-in-out infinite`,
                  animationDelay: `${index * 200}ms`,
                  '@keyframes loading-dots': {
                    '0%, 80%, 100%': {
                      transform: 'scale(0)',
                      opacity: 0.5
                    },
                    '40%': {
                      transform: 'scale(1)',
                      opacity: 1
                    }
                  }
                }}
              />
            ))}
            {text && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 2 }}
              >
                {text}
              </Typography>
            )}
          </Box>
        );

      case 'pulse':
        return (
          <Box
            sx={{
              ...sizeProps,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette[color].main, 0.3),
              animation: `loading-pulse ${duration}ms ease-in-out infinite`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '@keyframes loading-pulse': {
                '0%': {
                  transform: 'scale(0.95)',
                  opacity: 1
                },
                '50%': {
                  transform: 'scale(1.05)',
                  opacity: 0.7
                },
                '100%': {
                  transform: 'scale(0.95)',
                  opacity: 1
                }
              }
            }}
          >
            <Box
              sx={{
                width: '60%',
                height: '60%',
                borderRadius: '50%',
                bgcolor: `${color}.main`
              }}
            />
          </Box>
        );

      case 'fade':
        return (
          <Fade in={true} timeout={duration}>
            <Box
              sx={{
                ...sizeProps,
                borderRadius: '50%',
                bgcolor: `${color}.main`,
                animation: `loading-fade ${duration * 2}ms ease-in-out infinite`,
                '@keyframes loading-fade': {
                  '0%, 100%': { opacity: 0.3 },
                  '50%': { opacity: 1 }
                }
              }}
            />
          </Fade>
        );

      default: // circular
        return (
          <CircularProgress
            color={color}
            size={sizeProps.width}
            thickness={size === 'small' ? 6 : 4}
          />
        );
    }
  };

  const loadingContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: text ? 2 : 0,
        ...sx
      }}
    >
      {renderLoadingContent()}
      {text && variant !== 'linear' && variant !== 'dots' && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', maxWidth: 300 }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Backdrop
        open={true}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          backdropFilter: 'blur(2px)',
          bgcolor: overlay ? alpha(theme.palette.background.default, 0.8) : 'transparent'
        }}
      >
        {loadingContent}
      </Backdrop>
    );
  }

  if (overlay) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.background.default, 0.7),
          backdropFilter: 'blur(1px)',
          zIndex: 1
        }}
      >
        {loadingContent}
      </Box>
    );
  }

  return loadingContent;
};