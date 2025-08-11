'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Link,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterSchema } from '@/lib/validations/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await registerUser(data.name, data.email, data.password, data.confirmPassword);
      console.log('✅ Registration successful:', result);
      setSuccess(result.message);
      
      // 3秒後にログインページにリダイレクト
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err instanceof Error ? err.message : 'ユーザー登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && (
                <Alert severity="error">{error}</Alert>
              )}
              
              {success && (
                <Alert severity="success">{success}</Alert>
              )}

              <TextField
                {...register('name')}
                label="名前"
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
                required
              />

              <TextField
                {...register('email')}
                type="email"
                label="メールアドレス"
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
                required
              />

              <TextField
                {...register('password')}
                type="password"
                label="パスワード"
                error={!!errors.password}
                helperText={errors.password?.message}
                fullWidth
                required
              />

              <TextField
                {...register('confirmPassword')}
                type="password"
                label="パスワード（確認）"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                fullWidth
                required
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
                  '登録'
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  既にアカウントをお持ちの方は{' '}
                  <Link href="/auth/signin" underline="hover">
                    ログイン
                  </Link>
                </Typography>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}