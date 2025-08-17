'use client';

import { keyframes } from '@emotion/react';
import type { Theme } from '@mui/material/styles';

/**
 * ローディングアニメーション定義
 */

// キーフレーム定義
export const loadingKeyframes = {
  // 点滅アニメーション
  pulse: keyframes`
    0% {
      transform: scale(0.95);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.7;
    }
    100% {
      transform: scale(0.95);
      opacity: 1;
    }
  `,

  // フェードインアウトアニメーション
  fade: keyframes`
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  `,

  // ドットアニメーション
  dots: keyframes`
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  `,

  // 波のようなアニメーション
  wave: keyframes`
    0%, 40%, 100% {
      transform: scaleY(0.4);
    }
    20% {
      transform: scaleY(1.0);
    }
  `,

  // 回転アニメーション
  rotate: keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  `,

  // スケールアニメーション
  scale: keyframes`
    0%, 100% {
      transform: scale(0);
    }
    50% {
      transform: scale(1);
    }
  `,

  // スライドアニメーション
  slide: keyframes`
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  `,

  // バウンスアニメーション
  bounce: keyframes`
    0%, 20%, 53%, 80%, 100% {
      animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
      transform: translate3d(0,0,0);
    }
    40%, 43% {
      animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
      transform: translate3d(0, -30px, 0);
    }
    70% {
      animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
      transform: translate3d(0, -15px, 0);
    }
    90% {
      transform: translate3d(0,-4px,0);
    }
  `,

  // スケルトン用シマーアニメーション
  shimmer: keyframes`
    0% {
      background-position: -468px 0;
    }
    100% {
      background-position: 468px 0;
    }
  `,
};

/**
 * アニメーションスタイルのファクトリー関数
 */
export const createAnimationStyle = (
  animationType: keyof typeof loadingKeyframes,
  duration: number = 800,
  delay: number = 0,
  iterationCount: number | 'infinite' = 'infinite'
) => ({
  animation: `${loadingKeyframes[animationType]} ${duration}ms ease-in-out ${delay}ms ${iterationCount}`,
});

/**
 * テーマに基づいたアニメーションスタイル
 */
export const getThemedAnimationStyle = (
  theme: Theme,
  animationType: keyof typeof loadingKeyframes,
  options?: {
    duration?: number;
    delay?: number;
    color?: keyof Theme['palette'];
    iterationCount?: number | 'infinite';
  }
) => {
  const {
    duration = 800,
    delay = 0,
    color = 'primary',
    iterationCount = 'infinite',
  } = options || {};

  return {
    ...createAnimationStyle(animationType, duration, delay, iterationCount),
    color: (theme.palette[color] as any)?.main || theme.palette.primary.main,
  };
};

/**
 * レスポンシブアニメーション設定
 */
export const getResponsiveAnimationStyle = (
  theme: Theme,
  animationType: keyof typeof loadingKeyframes,
  breakpointConfig?: {
    xs?: { duration?: number; delay?: number };
    sm?: { duration?: number; delay?: number };
    md?: { duration?: number; delay?: number };
    lg?: { duration?: number; delay?: number };
  }
) => {
  const baseStyle = createAnimationStyle(animationType);

  if (!breakpointConfig) return baseStyle;

  return {
    ...baseStyle,
    [theme.breakpoints.up('xs')]: {
      ...(breakpointConfig.xs &&
        createAnimationStyle(
          animationType,
          breakpointConfig.xs.duration,
          breakpointConfig.xs.delay
        )),
    },
    [theme.breakpoints.up('sm')]: {
      ...(breakpointConfig.sm &&
        createAnimationStyle(
          animationType,
          breakpointConfig.sm.duration,
          breakpointConfig.sm.delay
        )),
    },
    [theme.breakpoints.up('md')]: {
      ...(breakpointConfig.md &&
        createAnimationStyle(
          animationType,
          breakpointConfig.md.duration,
          breakpointConfig.md.delay
        )),
    },
    [theme.breakpoints.up('lg')]: {
      ...(breakpointConfig.lg &&
        createAnimationStyle(
          animationType,
          breakpointConfig.lg.duration,
          breakpointConfig.lg.delay
        )),
    },
  };
};

/**
 * パフォーマンスに配慮したアニメーション設定
 */
export const getPerformantAnimationStyle = (
  animationType: keyof typeof loadingKeyframes,
  options?: {
    duration?: number;
    reduceMotion?: boolean;
    willChange?: string;
  }
) => {
  const { duration = 800, reduceMotion = false, willChange = 'transform' } = options || {};

  const baseStyle = createAnimationStyle(animationType, duration);

  return {
    ...baseStyle,
    willChange,
    // prefers-reduced-motion対応
    '@media (prefers-reduced-motion: reduce)': reduceMotion
      ? {
          animation: 'none',
        }
      : {},
    // GPU加速の利用
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    perspective: 1000,
  };
};

/**
 * ドットローディング専用のアニメーション生成
 */
export const createDotsAnimation = (
  dotCount: number = 3,
  duration: number = 800,
  stagger: number = 200
) => {
  return Array.from({ length: dotCount }, (_, index) => ({
    animationDelay: `${index * stagger}ms`,
    ...createAnimationStyle('dots', duration),
  }));
};

/**
 * 波形ローディング専用のアニメーション生成
 */
export const createWaveAnimation = (
  barCount: number = 5,
  duration: number = 1000,
  stagger: number = 100
) => {
  return Array.from({ length: barCount }, (_, index) => ({
    animationDelay: `${index * stagger}ms`,
    ...createAnimationStyle('wave', duration),
  }));
};

/**
 * カスタムスケルトンシマーエフェクト
 */
export const createShimmerEffect = (theme: Theme, width: number = 468) => ({
  background: `linear-gradient(90deg, 
    ${theme.palette.background.paper} 0%, 
    ${theme.palette.action.hover} 50%, 
    ${theme.palette.background.paper} 100%)`,
  backgroundSize: `${width}px 100%`,
  ...createAnimationStyle('shimmer', 1200),
});

/**
 * アニメーション制御のユーティリティ
 */
export const animationControls = {
  // アニメーション一時停止
  pause: {
    animationPlayState: 'paused' as const,
  },

  // アニメーション再生
  play: {
    animationPlayState: 'running' as const,
  },

  // アニメーション速度調整
  setSpeed: (speed: number) => ({
    animationDuration: `${800 / speed}ms`,
  }),

  // アニメーション方向設定
  reverse: {
    animationDirection: 'reverse' as const,
  },

  alternate: {
    animationDirection: 'alternate' as const,
  },
};

/**
 * アクセシビリティを考慮したアニメーション設定
 */
export const a11yFriendlyAnimation = (
  animationType: keyof typeof loadingKeyframes,
  options?: {
    duration?: number;
    respectUserPreferences?: boolean;
    fallbackContent?: string;
  }
) => {
  const {
    duration = 800,
    respectUserPreferences = true,
    fallbackContent = '読み込み中...',
  } = options || {};

  return {
    ...createAnimationStyle(animationType, duration),
    // screen reader対応
    'aria-label': fallbackContent,
    role: 'progressbar',
    'aria-live': 'polite',
    // reduced motion対応
    ...(respectUserPreferences && {
      '@media (prefers-reduced-motion: reduce)': {
        animation: 'none',
        '&::after': {
          content: `"${fallbackContent}"`,
          position: 'absolute',
          left: '-9999px',
        },
      },
    }),
  };
};
