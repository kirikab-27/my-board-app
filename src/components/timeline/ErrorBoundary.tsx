'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  Home,
  BugReport
} from '@mui/icons-material';
import * as Sentry from '@sentry/nextjs';

// エラー境界の状態型
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

// エラー境界のプロパティ型
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

// フォールバックコンポーネントのプロパティ型
export interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
  errorId: string | null;
  showDetails?: boolean;
}

// デフォルトエラーフォールバックコンポーネント
function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  errorId,
  showDetails = false
}: ErrorFallbackProps) {
  const theme = useTheme();

  const handleReportError = () => {
    // エラーレポート送信処理
    if (errorId) {
      window.open(`https://github.com/your-repo/issues/new?title=Error Report: ${errorId}`, '_blank');
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="50vh"
      p={3}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <ErrorOutline
            sx={{
              fontSize: 64,
              color: theme.palette.error.main,
              mb: 2
            }}
          />
          
          <Typography variant="h4" gutterBottom color="error">
            申し訳ありません
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            予期しないエラーが発生しました。
            ページを再読み込みするか、しばらく時間をおいてから再度お試しください。
          </Typography>

          {errorId && (
            <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
              <Typography variant="body2">
                エラーID: <code>{errorId}</code>
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                サポートにお問い合わせの際は、このIDをお知らせください。
              </Typography>
            </Alert>
          )}

          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={resetError}
              color="primary"
            >
              再試行
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={handleGoHome}
            >
              ホームに戻る
            </Button>
            
            {errorId && (
              <Button
                variant="text"
                startIcon={<BugReport />}
                onClick={handleReportError}
                size="small"
              >
                エラー報告
              </Button>
            )}
          </Box>

          {showDetails && process.env.NODE_ENV === 'development' && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Box textAlign="left">
                <Typography variant="h6" gutterBottom>
                  開発者情報
                </Typography>
                
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                    {error.message}
                  </Typography>
                </Alert>
                
                {error.stack && (
                  <Alert severity="warning">
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                      {error.stack}
                    </Typography>
                  </Alert>
                )}
                
                {errorInfo?.componentStack && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                      {errorInfo.componentStack}
                    </Typography>
                  </Alert>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// エラー境界クラスコンポーネント
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーIDを生成
    const errorId = `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      errorInfo,
      errorId
    });

    // Sentryにエラー送信
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'timeline');
      scope.setTag('errorId', errorId);
      scope.setContext('errorInfo', errorInfo as any);
      scope.setLevel('error');
      Sentry.captureException(error);
    });

    // カスタムエラーハンドラ実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('Timeline Error Boundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// フック版エラー境界
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    // エラーIDを生成
    const errorId = `hook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Sentryにエラー送信
    Sentry.withScope((scope) => {
      scope.setTag('errorHandler', 'hook');
      scope.setTag('errorId', errorId);
      if (errorInfo) {
        scope.setContext('errorInfo', errorInfo as any);
      }
      scope.setLevel('error');
      Sentry.captureException(error);
    });

    console.error('Timeline error:', error, errorInfo);
    
    return errorId;
  }, []);

  return { handleError };
}