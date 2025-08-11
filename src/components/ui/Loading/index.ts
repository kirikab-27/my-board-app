// ローディングコンポーネント統合エクスポート

// 基本コンポーネント
export { BaseLoading } from './BaseLoading';

// スケルトンコンポーネント
export {
  SkeletonBase,
  AuthPageSkeleton,
  DashboardSkeleton,
  BoardSkeleton,
  ProfileSkeleton,
  ListItemSkeleton
} from './SkeletonLoading';

// エラーフォールバックコンポーネント
export {
  ErrorFallback,
  AuthErrorFallback,
  NetworkErrorFallback,
  TimeoutErrorFallback
} from './ErrorFallback';

// 統合ローディングコンポーネント
export {
  AuthLoadingWrapper,
  SimpleAuthLoading,
  PageTransitionLoading,
  SuspenseAuthLoading,
  ConditionalLoading,
  DelayedLoading
} from './AuthLoadingWrapper';

// フック
export {
  useLoadingState,
  useMultipleLoadingState,
  useAsyncOperation,
  useLoadingWithTimeout,
  useDebouncedLoading
} from '@/hooks/useLoadingState';

// ユーティリティ
export {
  loadingKeyframes,
  createAnimationStyle,
  getThemedAnimationStyle,
  getResponsiveAnimationStyle,
  getPerformantAnimationStyle,
  createDotsAnimation,
  createWaveAnimation,
  createShimmerEffect,
  animationControls,
  a11yFriendlyAnimation
} from '@/utils/loading/animations';

export {
  createResponsiveLoadingStyle,
  getMobileFirstLoadingConfig,
  getDesktopFirstLoadingConfig,
  createContainerQueryLoadingStyle,
  getOrientationAwareLoadingStyle,
  getViewportHeightAwareStyle,
  getTouchDeviceLoadingStyle,
  getPrintMediaLoadingStyle,
  getHighContrastLoadingStyle,
  getMotionPreferenceLoadingStyle,
  getBatteryAwareLoadingStyle,
  getNetworkAwareLoadingStyle,
  getWearableLoadingStyle,
  createComprehensiveResponsiveLoadingStyle
} from '@/utils/loading/responsive';

// 型定義の再エクスポート
export type {
  BaseLoadingProps,
  SkeletonLoadingProps,
  LoadingStateHook,
  LoadingMetrics
} from '@/types/loading';

export type { AuthFailureReason } from '@/types/auth';