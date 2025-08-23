'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Button,
  Box,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Alert,
  Link as MuiLink
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  CalendarToday as CalendarTodayIcon,
  LocationOn as LocationOnIcon,
  Link as LinkIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';

interface Post {
  _id: string;
  title?: string;
  content: string;
  likes: number;
  likedBy: string[];
  userId: string;
  authorName: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  media?: any[];
}

interface UserProfile {
  _id: string;
  username: string;
  name: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  isVerified: boolean;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  posts: Post[];
  user: UserProfile;
  pagination: PaginationInfo;
}

type SortOption = 'createdAt_desc' | 'createdAt_asc' | 'likes_desc' | 'likes_asc' | 'updatedAt_desc' | 'updatedAt_asc';

export default function UserPostsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = params.username as string;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // URL パラメータの状態管理
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');
  const [limit] = useState(10);

  // URL パラメータから初期状態を設定
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const sort = (searchParams.get('sort') || 'createdAt_desc') as SortOption;
    
    setCurrentPage(page);
    setSortOption(sort);
  }, [searchParams]);

  // データ取得関数
  const fetchUserPosts = useCallback(async (page: number, sort: SortOption) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort
      });

      const response = await fetch(`/api/users/${username}/posts?${params}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('ユーザーが見つかりません');
        }
        throw new Error('投稿の取得に失敗しました');
      }

      const data: ApiResponse = await response.json();
      setData(data);

      // URL 更新（ブラウザ履歴に追加）
      const newParams = new URLSearchParams();
      if (page > 1) newParams.set('page', page.toString());
      if (sort !== 'createdAt_desc') newParams.set('sort', sort);
      
      const newUrl = `/users/${username}/posts${newParams.toString() ? `?${newParams.toString()}` : ''}`;
      window.history.replaceState(null, '', newUrl);

    } catch (error) {
      console.error('ユーザー投稿取得エラー:', error);
      setError(error instanceof Error ? error.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [username, limit]);

  // 初回データ取得
  useEffect(() => {
    if (username) {
      fetchUserPosts(currentPage, sortOption);
    }
  }, [username, currentPage, sortOption, fetchUserPosts]);

  // ページ変更ハンドラー
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // ソート変更ハンドラー
  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
    setCurrentPage(1); // ソート変更時は1ページ目に戻る
  };

  // 戻るボタンハンドラー
  const handleBackToSearch = () => {
    // 検索ページのクエリを保持して戻る
    const searchQuery = sessionStorage.getItem('lastSearchQuery');
    if (searchQuery) {
      router.push(`/users/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/users/search');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            投稿を読み込み中...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || '投稿の取得に失敗しました'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToSearch}
        >
          検索画面に戻る
        </Button>
      </Container>
    );
  }

  const { user, posts, pagination } = data;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* 戻るボタン */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToSearch}
        >
          検索結果に戻る
        </Button>
      </Box>

      {/* ユーザープロフィール */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="flex-start" gap={3}>
            {/* アバター */}
            <Avatar
              src={user.avatar}
              sx={{ width: 80, height: 80, fontSize: '2rem' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>

            {/* プロフィール情報 */}
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h5" component="h1">
                  {user.displayName || user.name}
                </Typography>
                {user.isVerified && (
                  <VerifiedIcon color="primary" />
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                @{user.username}
              </Typography>

              {user.bio && (
                <Typography variant="body1" paragraph>
                  {user.bio}
                </Typography>
              )}

              <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                {user.location && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {user.location}
                    </Typography>
                  </Box>
                )}
                {user.website && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LinkIcon fontSize="small" color="action" />
                    <MuiLink
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                    >
                      {user.website}
                    </MuiLink>
                  </Box>
                )}
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(user.createdAt), 'yyyy年MM月', { locale: ja })}に参加
                  </Typography>
                </Box>
              </Box>

              {/* 統計情報 */}
              <Box display="flex" gap={3}>
                <Typography variant="body2">
                  <strong>{user.stats.postsCount}</strong> 投稿
                </Typography>
                <Typography variant="body2">
                  <strong>{user.stats.followingCount}</strong> フォロー中
                </Typography>
                <Typography variant="body2">
                  <strong>{user.stats.followersCount}</strong> フォロワー
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 投稿一覧ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" component="h2">
          投稿一覧 ({pagination.totalCount}件)
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>並び替え</InputLabel>
          <Select
            value={sortOption}
            label="並び替え"
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
          >
            <MenuItem value="createdAt_desc">新しい順</MenuItem>
            <MenuItem value="createdAt_asc">古い順</MenuItem>
            <MenuItem value="likes_desc">いいね数順</MenuItem>
            <MenuItem value="updatedAt_desc">更新順</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 投稿一覧 */}
      {posts.length === 0 ? (
        <Alert severity="info">
          まだ投稿がありません
        </Alert>
      ) : (
        <Box sx={{ mb: 4 }}>
          {posts.map((post) => (
            <Card key={post._id} sx={{ 
              mb: 2, 
              overflow: 'hidden',
              '&:hover': {
                elevation: 3,
                backgroundColor: 'action.hover',
              }
            }}>
              <CardHeader
                title={
                  <Link href={`/board/${post._id}`} style={{ textDecoration: 'none' }}>
                    <Typography 
                      variant="h6" 
                      color="primary" 
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { textDecoration: 'underline' },
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                      }}
                    >
                      {post.title || '無題'}
                    </Typography>
                  </Link>
                }
                subheader={format(new Date(post.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                {/* 投稿内容（プレビュー）- テキスト省略表示 */}
                <Box
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: post.title ? 3 : 5, // タイトルありなら3行、なしなら5行
                    WebkitBoxOrient: 'vertical',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    {post.likes > 0 ? (
                      <FavoriteIcon color="error" fontSize="small" />
                    ) : (
                      <FavoriteBorderIcon color="action" fontSize="small" />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {post.likes}
                    </Typography>
                  </Box>
                  
                  {!post.isPublic && (
                    <Chip label="非公開" size="small" color="secondary" />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={pagination.totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
}