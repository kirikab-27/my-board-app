'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  AppBar,
  Toolbar,
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Fade,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AuthButton } from '@/components/auth/AuthButton';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio: string;
  location?: string;
  website?: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  createdAt: string;
}

interface SearchResponse {
  users: User[];
  suggestedUsers: User[];
  searchMeta: {
    query: string;
    normalizedQuery: string;
    filter: string;
    sortBy: string;
    hasResults: boolean;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string; // エラーメッセージ（エラー時のみ）
}

export default function UserSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [users, setUsers] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);
  
  // フィルター設定
  const [sortBy, setSortBy] = useState('relevance');
  const [filter, setFilter] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // 初期データ読み込み
  useEffect(() => {
    loadSearchHistory();
    if (!searchQuery) {
      // 検索なしの場合はおすすめユーザーを表示
      performSearch('', 1);
    }
  }, []);

  // URL パラメータからの検索実行
  useEffect(() => {
    const q = searchParams?.get('q');
    if (q && q !== searchQuery) {
      setSearchQuery(q);
      performSearch(q, 1);
    }
  }, [searchParams]);

  // ソート・フィルター変更時の再検索
  useEffect(() => {
    // 初期化時は実行しない
    if (sortBy !== 'relevance' || filter !== 'all') {
      performSearch(searchQuery, 1);
    }
  }, [sortBy, filter]);

  // 検索実行関数
  const performSearch = useCallback(async (query: string, page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: '20',
        sortBy,
        filter
      });
      
      const response = await fetch(`/api/users?${params}`);
      const data: SearchResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'ユーザー検索に失敗しました');
      }
      
      if (page === 1) {
        setUsers(data.users);
      } else {
        setUsers(prev => [...prev, ...data.users]);
      }
      
      setSuggestedUsers(data.suggestedUsers || []);
      setSearchMeta(data.searchMeta);
      setPagination(data.pagination);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー検索に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [sortBy, filter]);

  // 入力ハンドラー（検索実行なし）
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setShowSearchHistory(value.length === 0);
  };

  // 検索実行ハンドラー
  const executeSearch = () => {
    performSearch(searchQuery, 1);
    if (searchQuery) {
      // URL更新
      router.replace(`/users/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.replace('/users/search');
    }
    setShowSearchHistory(false);
  };

  // エンターキー押下時の処理
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      executeSearch();
    }
  };

  // 検索履歴読み込み
  const loadSearchHistory = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSearchHistory' })
      });
      const data = await response.json();
      setSearchHistory(data.history || []);
    } catch (error) {
      console.error('検索履歴読み込みエラー:', error);
    }
  };

  // 検索履歴クリア
  const clearSearchHistory = async () => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearSearchHistory' })
      });
      setSearchHistory([]);
    } catch (error) {
      console.error('検索履歴クリアエラー:', error);
    }
  };

  // フィルターメニュー
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // ユーザーカードクリックハンドラー
  const handleUserCardClick = (user: User) => {
    // usernameが存在しない場合の安全チェック
    if (!user.username) {
      console.error('ユーザー名が設定されていません:', user);
      return;
    }
    
    // 現在の検索クエリをsessionStorageに保存
    if (searchQuery) {
      sessionStorage.setItem('lastSearchQuery', searchQuery);
    }
    
    // ユーザー投稿一覧ページに遷移
    router.push(`/users/${user.username}/posts`);
  };

  // ユーザーカードコンポーネント
  const UserCard = ({ user }: { user: User }) => (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
          bgcolor: 'action.hover'
        }
      }}
      onClick={() => handleUserCardClick(user)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {user.avatar ? (
          <Avatar
            src={user.avatar}
            alt={user.displayName}
            sx={{ width: 56, height: 56 }}
          />
        ) : (
          <ProfileAvatar 
            name={user.displayName} 
            size="medium" 
          />
        )}
        
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" component="h3">
              {user.displayName}
            </Typography>
            {user.isVerified && (
              <Chip label="認証済み" size="small" color="primary" />
            )}
            {user.isOnline && (
              <Chip label="オンライン" size="small" color="success" />
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            @{user.username}
          </Typography>
          
          {user.bio && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {user.bio}
            </Typography>
          )}
          
          {user.location && (
            <Typography variant="caption" color="text.secondary">
              📍 {user.location}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Typography variant="caption">
              <strong>{user.stats.postsCount}</strong> 投稿
            </Typography>
            <Typography variant="caption">
              <strong>{user.stats.followersCount}</strong> フォロワー
            </Typography>
            <Typography variant="caption">
              <strong>{user.stats.followingCount}</strong> フォロー中
            </Typography>
          </Box>
        </Box>
        
        {/* 投稿表示インジケーター */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            投稿を見る
          </Typography>
          <Typography variant="h4" color="action">
            →
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  if (!session) {
    return (
      <>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              ユーザー検索
            </Typography>
            <AuthButton />
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: { xs: 14, sm: 16, md: 16 } }}>
          <Alert severity="info">
            ユーザー検索を利用するにはログインが必要です。
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton 
            component={Link} 
            href="/users" 
            edge="start" 
            color="inherit" 
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ユーザー検索
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 14, sm: 16, md: 16 }, mb: 4 }}>
        {/* 検索バー */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="ユーザーを検索してEnterキーを押してください (@username, 名前, 自己紹介)"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton onClick={executeSearch} size="small">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {loading && <CircularProgress size={20} />}
                    {searchQuery && (
                      <IconButton 
                        onClick={() => {
                          handleSearchInput('');
                          router.replace('/users/search');
                          performSearch('', 1);
                        }}
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
            />
            
            <IconButton onClick={handleFilterClick}>
              <FilterListIcon />
            </IconButton>
          </Box>
          
          {/* フィルター・ソート */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>並び順</InputLabel>
              <Select
                value={sortBy}
                label="並び順"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="relevance">関連度</MenuItem>
                <MenuItem value="followers">フォロワー数</MenuItem>
                <MenuItem value="recent">登録順</MenuItem>
                <MenuItem value="active">アクティブ</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>フィルター</InputLabel>
              <Select
                value={filter}
                label="フィルター"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="verified">認証済みのみ</MenuItem>
                <MenuItem value="online">オンラインのみ</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* 検索履歴・提案 */}
        {showSearchHistory && searchHistory.length > 0 && (
          <Fade in={showSearchHistory}>
            <Paper sx={{ mb: 3 }}>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon fontSize="small" />
                    最近の検索
                  </Typography>
                  <IconButton size="small" onClick={clearSearchHistory}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {searchHistory.slice(0, 5).map((term, index) => (
                    <Chip
                      key={index}
                      label={term}
                      size="small"
                      onClick={() => {
                        setSearchQuery(term);
                        setShowSearchHistory(false);
                        performSearch(term, 1);
                        router.replace(`/users/search?q=${encodeURIComponent(term)}`);
                      }}
                      clickable
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          </Fade>
        )}

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 検索結果メタ情報 */}
        {searchMeta && searchQuery && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              &quot;{searchMeta.query}&quot; の検索結果
              {pagination && (
                <> - {pagination.totalCount}件のユーザーが見つかりました</>
              )}
            </Typography>
          </Paper>
        )}

        {/* おすすめユーザー */}
        {!searchQuery && suggestedUsers.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <TrendingUpIcon />
              おすすめユーザー
            </Typography>
            {suggestedUsers.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </Box>
        )}

        {/* 検索結果 */}
        {searchQuery && (
          <Box>
            <Typography variant="h6" gutterBottom>
              検索結果
            </Typography>
            {users.length === 0 && !loading ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  検索結果が見つかりませんでした
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  別のキーワードで検索してみてください
                </Typography>
              </Paper>
            ) : (
              users.map((user) => (
                <UserCard key={user._id} user={user} />
              ))
            )}
            
            {/* もっと読み込みボタン */}
            {pagination && pagination.hasNextPage && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <button
                  onClick={() => performSearch(searchQuery, pagination.currentPage + 1)}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Loading...' : 'もっと見る'}
                </button>
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* フィルターメニュー */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => { setSortBy('relevance'); handleFilterClose(); }}>
          関連度順
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('followers'); handleFilterClose(); }}>
          フォロワー数順
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('recent'); handleFilterClose(); }}>
          新規登録順
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('active'); handleFilterClose(); }}>
          アクティブ順
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setFilter('all'); handleFilterClose(); }}>
          すべてのユーザー
        </MenuItem>
        <MenuItem onClick={() => { setFilter('verified'); handleFilterClose(); }}>
          認証済みのみ
        </MenuItem>
        <MenuItem onClick={() => { setFilter('online'); handleFilterClose(); }}>
          オンラインのみ
        </MenuItem>
      </Menu>
    </>
  );
}