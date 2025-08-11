'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  IconButton,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { AuthButton } from '@/components/auth/AuthButton';
import Link from 'next/link';

interface Post {
  _id: string;
  title?: string;
  content: string;
  likes: number;
  likedBy: string[];
  userId?: string;
  authorName?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const postId = params?.id as string;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPublic: true,
  });

  const [charCount, setCharCount] = useState({
    title: 0,
    content: 0,
  });

  useEffect(() => {
    if (postId && session?.user?.id) {
      fetchPost();
    }
    // fetchPost is recreated on every render, so we don't include it in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, session]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '投稿の取得に失敗しました');
      }

      // 投稿者本人確認
      if (data.userId !== session?.user?.id) {
        setError('この投稿を編集する権限がありません');
        return;
      }

      setPost(data);
      setFormData({
        title: data.title || '',
        content: data.content || '',
        isPublic: data.isPublic,
      });
      setCharCount({
        title: (data.title || '').length,
        content: (data.content || '').length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

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
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
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
        throw new Error(data.error || '投稿の更新に失敗しました');
      }

      setSuccess('投稿を更新しました');

      // 2秒後に投稿詳細ページにリダイレクト
      setTimeout(() => {
        router.push(`/board/${postId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿の更新に失敗しました');
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
              投稿編集
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
    router.push(`/login?callbackUrl=/board/${postId}/edit`);
    return null;
  }

  if (error || !post) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              投稿編集
            </Typography>
            <AuthButton />
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error">
            {error || '投稿が見つかりません'}
            <br />
            <Button component={Link} href="/board" sx={{ mt: 2 }}>
              掲示板一覧に戻る
            </Button>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            component={Link}
            href={`/board/${postId}`}
            edge="start"
            color="inherit"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            投稿編集
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <EditIcon color="primary" />
            <Typography variant="h4">投稿を編集</Typography>
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
                2秒後に投稿詳細ページに戻ります...
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
                sx={{
                  '& .MuiInputBase-input': {
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  },
                }}
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
                sx={{
                  '& .MuiInputBase-input': {
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                  },
                }}
              />

              {/* 注意事項 */}
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>編集について:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • タイトルは任意ですが、100文字以内で入力してください
                  <br />
                  • 投稿内容は必須で、1000文字以内で入力してください
                  <br />• 編集した投稿は更新日時が記録されます
                </Typography>
              </Alert>

              {/* ボタン */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  component={Link}
                  href={`/board/${postId}`}
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
                  {saving ? '更新中...' : '更新する'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
    </>
  );
}
