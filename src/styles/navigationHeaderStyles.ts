import { Theme } from '@mui/material/styles';

/**
 * 2段目ナビゲーションヘッダーのスタイル
 * Issue #38: ダークモード対応・テーマ適応型色設定
 */
export const getNavigationHeaderStyles = (theme: Theme) => ({
  minHeight: 48,
  borderTop: 1,
  borderColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.12)'  // ダークモード: 白の境界線
    : 'rgba(255, 255, 255, 0.12)',  // ライトモード: 白の境界線
  bgcolor: theme.palette.mode === 'dark' 
    ? 'grey.900'      // ダークモード: ダーク系背景
    : 'primary.main', // ライトモード: ブルー系背景（現在と同じ）
  color: theme.palette.mode === 'dark'
    ? 'common.white'    // ダークモード: 白文字
    : 'primary.contrastText', // ライトモード: primary対応文字色
});

/**
 * ダークモード対応のコントラスト比確保
 * アクセシビリティ要件：WCAG AA準拠（4.5:1以上）
 */
export const navigationHeaderColors = {
  light: {
    background: 'primary.main',      // ブルー系
    text: 'primary.contrastText',    // 白文字
    border: 'rgba(255, 255, 255, 0.12)'
  },
  dark: {
    background: 'grey.900',          // ダーク系
    text: 'common.white',            // 白文字
    border: 'rgba(255, 255, 255, 0.12)'
  }
} as const;