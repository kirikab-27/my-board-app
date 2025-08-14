'use client';

import type { Theme, Breakpoint } from '@mui/material/styles';
import type { SxProps } from '@mui/material';

/**
 * レスポンシブローディングユーティリティ
 */

/**
 * ブレークポイント別のローディング設定
 */
interface ResponsiveLoadingConfig {
  xs?: {
    size?: 'small' | 'medium' | 'large';
    variant?: 'circular' | 'linear' | 'dots' | 'pulse' | 'fade';
    text?: boolean;
    fullScreen?: boolean;
  };
  sm?: {
    size?: 'small' | 'medium' | 'large';
    variant?: 'circular' | 'linear' | 'dots' | 'pulse' | 'fade';
    text?: boolean;
    fullScreen?: boolean;
  };
  md?: {
    size?: 'small' | 'medium' | 'large';
    variant?: 'circular' | 'linear' | 'dots' | 'pulse' | 'fade';
    text?: boolean;
    fullScreen?: boolean;
  };
  lg?: {
    size?: 'small' | 'medium' | 'large';
    variant?: 'circular' | 'linear' | 'dots' | 'pulse' | 'fade';
    text?: boolean;
    fullScreen?: boolean;
  };
  xl?: {
    size?: 'small' | 'medium' | 'large';
    variant?: 'circular' | 'linear' | 'dots' | 'pulse' | 'fade';
    text?: boolean;
    fullScreen?: boolean;
  };
}

/**
 * ブレークポイント別のサイズマッピング
 */
const sizeMapping = {
  small: { width: 20, height: 20 },
  medium: { width: 40, height: 40 },
  large: { width: 60, height: 60 },
};

/**
 * レスポンシブローディングスタイルの生成
 */
export const createResponsiveLoadingStyle = (
  theme: Theme,
  config: ResponsiveLoadingConfig
): SxProps<Theme> => {
  const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

  return breakpoints.reduce((styles, breakpoint) => {
    const bpConfig = config[breakpoint];
    if (!bpConfig) return styles;

    const sizeStyles = bpConfig.size ? sizeMapping[bpConfig.size] : {};

    return {
      ...styles,
      [theme.breakpoints.up(breakpoint)]: {
        ...sizeStyles,
        ...(bpConfig.fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: theme.zIndex.modal + 1,
        }),
      },
    };
  }, {} as SxProps<Theme>);
};

/**
 * モバイルファーストのローディング設定
 */
export const getMobileFirstLoadingConfig = (
  baseSize: 'small' | 'medium' | 'large' = 'medium'
): ResponsiveLoadingConfig => ({
  xs: {
    size: 'small',
    variant: 'circular',
    text: false,
    fullScreen: false,
  },
  sm: {
    size: baseSize,
    variant: 'circular',
    text: true,
    fullScreen: false,
  },
  md: {
    size: baseSize,
    variant: 'circular',
    text: true,
    fullScreen: false,
  },
  lg: {
    size: 'large',
    variant: 'circular',
    text: true,
    fullScreen: false,
  },
});

/**
 * デスクトップファーストのローディング設定
 */
export const getDesktopFirstLoadingConfig = (
  baseSize: 'small' | 'medium' | 'large' = 'large'
): ResponsiveLoadingConfig => ({
  xs: {
    size: 'small',
    variant: 'dots',
    text: false,
    fullScreen: true,
  },
  sm: {
    size: 'medium',
    variant: 'circular',
    text: false,
    fullScreen: false,
  },
  md: {
    size: baseSize,
    variant: 'circular',
    text: true,
    fullScreen: false,
  },
  lg: {
    size: baseSize,
    variant: 'circular',
    text: true,
    fullScreen: false,
  },
});

/**
 * コンテナクエリ対応のローディングスタイル
 */
export const createContainerQueryLoadingStyle = (
  minWidth: number,
  maxWidth?: number
): SxProps<Theme> => {
  const containerQuery = maxWidth
    ? `@container (min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`
    : `@container (min-width: ${minWidth}px)`;

  return {
    [containerQuery]: {
      '& .loading-container': {
        padding: minWidth < 480 ? '8px' : '16px',
        '& .loading-text': {
          fontSize: minWidth < 480 ? '0.75rem' : '0.875rem',
        },
      },
    },
  };
};

/**
 * デバイス方向対応のローディングスタイル
 */
export const getOrientationAwareLoadingStyle = (): SxProps<Theme> => ({
  '@media (orientation: portrait)': {
    '& .loading-container': {
      flexDirection: 'column',
      gap: '16px',
    },
  },
  '@media (orientation: landscape)': {
    '& .loading-container': {
      flexDirection: 'row',
      gap: '24px',
    },
  },
});

/**
 * ビューポート高さに基づくローディング調整
 */
export const getViewportHeightAwareStyle = (): SxProps<Theme> => ({
  '@media (max-height: 600px)': {
    '& .loading-container': {
      padding: '8px',
      '& .loading-text': {
        fontSize: '0.75rem',
      },
    },
  },
  '@media (min-height: 800px)': {
    '& .loading-container': {
      padding: '24px',
      '& .loading-text': {
        fontSize: '1rem',
      },
    },
  },
});

/**
 * タッチデバイス対応のローディング調整
 */
export const getTouchDeviceLoadingStyle = (): SxProps<Theme> => ({
  '@media (hover: none) and (pointer: coarse)': {
    '& .loading-container': {
      minHeight: '44px', // タッチターゲットサイズ
      padding: '12px',
      '& .loading-button': {
        minHeight: '44px',
        padding: '12px 24px',
      },
    },
  },
  '@media (hover: hover) and (pointer: fine)': {
    '& .loading-container': {
      '& .loading-button': {
        minHeight: '36px',
        padding: '8px 16px',
      },
    },
  },
});

/**
 * 印刷メディア対応のローディング調整
 */
export const getPrintMediaLoadingStyle = (): SxProps<Theme> => ({
  '@media print': {
    '& .loading-container': {
      display: 'none',
    },
    '&::after': {
      content: '"Loading..."',
      display: 'block',
      textAlign: 'center',
      padding: '20px',
      border: '1px solid #ccc',
    },
  },
});

/**
 * 高コントラストモード対応のローディングスタイル
 */
export const getHighContrastLoadingStyle = (theme: Theme): SxProps<Theme> => ({
  '@media (prefers-contrast: high)': {
    '& .loading-spinner': {
      borderWidth: '3px',
      borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    },
    '& .loading-text': {
      fontWeight: 'bold',
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    },
  },
});

/**
 * モーション設定に応じたローディング調整
 */
export const getMotionPreferenceLoadingStyle = (): SxProps<Theme> => ({
  '@media (prefers-reduced-motion: reduce)': {
    '& .loading-spinner': {
      animation: 'none',
    },
    '& .loading-dots': {
      animation: 'none',
      opacity: 0.7,
    },
    '&::before': {
      content: '"Loading..."',
      position: 'absolute',
      left: '-9999px',
      top: 'auto',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
    },
  },
  '@media (prefers-reduced-motion: no-preference)': {
    '& .loading-spinner': {
      animation: 'spin 1s linear infinite',
    },
  },
});

/**
 * バッテリー状態に応じたローディング最適化
 */
export const getBatteryAwareLoadingStyle = (): SxProps<Theme> => ({
  // バッテリー残量が少ない場合のフォールバック
  '@supports not (battery: low)': {
    '& .loading-container.battery-low': {
      '& .loading-animation': {
        animation: 'none',
      },
      '& .loading-text::after': {
        content: '" (省電力モード)"',
      },
    },
  },
});

/**
 * ネットワーク状態に応じたローディング調整
 */
export const getNetworkAwareLoadingStyle = (): SxProps<Theme> => ({
  // 低速接続時の調整
  '&.slow-connection': {
    '& .loading-text': {
      fontSize: '0.875rem',
      '&::after': {
        content: '" - 接続速度が低下しています"',
        color: 'warning.main',
      },
    },
  },
  // オフライン時の調整
  '&.offline': {
    '& .loading-spinner': {
      display: 'none',
    },
    '& .loading-text': {
      color: 'error.main',
      '&::before': {
        content: '"オフライン: "',
      },
    },
  },
});

/**
 * スマートウォッチ対応のローディングスタイル
 */
export const getWearableLoadingStyle = (): SxProps<Theme> => ({
  '@media (max-width: 400px) and (max-height: 400px)': {
    '& .loading-container': {
      padding: '4px',
      '& .loading-spinner': {
        width: '16px',
        height: '16px',
      },
      '& .loading-text': {
        fontSize: '0.625rem',
        lineHeight: 1.2,
      },
    },
  },
});

/**
 * 統合レスポンシブローディングスタイル生成関数
 */
export const createComprehensiveResponsiveLoadingStyle = (
  theme: Theme,
  config?: ResponsiveLoadingConfig
): SxProps<Theme> => {
  const baseConfig = config || getMobileFirstLoadingConfig();

  const styles = Object.assign(
    {},
    createResponsiveLoadingStyle(theme, baseConfig),
    getOrientationAwareLoadingStyle(),
    getViewportHeightAwareStyle(),
    getTouchDeviceLoadingStyle(),
    getPrintMediaLoadingStyle(),
    getHighContrastLoadingStyle(theme),
    getMotionPreferenceLoadingStyle(),
    getBatteryAwareLoadingStyle(),
    getNetworkAwareLoadingStyle(),
    getWearableLoadingStyle()
  );

  return styles as SxProps<Theme>;
};
