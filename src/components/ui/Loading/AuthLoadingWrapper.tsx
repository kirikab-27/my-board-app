'use client';

import React, { Suspense } from 'react';
import { Box } from '@mui/material';
import { useRequireAuth, useAuth } from '@/hooks/useRequireAuth';
import { BaseLoading } from './BaseLoading';
import { AuthErrorFallback } from './ErrorFallback';
import { 
  AuthPageSkeleton, 
  DashboardSkeleton, 
  BoardSkeleton, 
  ProfileSkeleton 
} from './SkeletonLoading';
import type { UseRequireAuthOptions } from '@/types/auth';
import type { BaseLoadingProps } from '@/types/loading';

interface AuthLoadingWrapperProps extends UseRequireAuthOptions {
  /**
   * ローディング完了時に表示する子要素
   */
  children: React.ReactNode;
  
  /**
   * ローディングコンポーネントのプロパティ
   */
  loadingProps?: Partial<BaseLoadingProps>;
  
  /**
   * ローディングの種類
   */
  loadingType?: 'spinner' | 'skeleton' | 'custom';
  
  /**
   * スケルトンの種類
   */
  skeletonType?: 'auth' | 'dashboard' | 'board' | 'profile';
  
  /**
   * カスタムローディングコンポーネント
   */
  customLoading?: React.ReactNode;
  
  /**
   * エラー時の詳細表示
   */
  showErrorDetails?: boolean;
  
  /**
   * 最小表示時間（ms）
   */
  minDisplayTime?: number;
}

/**
 * useRequireAuth統合ローディングラッパー
 */
export const AuthLoadingWrapper: React.FC<AuthLoadingWrapperProps> = ({
  children,
  loadingProps = {},
  loadingType = 'skeleton',
  skeletonType = 'dashboard',
  customLoading,
  showErrorDetails = false,
  minDisplayTime = 500,
  ...authOptions
}) => {
  const { 
    user, 
    isLoading, 
    error, 
    hasRequiredPermission, 
    recheckAuth 
  } = useRequireAuth(authOptions);

  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);

  // 最小表示時間の制御
  React.useEffect(() => {
    if (isLoading) {
      setMinTimeElapsed(false);
      const timer = setTimeout(() => {
        setMinTimeElapsed(true);
      }, minDisplayTime);
      
      return () => clearTimeout(timer);
    } else {
      setMinTimeElapsed(true);
    }
  }, [isLoading, minDisplayTime]);

  // ローディング状態（最小時間も考慮）
  const showLoading = isLoading || !minTimeElapsed;

  // ローディング表示
  if (showLoading) {
    // カスタムローディング
    if (customLoading) {
      return <>{customLoading}</>;
    }

    // スケルトン表示
    if (loadingType === 'skeleton') {
      switch (skeletonType) {
        case 'auth':
          return <AuthPageSkeleton />;
        case 'board':
          return <BoardSkeleton />;
        case 'profile':
          return <ProfileSkeleton />;
        default:
          return <DashboardSkeleton />;
      }
    }

    // スピナー表示
    return (
      <BaseLoading
        text="認証情報を確認中..."
        variant="circular"
        size="medium"
        fullScreen
        overlay
        {...loadingProps}
      />
    );
  }

  // エラー状態
  if (error) {
    return (
      <AuthErrorFallback
        reason={error}
        onRetry={recheckAuth}
        showDetails={showErrorDetails}
      />
    );
  }

  // 権限不足
  if (!hasRequiredPermission) {
    return (
      <AuthErrorFallback
        reason="insufficient_permissions"
        onRetry={recheckAuth}
        showDetails={showErrorDetails}
      />
    );
  }

  // 認証成功時のコンテンツ表示
  return <>{children}</>;
};

/**
 * シンプルな認証ローディングコンポーネント
 */
export const SimpleAuthLoading: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        {fallback || (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px'
            }}
          >
            <BaseLoading
              text="読み込み中..."
              variant="circular"
            />
          </Box>
        )}
      </>
    );
  }

  return <>{children}</>;
};

/**
 * ページ遷移時のローディングコンポーネント
 */
export const PageTransitionLoading: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  skeletonType?: 'auth' | 'dashboard' | 'board' | 'profile';
}> = ({ isLoading, children, skeletonType = 'dashboard' }) => {
  if (isLoading) {
    switch (skeletonType) {
      case 'auth':
        return <AuthPageSkeleton />;
      case 'board':
        return <BoardSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      default:
        return <DashboardSkeleton />;
    }
  }

  return <>{children}</>;
};

/**
 * Suspense統合ローディングコンポーネント
 */
export const SuspenseAuthLoading: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeletonType?: 'auth' | 'dashboard' | 'board' | 'profile';
}> = ({ children, fallback, skeletonType = 'dashboard' }) => {
  const defaultFallback = React.useMemo(() => {
    if (fallback) return fallback;

    switch (skeletonType) {
      case 'auth':
        return <AuthPageSkeleton />;
      case 'board':
        return <BoardSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      default:
        return <DashboardSkeleton />;
    }
  }, [fallback, skeletonType]);

  return (
    <Suspense fallback={defaultFallback}>
      {children}
    </Suspense>
  );
};

/**
 * 条件付きローディングコンポーネント
 */
export const ConditionalLoading: React.FC<{
  when: boolean;
  children: React.ReactNode;
  loading?: React.ReactNode;
  variant?: 'spinner' | 'skeleton';
  skeletonType?: 'auth' | 'dashboard' | 'board' | 'profile';
}> = ({ 
  when, 
  children, 
  loading,
  variant = 'spinner',
  skeletonType = 'dashboard' 
}) => {
  if (!when) {
    return <>{children}</>;
  }

  if (loading) {
    return <>{loading}</>;
  }

  if (variant === 'skeleton') {
    switch (skeletonType) {
      case 'auth':
        return <AuthPageSkeleton />;
      case 'board':
        return <BoardSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      default:
        return <DashboardSkeleton />;
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}
    >
      <BaseLoading
        variant="circular"
        size="medium"
        text="読み込み中..."
      />
    </Box>
  );
};

/**
 * 遅延ローディングコンポーネント
 */
export const DelayedLoading: React.FC<{
  delay?: number;
  children: React.ReactNode;
  isLoading: boolean;
  fallback?: React.ReactNode;
}> = ({ delay = 300, children, isLoading, fallback }) => {
  const [showLoading, setShowLoading] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowLoading(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [isLoading, delay]);

  if (isLoading && showLoading) {
    return (
      <>
        {fallback || (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BaseLoading
              variant="dots"
              size="medium"
              text="処理中..."
            />
          </Box>
        )}
      </>
    );
  }

  if (isLoading) {
    // 遅延時間内はコンテンツを表示
    return <>{children}</>;
  }

  return <>{children}</>;
};