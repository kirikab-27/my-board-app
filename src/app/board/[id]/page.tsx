'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  CircularProgress,
  AppBar,
  Toolbar,
  Divider,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { AuthButton } from '@/components/auth/AuthButton';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SafePostContent } from '@/components/SafeContent';
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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postId = params?.id as string;

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '投稿の取得に失敗しました');
      }

      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post || liking) return;

    setLiking(true);

    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'いいね操作に失敗しました');
      }

      // 投稿データを更新
      setPost({ ...post, likes: data.likes, likedBy: data.likedBy });
    } catch (err) {
      console.error('いいねエラー:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!post || deleting || !session?.user?.id) return;

    if (!confirm('この投稿を削除しますか？この操作は取り消せません。')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '投稿の削除に失敗しました');
      }

      // 削除成功後、掲示板一覧にリダイレクト
      router.push('/board');
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿の削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAuthor = session?.user?.id === post?.userId;
  const isLiked = post?.likedBy.includes(session?.user?.id || '');

  if (loading) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              投稿詳細
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

  if (error || !post) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              投稿詳細
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
            href="/board"
            edge="start"
            color="inherit"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            投稿詳細
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          {/* タイトル */}
          {post.title && (
            <>
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}
              >
                {post.title}
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </>
          )}

          {/* 作成者情報 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ProfileAvatar name={post.authorName || '匿名ユーザー'} size="medium" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">{post.authorName || '匿名ユーザー'}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(post.createdAt)}
                  {post.updatedAt !== post.createdAt && (
                    <> (編集済み: {formatDate(post.updatedAt)})</>
                  )}
                </Typography>
              </Box>
            </Box>

            {/* いいねボタン */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={handleLike}
                disabled={liking}
                color={isLiked ? 'error' : 'default'}
                size="large"
              >
                {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <Typography variant="body1" color="text.secondary">
                {post.likes}
              </Typography>
            </Box>
          </Box>

          {/* 投稿内容 - XSS対策済み */}
          <Box sx={{ mb: 4 }}>
            <SafePostContent 
              content={post.content}
              sx={{ 
                fontSize: '1.1rem', 
                lineHeight: 1.8,
                '& *': {
                  fontSize: 'inherit',
                  lineHeight: 'inherit'
                }
              }}
            />
          </Box>

          {/* 公開設定表示 */}
          <Box sx={{ mb: 3 }}>
            <Chip
              label={post.isPublic ? '公開投稿' : '限定投稿'}
              color={post.isPublic ? 'primary' : 'secondary'}
              size="small"
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* アクションボタン */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              component={Link}
              href="/board"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
            >
              一覧に戻る
            </Button>

            {isAuthor && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component={Link}
                  href={`/board/${post._id}/edit`}
                  variant="contained"
                  startIcon={<EditIcon />}
                  color="primary"
                >
                  編集
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outlined"
                  startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                  color="error"
                  disabled={deleting}
                >
                  {deleting ? '削除中...' : '削除'}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
}