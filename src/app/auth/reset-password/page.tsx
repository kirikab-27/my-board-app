'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// バリデーションスキーマ
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'パスワードは英数字を含む必要があります'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (!tokenParam) {
      setTokenValid(false);
      setError('リセットトークンが見つかりません。パスワードリセットを最初からやり直してください。');
    } else {
      setToken(tokenParam);
      setTokenValid(true);
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordSchema) => {
    if (!token) {
      setError('トークンが無効です。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'パスワードリセットに失敗しました');
      }

      setSuccess(result.message);

      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      console.error('❌ Reset password error:', err);
      setError(err instanceof Error ? err.message : 'パスワードリセットに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleRequestNewReset = () => {
    router.push('/auth/forgot-password'); // TODO: パスワードリセット要求ページ
  };

  if (tokenValid === false) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Card sx={{ maxWidth: 400, width: '100%', mx: 'auto' }}>
          <CardHeader>
            <Typography variant="h5" component="h1" gutterBottom>
              無効なリセットリンク
            </Typography>
          </CardHeader>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="error">{error}</Alert>
              
              <Button
                variant="contained"
                onClick={handleRequestNewReset}
                fullWidth
              >
                新しいリセットリンクを要求
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleBackToLogin}
                fullWidth
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
            新しいパスワードの設定
          </Typography>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && (
                <Alert severity="error">{error}</Alert>
              )}
              
              {success && (
                <Alert severity="success">
                  {success}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    3秒後にログインページに移動します...
                  </Typography>
                </Alert>
              )}

              <Alert severity="info">
                <Typography variant="body2">
                  セキュアなパスワードを設定してください：<br />
                  • 8文字以上<br />
                  • 英数字を含む<br />
                  • 他のサイトと異なるもの
                </Typography>
              </Alert>

              <TextField
                {...register('password')}
                type="password"
                label="新しいパスワード"
                error={!!errors.password}
                helperText={errors.password?.message}
                fullWidth
                required
                disabled={isLoading || !!success}
              />

              <TextField
                {...register('confirmPassword')}
                type="password"
                label="パスワード（確認）"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                fullWidth
                required
                disabled={isLoading || !!success}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading || !!success}
                fullWidth
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : success ? (
                  'ログインページに移動中...'
                ) : (
                  'パスワードを更新'
                )}
              </Button>

              <Button
                variant="outlined"
                onClick={handleBackToLogin}
                fullWidth
                disabled={isLoading}
              >
                ログインページに戻る
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}