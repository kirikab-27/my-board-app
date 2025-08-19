'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { CssBaseline } from '@mui/material';
import { getTheme } from '@/theme/theme';

// テーマコンテキストの型定義
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  theme: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// カスタムフック
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function CustomThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // マウント後の初期化
  useEffect(() => {
    setMounted(true);
    
    // localStorage からテーマ設定を取得
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
    
    // システムテーマの検出
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setResolvedTheme(savedTheme === 'system' || !savedTheme ? systemTheme : (savedTheme as 'light' | 'dark'));
  }, []);

  // システムテーマ変更の監視
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme, mounted]);

  // テーマ変更時の処理
  useEffect(() => {
    if (!mounted) return;

    if (currentTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setResolvedTheme(systemTheme);
    } else {
      setResolvedTheme(currentTheme as 'light' | 'dark');
    }
    
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme, mounted]);

  const toggleTheme = () => {
    setCurrentTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(theme);
  };

  const themeContextValue: ThemeContextType = {
    isDark: resolvedTheme === 'dark',
    toggleTheme,
    setTheme,
    theme: currentTheme,
  };

  // マウント前は light テーマで表示（ハイドレーション対策）
  const muiTheme = getTheme(mounted ? resolvedTheme : 'light');

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <NextThemesProvider
        attribute="data-theme"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="theme"
        forcedTheme={!mounted ? 'light' : undefined}
      >
        <MUIThemeProvider theme={muiTheme}>
          <CssBaseline />
          <div suppressHydrationWarning>
            {children}
          </div>
        </MUIThemeProvider>
      </NextThemesProvider>
    </ThemeContext.Provider>
  );
}