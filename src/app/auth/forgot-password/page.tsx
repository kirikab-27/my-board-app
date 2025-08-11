'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Container,
  CircularProgress,
  Link,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// バリデーションスキーマ
const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'パスワードリセット要求に失敗しました');
      }

      setSuccess(result.message);

    } catch (err) {
      console.error('❌ Forgot password error:', err);
      setError(err instanceof Error ? err.message : 'パスワードリセット要求に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Card sx={{ maxWidth: 500, width: '100%', mx: 'auto' }}>
          <CardHeader sx={{ textAlign: 'center', pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <EmailIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'primary.main'
                }} 
              />
            </Box>
            <Typography variant="h5" component="h1" gutterBottom>
              メール送信完了
            </Typography>
          </CardHeader>
          
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'center' }}>
              <Alert severity="success" sx={{ textAlign: 'left' }}>
                <Typography variant="body1">
                  {success}
                </Typography>
              </Alert>

              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, textAlign: 'left' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>次の手順:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  1. メールボックスを確認してください<br />
                  2. 「パスワードリセット」メール内のリンクをクリック<br />
                  3. 新しいパスワードを設定<br />
                  4. 新しいパスワードでログイン
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 'bold' }}>
                  リンクの有効期限は1時間です。
                </Typography>
              </Box>

              <Alert severity="info">
                <Typography variant="body2">
                  メールが届かない場合は、迷惑メールフォルダもご確認ください。
                </Typography>
              </Alert>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleBackToLogin}
                sx={{ py: 1.5 }}
              >
                ログインページに戻る
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 'auto' }}>
        <CardHeader>
          <Typography variant="h5" component="h1" gutterBottom>
            パスワードリセット
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            登録したメールアドレスにパスワードリセット用のリンクを送信します
          </Typography>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              <Alert severity="info">
                <Typography variant="body2">
                  アカウントに登録されているメールアドレスを入力してください。
                  パスワードリセット用のリンクをお送りします。
                </Typography>
              </Alert>

              <TextField
                {...register('email')}
                type="email"
                label="メールアドレス"
                placeholder="your-email@example.com"
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
                required
                disabled={isLoading}
                autoFocus
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                fullWidth
                sx={{ py: 1.5 }}
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}
              >
                {isLoading ? 'メール送信中...' : 'リセットメールを送信'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleBackToLogin}
                fullWidth
                disabled={isLoading}
                startIcon={<ArrowBackIcon />}
              >
                ログインページに戻る
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  アカウントをお持ちでない方は{' '}
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => router.push('/register')}
                    sx={{ textDecoration: 'underline' }}
                  >
                    新規登録
                  </Link>
                </Typography>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}