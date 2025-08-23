'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AuthButton } from '@/components/auth/AuthButton';
import PostForm from '@/components/PostForm';
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
  hashtags?: string[];
  media?: Array<{
    mediaId: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    publicId?: string;
    title?: string;
    alt?: string;
    width?: number;
    height?: number;
    size?: number;
    mimeType?: string;
    hash?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const postId = params?.id as string;

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
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdated = () => {
    // 投稿更新後に詳細ページにリダイレクト
    router.push(`/board/${postId}`);
  };

  const handleEditCancel = () => {
    // キャンセル時は詳細ページに戻る
    router.push(`/board/${postId}`);
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <PostForm
          onPostCreated={handlePostUpdated}
          editingPost={{
            _id: post._id,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags,
            media: post.media?.map((media, index) => ({
              id: media.mediaId || `media-${index}-${Date.now()}`, // ユニークID確保
              type: media.type,
              url: media.url,
              thumbnailUrl: media.thumbnailUrl,
              title: media.title || '',
              alt: media.alt || '',
              publicId: media.publicId || '', // publicId復元
              size: media.size || 0,
              metadata: {
                originalName: media.title || '',
                mimeType: media.mimeType || '',
                width: media.width || 0,
                height: media.height || 0,
                hash: media.hash // SHA-256 ハッシュ値（重複防止用）
              }
            })) || []
          }}
          onEditCancel={handleEditCancel}
          showHashtags={true}
          showTitle={true}
          showMedia={true}
          maxHashtags={10}
        />
      </Container>
    </>
  );
}
