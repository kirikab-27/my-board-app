'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Tag as TagIcon,
  TrendingUp,
  Verified,
  Share,
  Bookmark,
  ArrowBack,
  Forum,
  People,
  Whatshot
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import PostList from '@/components/PostList';
import { ProfileHeader } from '@/components/profile/ProfileHeader';

interface HashtagDetail {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  stats: {
    totalPosts: number;
    totalComments: number;
    uniqueUsers: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
    trendScore: number;
    lastUsed?: Date;
  };
  isTrending: boolean;
  isOfficial: boolean;
  createdAt: Date;
  relatedTags?: Array<{
    tagName: string;
    correlation: number;
  }>;
}

export default function HashtagDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tagName = params.tag as string;
  
  const [hashtag, setHashtag] = useState<HashtagDetail | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [relatedHashtags, setRelatedHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);

  // ハッシュタグ詳細取得
  const fetchHashtagDetail = async () => {
    if (!tagName) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/hashtags/${encodeURIComponent(tagName)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ハッシュタグの詳細取得に失敗しました');
      }

      setHashtag(data.hashtag);
      setRelatedHashtags(data.relatedHashtags || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // ハッシュタグ別投稿取得
  const fetchHashtagPosts = async () => {
    if (!tagName) return;

    setPostsLoading(true);

    try {
      const response = await fetch(`/api/hashtags/${encodeURIComponent(tagName)}/posts?limit=20&sortBy=createdAt&order=desc`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '投稿の取得に失敗しました');
      }

      setPosts(data.posts || []);
    } catch (error) {
      console.error('投稿取得エラー:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (tagName) {
      fetchHashtagDetail();
      fetchHashtagPosts();
    }
  }, [tagName]);

  // フォロー切り替え
  const handleFollowToggle = async () => {
    setFollowing(!following);
    // TODO: フォロー機能の実装
  };

  // 関連ハッシュタグクリック
  const handleRelatedClick = (relatedTag: string) => {
    router.push(`/hashtags/${encodeURIComponent(relatedTag)}`);
  };

  // シェア機能
  const handleShare = async () => {
    if (navigator.share && hashtag) {
      try {
        await navigator.share({
          title: `#${hashtag.displayName}`,
          text: hashtag.description || `#${hashtag.displayName}の投稿をチェック`,
          url: window.location.href
        });
      } catch (error) {
        console.log('シェアがキャンセルされました');
      }
    } else {
      // フォールバック：URLをクリップボードにコピー
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // カテゴリ色取得
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' } = {
      technology: 'primary',
      entertainment: 'secondary',
      sports: 'success',
      news: 'warning',
      lifestyle: 'info',
      business: 'error'
    };
    return colors[category] || 'default';
  };

  // トレンドスコア色取得
  const getTrendColor = (score: number) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'info';
    return 'primary';
  };

  if (loading) {
    return (
      <>
        <ProfileHeader title="ハッシュタグ" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ProfileHeader title="ハッシュタグ" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" onClick={() => router.back()}>
                戻る
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      </>
    );
  }

  if (!hashtag) {
    return (
      <>
        <ProfileHeader title="ハッシュタグ" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="info">
            ハッシュタグが見つかりませんでした
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <ProfileHeader title="ハッシュタグ" />
      <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 戻るボタン */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          variant="outlined"
          size="small"
        >
          戻る
        </Button>
      </Box>

      {/* ハッシュタグヘッダー */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            {/* タイトルとバッジ */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h3" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TagIcon fontSize="large" />
                #{hashtag.displayName}
              </Typography>
              
              {hashtag.isOfficial && <Verified color="primary" />}
              
              {hashtag.isTrending && (
                <Chip 
                  icon={<TrendingUp />}
                  label={`トレンド ${hashtag.stats.trendScore}`}
                  color={getTrendColor(hashtag.stats.trendScore)}
                />
              )}
              
              <Chip 
                label={hashtag.category} 
                color={getCategoryColor(hashtag.category)}
              />
            </Box>

            {/* 説明 */}
            {hashtag.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: '70%' }}>
                {hashtag.description}
              </Typography>
            )}

            {/* 統計情報 */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <TagIcon />
                  {hashtag.stats.totalPosts.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  投稿数
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Forum />
                  {hashtag.stats.totalComments.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  コメント数
                </Typography>
              </Box>

              <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <People />
                  {hashtag.stats.uniqueUsers.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  参加ユーザー
                </Typography>
              </Box>

              <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <TrendingUp />
                  {hashtag.stats.weeklyGrowth > 0 ? '+' : ''}{hashtag.stats.weeklyGrowth.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  週間成長率
                </Typography>
              </Box>
            </Box>

            {/* 最終使用日時 */}
            <Typography variant="caption" color="text.secondary">
              最終使用: {hashtag.stats.lastUsed 
                ? formatDistanceToNow(new Date(hashtag.stats.lastUsed), { addSuffix: true, locale: ja })
                : '不明'
              }
            </Typography>
          </Box>

          {/* アクションボタン */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant={following ? 'outlined' : 'contained'}
              onClick={handleFollowToggle}
              startIcon={<Bookmark />}
              size="small"
            >
              {following ? 'フォロー解除' : 'フォローする'}
            </Button>
            
            <Tooltip title="シェア">
              <IconButton onClick={handleShare}>
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* 関連ハッシュタグ */}
      {relatedHashtags.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🔗 関連するハッシュタグ
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {relatedHashtags.map((relatedTag, index) => (
              <Chip
                key={index}
                label={`#${relatedTag}`}
                clickable
                onClick={() => handleRelatedClick(relatedTag)}
                size="small"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* 投稿リスト */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            📝 #{hashtag.displayName} の投稿
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {posts.length}件の投稿
          </Typography>
        </Box>

        {postsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <TagIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              まだ投稿がありません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              #{hashtag.displayName} を使って最初の投稿をしてみませんか？
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => router.push('/board/create')}
            >
              投稿する
            </Button>
          </Box>
        ) : (
          <PostList 
            posts={posts}
            onRefresh={() => fetchHashtagPosts()}
            onEditPost={() => {}}
          />
        )}
      </Paper>

      {/* トレンド詳細（トレンド中のみ表示） */}
      {hashtag.isTrending && (
        <Card sx={{ mt: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Whatshot />
              🔥 トレンド情報
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="body2">
                  <strong>トレンドスコア:</strong> {hashtag.stats.trendScore}/100
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="body2">
                  <strong>週間成長率:</strong> +{hashtag.stats.weeklyGrowth.toFixed(1)}%
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="body2">
                  <strong>月間成長率:</strong> +{hashtag.stats.monthlyGrowth.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
      </Container>
    </>
  );
}