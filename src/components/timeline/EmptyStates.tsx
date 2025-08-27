'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  PersonAdd,
  Refresh,
  Search,
  Create,
  Explore,
  People,
  TrendingUp,
  Circle as CircleIcon
} from '@mui/icons-material';

// 空のタイムライン
interface EmptyTimelineProps {
  onRefresh?: () => void;
  followingCount?: number;
  showSuggestions?: boolean;
}

export function EmptyTimeline({ 
  onRefresh, 
  followingCount = 0,
  showSuggestions = true 
}: EmptyTimelineProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const suggestions = [
    {
      icon: <People />,
      title: '新しい人をフォロー',
      description: '興味のある人をフォローして、タイムラインを充実させましょう',
      action: () => router.push('/board'),
      buttonText: 'ユーザーを探す'
    },
    {
      icon: <Create />,
      title: '最初の投稿をシェア',
      description: 'あなたの考えや体験を投稿してみましょう',
      action: () => router.push('/board/create'),
      buttonText: '投稿する'
    },
    {
      icon: <Explore />,
      title: '掲示板を探索',
      description: '他のユーザーの投稿を見て、気に入った人をフォローしましょう',
      action: () => router.push('/board'),
      buttonText: '探索する'
    }
  ];

  return (
    <Box py={4}>
      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`
        }}
      >
        <TimelineIcon 
          sx={{ 
            fontSize: 80, 
            color: theme.palette.text.secondary,
            mb: 2 
          }} 
        />
        
        <Typography variant="h4" gutterBottom fontWeight="bold">
          タイムラインを始めましょう
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mx: 'auto' }}>
          {followingCount === 0 
            ? 'まだ誰もフォローしていません。興味のある人をフォローして、タイムラインを充実させましょう。'
            : 'フォローしている人がまだ投稿をしていません。しばらく時間をおいてから確認してみてください。'
          }
        </Typography>

        <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap" mb={3}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={onRefresh}
          >
            更新
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<PersonAdd />}
            onClick={() => router.push('/board')}
          >
            新しい人をフォロー
          </Button>
        </Box>

        {showSuggestions && (
          <>
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              おすすめのアクション
            </Typography>
            
            <Stack 
              direction={isMobile ? 'column' : 'row'} 
              spacing={2} 
              justifyContent="center"
              sx={{ mt: 2 }}
            >
              {suggestions.map((suggestion, index) => (
                <Card 
                  key={index} 
                  sx={{ 
                    maxWidth: 280,
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={suggestion.action}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                      {suggestion.icon}
                    </Box>
                    
                    <Typography variant="h6" gutterBottom fontSize="1rem">
                      {suggestion.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {suggestion.description}
                    </Typography>
                    
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        suggestion.action();
                      }}
                    >
                      {suggestion.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
}

// ネットワークエラー状態
interface NetworkErrorProps {
  onRetry?: () => void;
  isOffline?: boolean;
}

export function NetworkError({ onRetry, isOffline = false }: NetworkErrorProps) {
  const theme = useTheme();

  return (
    <Box py={4}>
      <Card sx={{ textAlign: 'center', p: 4 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: theme.palette.error.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3
          }}
        >
          <CircleIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />
        </Box>
        
        <Typography variant="h5" gutterBottom>
          {isOffline ? 'オフラインです' : '接続エラー'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {isOffline 
            ? 'インターネット接続を確認してください'
            : 'サーバーに接続できませんでした。しばらく時間をおいてから再度お試しください。'
          }
        </Typography>

        <Button 
          variant="contained" 
          startIcon={<Refresh />}
          onClick={onRetry}
        >
          再試行
        </Button>
      </Card>
    </Box>
  );
}

// 検索結果なし
interface NoSearchResultsProps {
  query?: string;
  onClearSearch?: () => void;
  onBrowseAll?: () => void;
}

export function NoSearchResults({ 
  query, 
  onClearSearch, 
  onBrowseAll 
}: NoSearchResultsProps) {
  const theme = useTheme();

  return (
    <Box py={4}>
      <Card sx={{ textAlign: 'center', p: 4 }}>
        <Search sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          検索結果が見つかりません
        </Typography>
        
        {query && (
          <Typography variant="body1" color="text.secondary" paragraph>
            「<strong>{query}</strong>」に一致する投稿が見つかりませんでした
          </Typography>
        )}
        
        <Typography variant="body2" color="text.secondary" paragraph>
          別のキーワードで検索するか、すべての投稿を見てみましょう
        </Typography>

        <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
          {onClearSearch && (
            <Button variant="outlined" onClick={onClearSearch}>
              検索をクリア
            </Button>
          )}
          
          {onBrowseAll && (
            <Button variant="contained" onClick={onBrowseAll}>
              すべての投稿を見る
            </Button>
          )}
        </Box>
      </Card>
    </Box>
  );
}

// フォロー中の人がいない状態
export function NoFollowing() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box py={4}>
      <Card sx={{ textAlign: 'center', p: 4 }}>
        <PersonAdd sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          まだ誰もフォローしていません
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          興味のある人をフォローして、タイムラインを充実させましょう
        </Typography>

        <Button 
          variant="contained" 
          startIcon={<Explore />}
          onClick={() => router.push('/board')}
          size="large"
        >
          ユーザーを探す
        </Button>
      </Card>
    </Box>
  );
}

// ローディング失敗
interface LoadingFailedProps {
  onRetry?: () => void;
  message?: string;
}

export function LoadingFailed({ onRetry, message }: LoadingFailedProps) {
  const theme = useTheme();

  return (
    <Box py={4}>
      <Card sx={{ textAlign: 'center', p: 4 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: theme.palette.warning.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3
          }}
        >
          <TrendingUp sx={{ fontSize: 40, color: theme.palette.warning.main }} />
        </Box>
        
        <Typography variant="h5" gutterBottom>
          読み込みに失敗しました
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {message || 'データの読み込み中にエラーが発生しました'}
        </Typography>

        <Button 
          variant="contained" 
          startIcon={<Refresh />}
          onClick={onRetry}
        >
          再読み込み
        </Button>
      </Card>
    </Box>
  );
}

// 権限なし
export function Unauthorized() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box py={4}>
      <Card sx={{ textAlign: 'center', p: 4 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: theme.palette.warning.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3
          }}
        >
          <Typography variant="h3" fontWeight="bold" color="warning.main">
            ⚠️
          </Typography>
        </Box>
        
        <Typography variant="h5" gutterBottom>
          アクセス権限がありません
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          この機能を利用するにはログインが必要です
        </Typography>

        <Button 
          variant="contained" 
          onClick={() => router.push('/login')}
        >
          ログイン
        </Button>
      </Card>
    </Box>
  );
}