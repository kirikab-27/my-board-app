'use client';

import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Collapse,
  useTheme,
  alpha
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import type { AuthFailureReason } from '@/types/auth';

interface ErrorFallbackProps {
  /**
   * エラーメッセージ
   */
  error?: string | Error;
  
  /**
   * エラーの種類
   */
  type?: 'error' | 'warning' | 'info';
  
  /**
   * リトライボタンを表示するか
   * @default true
   */
  showRetry?: boolean;
  
  /**
   * ホームボタンを表示するか  
   * @default true
   */
  showHome?: boolean;
  
  /**
   * リトライ時の処理
   */
  onRetry?: () => void;
  
  /**
   * タイトル
   */
  title?: string;
  
  /**
   * 詳細情報
   */
  details?: string;
  
  /**
   * フルスクリーン表示するか
   * @default false
   */
  fullScreen?: boolean;
  
  /**
   * 最小高さ
   */
  minHeight?: number | string;
}

/**
 * 基本エラーフォールバックコンポーネント
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  type = 'error',
  showRetry = true,
  showHome = true,
  onRetry,
  title,
  details,
  fullScreen = false,
  minHeight = 400
}) => {
  const router = useRouter();
  const theme = useTheme();
  const [showDetails, setShowDetails] = React.useState(false);

  const errorMessage = error instanceof Error ? error.message : (error || 'エラーが発生しました');
  const errorStack = error instanceof Error ? error.stack : undefined;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <WarningIcon sx={{ fontSize: 48, color: 'warning.main' }} />;
      case 'info':
        return <InfoIcon sx={{ fontSize: 48, color: 'info.main' }} />;
      default:
        return <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'warning':
        return '注意が必要です';
      case 'info':
        return '情報';
      default:
        return 'エラーが発生しました';
    }
  };

  const content = (
    <Container maxWidth="md" sx={{ py: fullScreen ? 8 : 4 }}>
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          minHeight,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* アイコンとタイトル */}
        <Box sx={{ mb: 3 }}>
          {getIcon()}
          <Typography variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            {getTitle()}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {errorMessage}
          </Typography>
        </Box>

        {/* 詳細情報 */}
        {(details || errorStack) && (
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowDetails(!showDetails)}
              size="small"
              color="inherit"
            >
              詳細を{showDetails ? '隠す' : '表示'}
            </Button>
            <Collapse in={showDetails}>
              <Alert severity={type} sx={{ mt: 2, textAlign: 'left' }}>
                {details && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {details}
                  </Typography>
                )}
                {errorStack && (
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: 200,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {errorStack}
                  </Typography>
                )}
              </Alert>
            </Collapse>
          </Box>
        )}

        {/* アクションボタン */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {showRetry && onRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              size="large"
            >
              再試行
            </Button>
          )}
          {showHome && (
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => router.push('/')}
              size="large"
            >
              ホームに戻る
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.background.default, 0.9),
          backdropFilter: 'blur(5px)',
          zIndex: theme.zIndex.modal
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

/**
 * 認証エラー専用フォールバックコンポーネント
 */
export const AuthErrorFallback: React.FC<{
  reason: AuthFailureReason;
  onRetry?: () => void;
  showDetails?: boolean;
}> = ({ reason, onRetry, showDetails = false }) => {
  const router = useRouter();

  const getErrorInfo = (reason: AuthFailureReason) => {
    switch (reason) {
      case 'not_authenticated':
        return {
          title: 'ログインが必要です',
          message: 'このページにアクセスするにはログインが必要です。',
          action: () => router.push('/login'),
          actionText: 'ログインページへ',
          type: 'info' as const
        };
      case 'insufficient_permissions':
        return {
          title: '権限が不足しています',
          message: 'このページにアクセスする権限がありません。',
          action: () => router.push('/unauthorized'),
          actionText: '権限について',
          type: 'warning' as const
        };
      case 'email_not_verified':
        return {
          title: 'メール認証が必要です',
          message: 'メールアドレスの認証が完了していません。',
          action: () => router.push('/auth/verify-email'),
          actionText: '認証ページへ',
          type: 'warning' as const
        };
      case 'custom_check_failed':
        return {
          title: 'アクセス条件を満たしていません',
          message: 'カスタム認証チェックに失敗しました。',
          action: () => router.push('/'),
          actionText: 'ホームに戻る',
          type: 'warning' as const
        };
      default:
        return {
          title: '認証エラー',
          message: '認証処理でエラーが発生しました。',
          action: () => router.push('/login'),
          actionText: 'ログインページへ',
          type: 'error' as const
        };
    }
  };

  const errorInfo = getErrorInfo(reason);

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        <Box sx={{ mb: 3 }}>
          {errorInfo.type === 'error' ? (
            <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
          ) : errorInfo.type === 'warning' ? (
            <WarningIcon sx={{ fontSize: 48, color: 'warning.main' }} />
          ) : (
            <InfoIcon sx={{ fontSize: 48, color: 'info.main' }} />
          )}
        </Box>
        
        <Typography variant="h5" gutterBottom>
          {errorInfo.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {errorInfo.message}
        </Typography>

        {showDetails && (
          <Alert severity={errorInfo.type} sx={{ mb: 3, textAlign: 'left' }}>
            <AlertTitle>詳細情報</AlertTitle>
            認証失敗の理由: {reason}
          </Alert>
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={errorInfo.action}
          size="large"
        >
          {errorInfo.actionText}
        </Button>
        {onRetry && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            size="large"
          >
            再試行
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

/**
 * ネットワークエラー用フォールバックコンポーネント
 */
export const NetworkErrorFallback: React.FC<{
  onRetry?: () => void;
  message?: string;
}> = ({ onRetry, message = 'ネットワークエラーが発生しました' }) => {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        接続エラー
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        {message}
        <br />
        インターネット接続を確認して、再試行してください。
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          size="large"
        >
          再試行
        </Button>
      )}
    </Box>
  );
};

/**
 * タイムアウトエラー用フォールバックコンポーネント
 */
export const TimeoutErrorFallback: React.FC<{
  onRetry?: () => void;
  timeout?: number;
}> = ({ onRetry, timeout = 10000 }) => {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        処理がタイムアウトしました
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {timeout / 1000}秒以内に処理が完了しませんでした。
        <br />
        再試行するか、しばらく時間をおいてから再度お試しください。
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          size="large"
        >
          再試行
        </Button>
      )}
    </Box>
  );
};