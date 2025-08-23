'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  AppBar,
  Toolbar,
  Divider,
  Alert,
  IconButton,
  Chip,
  // Card,
  // CardMedia,
  // CardContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { AuthButton } from '@/components/auth/AuthButton';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SafePostContent } from '@/components/SafeContent';
import CommentList from '@/components/comments/CommentList';
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
  media?: Array<{
    type: 'image' | 'video' | 'gif';
    url: string;
    thumbnailUrl?: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
  }>;
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
  const [backUrl, setBackUrl] = useState<string>(() => {
    // 初期状態でURLパラメータをチェック
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const from = urlParams.get('from');
      const sessionReferrer = sessionStorage.getItem('timeline_referrer');

      if (from === 'timeline') {
        // sessionStorageもクリア
        sessionStorage.removeItem('timeline_referrer');
        return '/timeline';
      }

      if (sessionReferrer === 'timeline') {
        sessionStorage.removeItem('timeline_referrer');
        return '/timeline';
      }
    }
    return '/board';
  });

  const postId = params?.id as string;
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
    // 初回マウント時に参照元を判断（状態初期化で処理されなかった場合のフォールバック）
    if (isInitialMount.current && backUrl === '/board') {
      determineBackUrl();
      isInitialMount.current = false;
    }
    // fetchPost is recreated on every render, so we don't include it in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, backUrl]);

  const determineBackUrl = () => {
    // sessionStorageから判断
    const sessionReferrer =
      typeof window !== 'undefined' ? sessionStorage.getItem('timeline_referrer') : null;

    if (sessionReferrer === 'timeline') {
      setBackUrl('/timeline');
      // sessionStorageをクリア
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('timeline_referrer');
      }
      return;
    }

    // document.referrerから参照元を判断（フォールバック）
    const referrer = document.referrer;

    if (referrer.includes('/timeline')) {
      setBackUrl('/timeline');
    } else {
      setBackUrl('/board');
    }
  };

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
      // いいね状態に応じてPOSTまたはDELETEを選択
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method,
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

      // 削除成功後、参照元に応じてリダイレクト
      router.push(backUrl);
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
  const isLiked = post?.likedBy?.includes(session?.user?.id || '') || false;

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
            <Button component={Link} href={backUrl} sx={{ mt: 2 }}>
              {backUrl === '/timeline' ? 'タイムラインに戻る' : '掲示板一覧に戻る'}
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
          <IconButton component={Link} href={backUrl} edge="start" color="inherit" sx={{ mr: 2 }}>
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
                  hyphens: 'auto',
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
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                whiteSpace: 'pre-wrap',
                '& *': {
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                },
              }}
            />
          </Box>

          {/* メディア表示 - Instagram風 */}
          {post.media && post.media.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                添付メディア
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gap: 1,
                gridTemplateColumns: {
                  xs: 'repeat(3, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)',
                  lg: 'repeat(5, 1fr)',
                  xl: 'repeat(6, 1fr)'
                }
              }}>
                {post.media.map((media: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      paddingTop: '100%', // 1:1 アスペクト比（正方形）
                      backgroundColor: '#000',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover': {
                        '& .media-overlay': {
                          opacity: 1
                        },
                        '& img, & video': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                    onClick={() => {
                      if (media.type === 'image') {
                        window.open(media.url, '_blank');
                      }
                    }}
                  >
                    {/* メディア表示 */}
                    {media.type === 'image' || media.type === 'gif' ? (
                      <Box
                        component="img"
                        src={media.thumbnailUrl || media.url}
                        alt={media.alt || media.title || '画像'}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    ) : (
                      <>
                        <Box
                          component="video"
                          src={media.url}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: 48,
                            color: 'white',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                            pointerEvents: 'none'
                          }}
                        >
                          ▶
                        </Box>
                      </>
                    )}
                    
                    {/* ホバーオーバーレイ */}
                    <Box
                      className="media-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: 1,
                        pointerEvents: 'none'
                      }}
                    >
                      {(media.title || media.alt) && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'white',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%'
                          }}
                        >
                          {media.title || media.alt}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

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
          <Box
            sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Button
              component={Link}
              href={backUrl}
              variant="outlined"
              startIcon={<ArrowBackIcon />}
            >
              {backUrl === '/timeline' ? 'タイムラインに戻る' : '一覧に戻る'}
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
                  startIcon={
                    deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />
                  }
                  color="error"
                  disabled={deleting}
                >
                  {deleting ? '削除中...' : '削除'}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>

        {/* コメント欄 */}
        <Paper sx={{ p: 4, mt: 3 }}>
          <CommentList postId={post._id} />
        </Paper>
      </Container>
    </>
  );
}
