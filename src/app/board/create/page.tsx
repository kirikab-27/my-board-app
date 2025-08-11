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
  AppBar,
  Toolbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { AuthButton } from '@/components/auth/AuthButton';
import Link from 'next/link';

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPublic: true,
  });

  const [charCount, setCharCount] = useState({
    title: 0,
    content: 0,
  });

  const handleChange = (field: 'title' | 'content') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 文字数制限チェック
    if (field === 'title' && value.length > 100) return;
    if (field === 'content' && value.length > 1000) return;

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
    if (!formData.content.trim()) {
      setError('投稿内容は必須です');
      return;
    }

    if (formData.content.length > 1000) {
      setError('投稿内容は1000文字以内で入力してください');
      return;
    }

    if (formData.title && formData.title.length > 100) {
      setError('タイトルは100文字以内で入力してください');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim() || undefined,
          content: formData.content.trim(),
          isPublic: formData.isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '投稿の作成に失敗しました');
      }

      setSuccess('投稿を作成しました');

      // 2秒後に投稿詳細ページまたは掲示板一覧にリダイレクト
      setTimeout(() => {
        router.push(`/board/${data._id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿の作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              投稿作成
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

  if (!session) {
    router.push('/login?callbackUrl=/board/create');
    return null;
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            投稿作成
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <PostAddIcon color="primary" />
            <Typography variant="h4">新しい投稿を作成</Typography>
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
                2秒後に投稿詳細ページに移動します...
              </Typography>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* タイトル */}
              <TextField
                label="タイトル（任意）"
                value={formData.title}
                onChange={handleChange('title')}
                fullWidth
                disabled={saving}
                helperText={`${charCount.title}/100文字`}
                error={charCount.title > 100}
                placeholder="投稿のタイトルを入力してください"
              />

              {/* 投稿内容 */}
              <TextField
                label="投稿内容"
                value={formData.content}
                onChange={handleChange('content')}
                multiline
                rows={8}
                required
                fullWidth
                disabled={saving}
                helperText={`${charCount.content}/1000文字`}
                error={charCount.content > 1000}
                placeholder="投稿内容を入力してください"
              />

              {/* 注意事項 */}
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>投稿について:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • タイトルは任意ですが、100文字以内で入力してください
                  <br />
                  • 投稿内容は必須で、1000文字以内で入力してください
                  <br />• 投稿はすべての会員に公開されます
                </Typography>
              </Alert>

              {/* ボタン */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  component={Link}
                  href="/board"
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
                  disabled={saving || !formData.content.trim()}
                >
                  {saving ? '投稿中...' : '投稿する'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
    </>
  );
}