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
  setTheme: (theme: 'light' | 'dark') => void;
  theme: 'light' | 'dark';
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
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // マウント後の初期化
  useEffect(() => {
    setMounted(true);
    
    // localStorage からテーマ設定を取得
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setCurrentTheme(savedTheme);
      setResolvedTheme(savedTheme);
    } else {
      // デフォルトはライトテーマ
      setCurrentTheme('light');
      setResolvedTheme('light');
    }
  }, []);

  // テーマ変更時の処理
  useEffect(() => {
    if (!mounted) return;
    
    setResolvedTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme, mounted]);

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (theme: 'light' | 'dark') => {
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
        enableSystem={false}
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