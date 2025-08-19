'use client';

import React from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  useTheme as useMUITheme,
} from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  SettingsBrightness as SystemIcon,
} from '@mui/icons-material';
import { useTheme } from '@/providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();
  const muiTheme = useMUITheme();

  // テーマアイコンの取得
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <LightModeIcon />;
      case 'dark':
        return <DarkModeIcon />;
      case 'system':
        return <SystemIcon />;
      default:
        return <LightModeIcon />;
    }
  };

  // ツールチップテキストの取得
  const getTooltipText = () => {
    switch (theme) {
      case 'light':
        return 'ライトモード → ダークモード';
      case 'dark':
        return 'ダークモード → システム設定';
      case 'system':
        return 'システム設定 → ライトモード';
      default:
        return 'テーマ切り替え';
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={getTooltipText()} arrow>
        <IconButton
          onClick={toggleTheme}
          color="inherit"
          sx={{
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
              transform: 'rotate(180deg)',
            },
            '& .MuiSvgIcon-root': {
              transition: 'all 0.3s ease-in-out',
            },
          }}
          aria-label="テーマ切り替え"
        >
          {getThemeIcon()}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default ThemeToggle;