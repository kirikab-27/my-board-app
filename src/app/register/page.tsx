'use client';

import { useState } from 'react';
// import { useRouter } from 'next/navigation'; // 開発中で未使用
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Link,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterSchema } from '@/lib/validations/auth';
import { signIn } from 'next-auth/react';
import { usePasswordVisibility } from '@/hooks/usePasswordVisibility';
import {
  IconButton,
  InputAdornment,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  // const router = useRouter(); // 現在未使用
  
  // Issue #42 Phase 2: パスワード表示切り替え機能（useIsomorphicLayoutEffect使用）
  const passwordVisibility = usePasswordVisibility();
  const confirmPasswordVisibility = usePasswordVisibility();

  // OAuth設定の有効性をチェック（開発中のため無効化）
  const isGoogleAuthEnabled = false; // 開発中のため無効化
  const isGitHubAuthEnabled = false; // 開発中のため無効化

  // パスワード強度計算関数
  const calculatePasswordStrength = (
    password: string
  ): { score: number; level: string; color: string; feedback: string } => {
    if (!password) return { score: 0, level: '入力してください', color: '#ccc', feedback: '' };

    let score = 0;
    const feedback: string[] = [];

    // 長さチェック
    if (password.length >= 8) {
      score += 25;
    } else {
      feedback.push('8文字以上');
    }

    // 英字チェック
    if (/[a-zA-Z]/.test(password)) {
      score += 25;
    } else {
      feedback.push('英字を含む');
    }

    // 数字チェック
    if (/\d/.test(password)) {
      score += 25;
    } else {
      feedback.push('数字を含む');
    }

    // 特殊文字チェック（追加の強度）
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // 長いパスワードにボーナス
    if (password.length >= 12) {
      score += 10;
    }

    let level: string;
    let color: string;

    if (score < 25) {
      level = '弱い';
      color = '#f44336';
    } else if (score < 50) {
      level = '普通';
      color = '#ff9800';
    } else if (score < 75) {
      level = '強い';
      color = '#4caf50';
    } else {
      level = '非常に強い';
      color = '#2196f3';
    }

    return {
      score: Math.min(score, 100),
      level,
      color,
      feedback:
        feedback.length > 0 ? `改善提案: ${feedback.join('、')}` : '✅ 安全なパスワードです',
    };
  };

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

    console.log('📤 Sending registration data:', data);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📥 Response status:', response.status);

      const result = await response.json();
      console.log('📥 Response body:', result);

      if (!response.ok) {
        console.error('❌ Registration failed:', result);
        throw new Error(result.error || 'ユーザー登録に失敗しました');
      }

      console.log('✅ Registration successful:', result);
      setSuccess(result.message);

      // Phase 2: メール認証が必須のため、ログインページではなくメール確認画面へ誘導
      // 自動リダイレクトはせず、ユーザーがメール認証を完了するまで待機
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err instanceof Error ? err.message : 'ユーザー登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsSocialLoading(provider);
    setError(null);

    try {
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (err) {
      console.error(`❌ ${provider} login error:`, err);
      setError(`${provider}ログインに失敗しました`);
      setIsSocialLoading(null);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 'auto' }}>
        <CardHeader>
          <Typography variant="h5" component="h1" gutterBottom>
            新規登録
          </Typography>
        </CardHeader>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {success && (
              <Alert severity="success">
                <Typography variant="body1" gutterBottom>
                  🎉 {success}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>次の手順:</strong>
                  <br />
                  1. ログインページに移動してください
                  <br />
                  2. 作成したアカウントでログインしてください
                  <br />
                  3. すぐにご利用いただけます
                </Typography>
              </Alert>
            )}

            {/* メールアドレス登録フォーム */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  {...register('name')}
                  label="名前"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  fullWidth
                  required
                  disabled={isLoading}
                />

                <TextField
                  {...register('email')}
                  type="email"
                  label="メールアドレス"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                  required
                  disabled={isLoading}
                />

                <TextField
                  {...register('password')}
                  id="register-password-field"
                  type={passwordVisibility.inputType}
                  label="パスワード"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  fullWidth
                  required
                  disabled={isLoading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    register('password').onChange(e);
                  }}
                  InputProps={{
                    endAdornment: passwordVisibility.showToggle ? (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={passwordVisibility.ariaLabel}
                          onClick={passwordVisibility.toggleVisibility}
                          edge="end"
                          disabled={isLoading}
                        >
                          {passwordVisibility.isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />

                {/* パスワード強度インジケーター */}
                {password && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        パスワード強度
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: calculatePasswordStrength(password).color,
                          fontWeight: 'bold',
                        }}
                      >
                        {calculatePasswordStrength(password).level}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculatePasswordStrength(password).score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: calculatePasswordStrength(password).color,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}
                    >
                      {calculatePasswordStrength(password).feedback}
                    </Typography>
                  </Box>
                )}

                <TextField
                  {...register('confirmPassword')}
                  id="register-confirm-password-field"
                  type={confirmPasswordVisibility.inputType}
                  label="パスワード（確認）"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  fullWidth
                  required
                  disabled={isLoading}
                  InputProps={{
                    endAdornment: confirmPasswordVisibility.showToggle ? (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={confirmPasswordVisibility.ariaLabel}
                          onClick={confirmPasswordVisibility.toggleVisibility}
                          edge="end"
                          disabled={isLoading}
                        >
                          {confirmPasswordVisibility.isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading || !!success || !!isSocialLoading}
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
              </Box>
            </form>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                または
              </Typography>
            </Divider>

            {/* ソーシャルログインボタン */}
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={isGoogleAuthEnabled ? () => handleSocialLogin('google') : undefined}
              disabled={
                !isGoogleAuthEnabled || isLoading || !!success || isSocialLoading === 'google'
              }
              sx={{
                borderColor: isGoogleAuthEnabled ? '#4285f4' : '#ccc',
                color: isGoogleAuthEnabled ? '#4285f4' : '#999',
                '&:hover': isGoogleAuthEnabled
                  ? {
                      borderColor: '#357ae8',
                      backgroundColor: 'rgba(66, 133, 244, 0.04)',
                    }
                  : {},
                cursor: isGoogleAuthEnabled ? 'pointer' : 'not-allowed',
              }}
            >
              {isSocialLoading === 'google' ? (
                <CircularProgress size={24} />
              ) : isGoogleAuthEnabled ? (
                'Googleで続ける'
              ) : (
                'Googleで続ける（開発中）'
              )}
            </Button>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<GitHubIcon />}
              onClick={isGitHubAuthEnabled ? () => handleSocialLogin('github') : undefined}
              disabled={
                !isGitHubAuthEnabled || isLoading || !!success || isSocialLoading === 'github'
              }
              sx={{
                borderColor: isGitHubAuthEnabled ? '#333' : '#ccc',
                color: isGitHubAuthEnabled ? '#333' : '#999',
                '&:hover': isGitHubAuthEnabled
                  ? {
                      borderColor: '#000',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  : {},
                cursor: isGitHubAuthEnabled ? 'pointer' : 'not-allowed',
              }}
            >
              {isSocialLoading === 'github' ? (
                <CircularProgress size={24} />
              ) : isGitHubAuthEnabled ? (
                'GitHubで続ける'
              ) : (
                'GitHubで続ける（開発中）'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                既にアカウントをお持ちの方は{' '}
                <Link href="/login" underline="hover">
                  ログイン
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
