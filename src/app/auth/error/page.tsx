'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  Box,
  Typography,
  Container,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';

const errorMessages = {
  'missing-token': {
    title: 'トークンが見つかりません',
    description: 'メール認証用のトークンが提供されていません。メール内のリンクを正しくクリックしているか確認してください。',
    action: '新しい認証メールを要求する',
  },
  'invalid-token': {
    title: 'トークンが無効または期限切れです',
    description: 'メール認証用のトークンが無効または期限切れです。認証メールの有効期限は24時間です。',
    action: '新しい認証メールを要求する',
  },
  'user-not-found': {
    title: 'ユーザーが見つかりません',
    description: 'このメールアドレスに対応するユーザーアカウントが見つかりませんでした。',
    action: '新規登録する',
  },
  'verification-failed': {
    title: '認証処理に失敗しました',
    description: 'システムエラーにより認証処理に失敗しました。しばらく待ってから再度お試しください。',
    action: 'もう一度試す',
  },
  default: {
    title: '認証エラーが発生しました',
    description: '認証処理中に予期しないエラーが発生しました。',
    action: 'ホームページに戻る',
  },
};

export default function AuthErrorPage() {
  const [errorType, setErrorType] = useState<string>('default');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error') || 'default';
    setErrorType(error);
  }, [searchParams]);

  const error = errorMessages[errorType as keyof typeof errorMessages] || errorMessages.default;

  const handleAction = () => {
    switch (errorType) {
      case 'missing-token':
      case 'invalid-token':
        // TODO: 認証メール再送信ページへ
        router.push('/register');
        break;
      case 'user-not-found':
        router.push('/register');
        break;
      case 'verification-failed':
        // ページをリフレッシュして再試行
        window.location.reload();
        break;
      default:
        router.push('/');
        break;
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Card sx={{ maxWidth: 500, width: '100%', mx: 'auto' }}>
        <CardHeader sx={{ textAlign: 'center', pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ErrorIcon 
              sx={{ 
                fontSize: 64, 
                color: 'error.main'
              }} 
            />
          </Box>
          <Typography variant="h5" component="h1" gutterBottom>
            {error.title}
          </Typography>
        </CardHeader>
        
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="error">
              <Typography variant="body1">
                {error.description}
              </Typography>
            </Alert>

            <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>解決方法:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                • メール内のリンクを正しくクリックしているか確認<br />
                • メールが迷惑メールフォルダに振り分けられていないか確認<br />
                • リンクの有効期限（24時間）が切れていないか確認
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleAction}
                startIcon={<RefreshIcon />}
              >
                {error.action}
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleBackToLogin}
              >
                ログインページに戻る
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}