/**
 * ローディングコンポーネントの型定義
 */

import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export type LoadingVariant =
  | 'circular' // CircularProgress
  | 'linear' // LinearProgress
  | 'skeleton' // Skeleton
  | 'dots' // カスタムドット
  | 'pulse' // パルスアニメーション
  | 'fade'; // フェードアニメーション

export type LoadingSize = 'small' | 'medium' | 'large';

export type LoadingColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export interface BaseLoadingProps {
  /**
   * ローディングの種類
   * @default 'circular'
   */
  variant?: LoadingVariant;

  /**
   * サイズ
   * @default 'medium'
   */
  size?: LoadingSize;

  /**
   * カラー
   * @default 'primary'
   */
  color?: LoadingColor;

  /**
   * ローディング表示中かどうか
   * @default true
   */
  loading?: boolean;

  /**
   * ローディング中に表示するテキスト
   */
  text?: string;

  /**
   * カスタムスタイル
   */
  sx?: SxProps<Theme>;

  /**
   * フルスクリーンで表示するかどうか
   * @default false
   */
  fullScreen?: boolean;

  /**
   * 背景オーバーレイを表示するかどうか
   * @default false
   */
  overlay?: boolean;

  /**
   * アニメーション継続時間（ms）
   * @default 800
   */
  duration?: number;

  /**
   * 遅延時間（ms）- この時間経過後に表示開始
   * @default 200
   */
  delay?: number;
}

export interface LoadingContainerProps extends BaseLoadingProps {
  /**
   * ローディング完了時に表示する子要素
   */
  children?: ReactNode;

  /**
   * 最小高さ
   */
  minHeight?: number | string;

  /**
   * コンテナの幅
   * @default '100%'
   */
  width?: number | string;

  /**
   * 中央揃えするかどうか
   * @default true
   */
  centered?: boolean;
}

export interface AuthLoadingProps extends BaseLoadingProps {
  /**
   * 認証エラー時のメッセージ
   */
  errorMessage?: string;

  /**
   * 再試行ボタンを表示するかどうか
   * @default true
   */
  showRetry?: boolean;

  /**
   * 再試行ボタンのクリックハンドラー
   */
  onRetry?: () => void;

  /**
   * タイムアウト時間（ms）
   * @default 10000
   */
  timeout?: number;

  /**
   * タイムアウト時のコールバック
   */
  onTimeout?: () => void;
}

export interface SkeletonLoadingProps {
  /**
   * スケルトンの種類
   */
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';

  /**
   * 幅
   */
  width?: number | string;

  /**
   * 高さ
   */
  height?: number | string;

  /**
   * 表示する行数（text variantの場合）
   */
  lines?: number;

  /**
   * アニメーションタイプ
   * @default 'pulse'
   */
  animation?: 'pulse' | 'wave' | false;

  /**
   * カスタムスタイル
   */
  sx?: SxProps<Theme>;
}

export interface LoadingStateHook {
  /**
   * ローディング状態
   */
  isLoading: boolean;

  /**
   * エラー状態
   */
  error: string | null;

  /**
   * ローディング開始
   */
  startLoading: (reason?: string) => void;

  /**
   * ローディング終了
   */
  stopLoading: () => void;

  /**
   * エラー設定
   */
  setError: (error: string | null) => void;

  /**
   * リセット
   */
  reset: () => void;
}

export interface LoadingMetrics {
  /**
   * ローディング開始時刻
   */
  startTime: number;

  /**
   * ローディング終了時刻
   */
  endTime?: number;

  /**
   * 持続時間（ms）
   */
  duration?: number;

  /**
   * ローディングの理由
   */
  reason?: string;
}
