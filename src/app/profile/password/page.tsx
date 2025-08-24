'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Stack,
  CircularProgress,
  LinearProgress,
  InputAdornment,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import { AuthButton } from '@/components/auth/AuthButton';
import Link from 'next/link';

export default function PasswordChangePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // パスワード強度計算
  const calculatePasswordStrength = (password: string) => {
    if (!password) return { score: 0, level: '入力してください', color: '#ccc' };

    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score += 25;
    else feedback.push('8文字以上');

    if (/[a-zA-Z]/.test(password)) score += 25;
    else feedback.push('英字を含む');

    if (/\d/.test(password)) score += 25;
    else feedback.push('数字を含む');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

    if (password.length >= 12) score += 10;

    let level: string, color: string;
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

  const passwordStrength = calculatePasswordStrength(formData.newPassword);

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // バリデーション
    if (!formData.currentPassword) {
      setError('現在のパスワードを入力してください');
      return;
    }

    if (!formData.newPassword) {
      setError('新しいパスワードを入力してください');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('新しいパスワードは8文字以上で入力してください');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('新しいパスワードは現在のパスワードと異なるものにしてください');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'パスワードの変更に失敗しました');
      }

      setSuccess('パスワードを変更しました');

      // フォームリセット
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // 3秒後にプロフィールページに戻る
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードの変更に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              パスワード変更
            </Typography>
            <AuthButton />
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: { xs: 10, sm: 12, md: 12 } }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            パスワード変更
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 10, sm: 12, md: 12 }, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <LockIcon color="primary" />
            <Typography variant="h4">パスワード変更</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
              <br />
              <Typography variant="body2" sx={{ mt: 1 }}>
                3秒後にプロフィールページに戻ります...
              </Typography>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* 現在のパスワード */}
              <TextField
                label="現在のパスワード"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange('currentPassword')}
                required
                fullWidth
                disabled={saving}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('current')}
                        disabled={saving}
                        edge="end"
                      >
                        {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* 新しいパスワード */}
              <TextField
                label="新しいパスワード"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange('newPassword')}
                required
                fullWidth
                disabled={saving}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('new')}
                        disabled={saving}
                        edge="end"
                      >
                        {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* パスワード強度インジケーター */}
              {formData.newPassword && (
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
                      sx={{ color: passwordStrength.color, fontWeight: 'bold' }}
                    >
                      {passwordStrength.level}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.score}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: passwordStrength.color,
                        borderRadius: 3,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}
                  >
                    {passwordStrength.feedback}
                  </Typography>
                </Box>
              )}

              {/* 新しいパスワード（確認） */}
              <TextField
                label="新しいパスワード（確認）"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required
                fullWidth
                disabled={saving}
                error={
                  !!(formData.confirmPassword && formData.newPassword !== formData.confirmPassword)
                }
                helperText={
                  formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                    ? 'パスワードが一致しません'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirm')}
                        disabled={saving}
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* 注意事項 */}
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>パスワードの要件:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • 8文字以上
                  <br />
                  • 英字と数字を含む
                  <br />• 特殊文字を含むとより安全
                </Typography>
              </Alert>

              {/* ボタン */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  component={Link}
                  href="/profile"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  disabled={saving}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={
                    saving ||
                    !formData.currentPassword ||
                    !formData.newPassword ||
                    !formData.confirmPassword ||
                    formData.newPassword !== formData.confirmPassword
                  }
                >
                  {saving ? '変更中...' : 'パスワードを変更'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
    </>
  );
}
