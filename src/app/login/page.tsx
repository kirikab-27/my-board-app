'use client';

import { useState, useEffect, useId } from 'react';
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
  Link,
  CircularProgress,
  Container,
  Divider,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginSchema } from '@/lib/validations/auth';
import { signIn } from 'next-auth/react';
import { usePasswordVisibility } from '@/hooks/usePasswordVisibility';
import {
  IconButton,
  InputAdornment,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface RateLimitInfo {
  remainingAttempts: number;
  totalAttempts: number;
  maxAttempts: number;
  isLocked: boolean;
  lockUntil: number | null;
  nextLockDuration: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [showAttemptWarning, setShowAttemptWarning] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータからcallbackUrlを取得
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  // OAuth設定の有効性をチェック（環境変数の存在確認）
  // 本番環境でOAuthを有効にする場合は、環境変数を設定してください
  const isGoogleAuthEnabled = false; // 開発中のため無効化
  const isGitHubAuthEnabled = false; // 開発中のため無効化

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const watchedEmail = watch('email');
  
  // 🚨 緊急対応: 特定ユーザーの判定
  const emergencyUsers = [
    'akirafunakoshi.actrys+week2-test-001@gmail.com',
    'kab27kav+test002@gmail.com'
  ];
  const isEmergencyUser = watchedEmail && emergencyUsers.includes(watchedEmail.toLowerCase());
  
  // Issue #42: パスワード表示切り替え機能（React 18 useId使用）
  const passwordFieldId = useId();
  const { isVisible, toggleVisibility, inputType, ariaLabel, showToggle } = usePasswordVisibility();

  // レート制限情報を取得
  const fetchRateLimitInfo = async (email: string) => {
    if (!email) return;

    try {
      const response = await fetch(`/api/auth/rate-limit?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRateLimitInfo(data.data.user);

          // 残り試行回数が少ない場合は警告表示
          if (data.data.user.remainingAttempts <= 2 && data.data.user.totalAttempts > 0) {
            setShowAttemptWarning(true);
          }
        }
      }
    } catch (error) {
      console.error('レート制限情報取得エラー:', error);
    }
  };

  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    setError(null);

    try {
      // 🚨 緊急対応: 特定ユーザーはパスワード内容無視
      const emergencyUsers = [
        'akirafunakoshi.actrys+week2-test-001@gmail.com',
        'kab27kav+test002@gmail.com'
      ];
      
      let passwordToUse = data.password;
      
      if (emergencyUsers.includes(data.email.toLowerCase())) {
        // パスワードが空の場合はダミーパスワードを設定、入力されている場合はそのまま使用
        passwordToUse = data.password || 'any-password-works';
        console.log('🚨 [CLIENT] 緊急ユーザー検出 - パスワード内容無視:', {
          email: data.email,
          passwordProvided: !!data.password
        });
      }

      console.log('🔍 [CLIENT DEBUG] signIn実行開始:', {
        email: data.email,
        isEmergencyUser: emergencyUsers.includes(data.email.toLowerCase()),
        passwordLength: passwordToUse?.length || 0
      });

      const result = await signIn('credentials', {
        email: data.email,
        password: passwordToUse,
        redirect: false,
      });

      console.log('🔍 [CLIENT DEBUG] signIn結果:', {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url,
        fullResult: result
      });

      if (result?.error) {
        // レート制限エラーの特別処理
        if (result.error.includes('RATE_LIMIT_ERROR:')) {
          const actualError = result.error.replace('RATE_LIMIT_ERROR:', '');
          setError(actualError);
        } else if (result.error === 'CredentialsSignin') {
          setError('メールアドレスまたはパスワードが正しくありません');
        } else {
          setError('ログインに失敗しました');
        }

        // ログイン失敗後、レート制限情報を更新
        await fetchRateLimitInfo(data.email);
      } else if (result?.ok) {
        // callbackUrlがあればそこにリダイレクト、なければdashboardへ
        const redirectTo = decodeURIComponent(callbackUrl);
        router.push(redirectTo);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // メールアドレス変更時にレート制限情報を取得
  useEffect(() => {
    if (watchedEmail && watchedEmail.includes('@')) {
      const timer = setTimeout(() => {
        fetchRateLimitInfo(watchedEmail);
      }, 500); // デバウンス

      return () => clearTimeout(timer);
    } else {
      setRateLimitInfo(null);
      setShowAttemptWarning(false);
    }
  }, [watchedEmail]);

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsSocialLoading(provider);
    setError(null);

    try {
      // callbackUrlを引き継いでソーシャルログイン
      const redirectTo = decodeURIComponent(callbackUrl);
      await signIn(provider, { callbackUrl: redirectTo });
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
            ログイン
          </Typography>
        </CardHeader>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* レート制限警告 */}
            {showAttemptWarning && rateLimitInfo && !rateLimitInfo.isLocked && (
              <Alert severity="warning">
                <strong>注意:</strong> あと{rateLimitInfo.remainingAttempts}回間違えると、
                アカウントが{rateLimitInfo.nextLockDuration}ロックされます。
              </Alert>
            )}

            {/* ブロック状態表示 */}
            {rateLimitInfo?.isLocked && (
              <Alert severity="error">
                <strong>アカウントロック中:</strong>
                {rateLimitInfo.lockUntil && (
                  <> {new Date(rateLimitInfo.lockUntil).toLocaleString()} まで</>
                )}
              </Alert>
            )}

            {/* 試行回数表示（デバッグ用・開発時のみ） */}
            {rateLimitInfo && !rateLimitInfo.isLocked && rateLimitInfo.totalAttempts > 0 && (
              <Box
                sx={{
                  p: 1,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                }}
              >
                試行状況: {rateLimitInfo.totalAttempts}/{rateLimitInfo.maxAttempts}
                （残り{rateLimitInfo.remainingAttempts}回）
              </Box>
            )}

            {/* メールアドレスログインフォーム */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  {...register('email')}
                  type="email"
                  label="メールアドレス"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                  required
                  disabled={isLoading || !!isSocialLoading}
                />

                {isEmergencyUser && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    🚨 緊急アクセス対応中: このアカウントはパスワード内容に関係なくログインできます。任意の文字を入力してください。
                  </Alert>
                )}
                
                <TextField
                  {...register('password')}
                  id={passwordFieldId}
                  type={inputType}
                  label="パスワード"
                  error={!!errors.password}
                  helperText={isEmergencyUser ? "任意の文字を入力してください（内容は無視されます）" : errors.password?.message}
                  fullWidth
                  required
                  disabled={isLoading || !!isSocialLoading}
                  placeholder={isEmergencyUser ? "任意の文字（例：test）" : undefined}
                  InputProps={{
                    endAdornment: showToggle ? (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={ariaLabel}
                          onClick={toggleVisibility}
                          edge="end"
                          disabled={isLoading || !!isSocialLoading}
                        >
                          {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading || !!isSocialLoading}
                  fullWidth
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'ログイン'}
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
              disabled={!isGoogleAuthEnabled || isLoading || isSocialLoading === 'google'}
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
              disabled={!isGitHubAuthEnabled || isLoading || isSocialLoading === 'github'}
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <Link href="/auth/forgot-password" underline="hover">
                  パスワードを忘れた方
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                アカウントをお持ちでない方は{' '}
                <Link href="/register" underline="hover">
                  新規登録
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
