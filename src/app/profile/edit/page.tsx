'use client';

import { useState, useEffect } from 'react';
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
  AppBar,
  Toolbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { AuthButton } from '@/components/auth/AuthButton';
import Link from 'next/link';

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '', // 表示のみ（変更不可）
  });

  const [charCount, setCharCount] = useState({
    name: 0,
    bio: 0,
  });

  // プロフィール取得
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'プロフィールの取得に失敗しました');
      }

      setFormData({
        name: data.user.name || '',
        bio: data.user.bio || '',
        email: data.user.email || '',
      });

      setCharCount({
        name: data.user.name?.length || 0,
        bio: data.user.bio?.length || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: 'name' | 'bio') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 文字数制限チェック
    if (field === 'name' && value.length > 50) return;
    if (field === 'bio' && value.length > 200) return;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setCharCount((prev) => ({
      ...prev,
      [field]: value.length,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // バリデーション
    if (!formData.name.trim()) {
      setError('名前は必須です');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          bio: formData.bio.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'プロフィールの更新に失敗しました');
      }

      setSuccess('プロフィールを更新しました');

      // 2秒後にプロフィールページに戻る
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              プロフィール編集
            </Typography>
            <AuthButton />
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            プロフィール編集
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            プロフィール編集
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* アバタープレビュー */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <ProfileAvatar name={formData.name} size="large" />
                <Typography variant="body2" color="text.secondary">
                  アバターは名前の頭文字が自動的に表示されます
                </Typography>
              </Box>

              {/* 名前 */}
              <TextField
                label="名前"
                value={formData.name}
                onChange={handleChange('name')}
                required
                fullWidth
                disabled={saving}
                helperText={`${charCount.name}/50文字`}
                error={charCount.name > 50}
              />

              {/* メールアドレス（変更不可） */}
              <TextField
                label="メールアドレス"
                value={formData.email}
                fullWidth
                disabled
                helperText="メールアドレスは変更できません"
              />

              {/* 自己紹介 */}
              <TextField
                label="自己紹介"
                value={formData.bio}
                onChange={handleChange('bio')}
                multiline
                rows={4}
                fullWidth
                disabled={saving}
                helperText={`${charCount.bio}/200文字`}
                error={charCount.bio > 200}
                placeholder="あなたについて教えてください（任意）"
              />

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
                  disabled={saving || !formData.name.trim()}
                >
                  {saving ? '保存中...' : '保存'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
    </>
  );
}
