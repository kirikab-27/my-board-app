'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  Divider,
  Button,
  Collapse,
  Alert,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Search,
  Clear,
  History,
  TrendingUp,
  Tag as TagIcon,
  Verified,
  FilterList,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

interface SearchResult {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  stats: {
    totalPosts: number;
    totalComments: number;
    uniqueUsers: number;
    trendScore: number;
  };
  isTrending: boolean;
  isOfficial: boolean;
  searchScore?: number;
}

interface SearchStats {
  query: string;
  normalizedQuery: string;
  resultCount: number;
  searchType: string;
  category: string;
  timestamp: Date;
}

interface RelatedKeyword {
  name: string;
  displayName: string;
}

interface HashtagSearchProps {
  placeholder?: string;
  showHistory?: boolean;
  showFilters?: boolean;
  showRelated?: boolean;
  maxResults?: number;
  autoSearch?: boolean;
  exactMatchFirst?: boolean;
  onResultSelect?: (hashtag: SearchResult) => void;
  onSearchChange?: (query: string, results: SearchResult[]) => void;
}

export default function HashtagSearch({
  placeholder = 'ハッシュタグを検索...',
  showHistory = true,
  showFilters = false,
  showRelated = true,
  maxResults = 20,
  autoSearch = true,
  exactMatchFirst = true,
  onResultSelect,
  onSearchChange
}: HashtagSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [relatedKeywords, setRelatedKeywords] = useState<RelatedKeyword[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [category, setCategory] = useState('all');
  const [exactMatch, setExactMatch] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 検索履歴を localStorage から読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem('hashtag-search-history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 検索実行
  const performSearch = async (searchQuery: string, options: { exact?: boolean; category?: string } = {}) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearchStats(null);
      setRelatedKeywords([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        limit: maxResults.toString(),
        exact: (options.exact || exactMatch).toString(),
        category: options.category || category
      });

      const response = await fetch(`/api/hashtags/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '検索に失敗しました');
      }

      const searchResults = data.hashtags || [];
      
      // 完全一致を最初に表示
      if (exactMatchFirst && !options.exact) {
        searchResults.sort((a: SearchResult, b: SearchResult) => {
          const aExact = a.name === searchQuery.toLowerCase() || a.displayName.toLowerCase() === searchQuery.toLowerCase();
          const bExact = b.name === searchQuery.toLowerCase() || b.displayName.toLowerCase() === searchQuery.toLowerCase();
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return (b.searchScore || 0) - (a.searchScore || 0);
        });
      }

      setResults(searchResults);
      setSearchStats(data.searchStats);
      setRelatedKeywords(data.relatedKeywords || []);
      setShowResults(true);

      // コールバック実行
      if (onSearchChange) {
        onSearchChange(searchQuery, searchResults);
      }

      // 検索履歴に追加
      if (searchQuery.trim().length > 0) {
        const newHistory = [
          searchQuery.trim(),
          ...searchHistory.filter(item => item !== searchQuery.trim())
        ].slice(0, 10);
        
        setSearchHistory(newHistory);
        localStorage.setItem('hashtag-search-history', JSON.stringify(newHistory));
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : '検索エラーが発生しました');
      console.error('ハッシュタグ検索エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // デバウンス付き自動検索
  useEffect(() => {
    if (!autoSearch) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, category, exactMatch, autoSearch]);

  // 入力変更処理
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    
    if (!value.trim()) {
      setShowResults(false);
    }
  };

  // 検索実行（手動）
  const handleSearch = () => {
    performSearch(query);
  };

  // エンターキー処理
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  // 結果選択処理
  const handleResultSelect = (hashtag: SearchResult) => {
    setShowResults(false);
    setQuery(`#${hashtag.displayName}`);
    
    if (onResultSelect) {
      onResultSelect(hashtag);
    }
  };

  // 履歴選択処理
  const handleHistorySelect = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistoryPanel(false);
    performSearch(historyQuery);
  };

  // 関連キーワード選択処理
  const handleRelatedSelect = (keyword: RelatedKeyword) => {
    setQuery(keyword.name);
    performSearch(keyword.name);
  };

  // クリア処理
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearchStats(null);
    setShowResults(false);
    inputRef.current?.focus();
  };

  // 履歴クリア
  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('hashtag-search-history');
    setShowHistoryPanel(false);
  };

  // 外部クリック処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false);
        setShowHistoryPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* 検索フィールド */}
      <TextField
        ref={inputRef}
        fullWidth
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={() => {
          if (query.trim() && results.length > 0) {
            setShowResults(true);
          } else if (showHistory && searchHistory.length > 0) {
            setShowHistoryPanel(true);
          }
        }}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton onClick={handleSearch} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : <Search />}
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {query && (
                <IconButton onClick={handleClear} size="small">
                  <Clear />
                </IconButton>
              )}
              {showHistory && searchHistory.length > 0 && (
                <Tooltip title="検索履歴">
                  <IconButton 
                    onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                    size="small"
                  >
                    <Badge badgeContent={searchHistory.length} color="primary">
                      <History />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}
            </InputAdornment>
          )
        }}
      />

      {/* フィルター */}
      {showFilters && (
        <Collapse in={showResults || showHistoryPanel}>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
            <FilterList fontSize="small" />
            <Chip 
              label="完全一致"
              size="small"
              clickable
              color={exactMatch ? 'primary' : 'default'}
              onClick={() => setExactMatch(!exactMatch)}
            />
            <Chip 
              label={category === 'all' ? '全カテゴリ' : category}
              size="small"
              clickable
              onClick={() => {
                // カテゴリ選択UI（簡易版）
                const categories = ['all', 'technology', 'entertainment', 'sports', 'news', 'lifestyle', 'business'];
                const currentIndex = categories.indexOf(category);
                const nextIndex = (currentIndex + 1) % categories.length;
                setCategory(categories[nextIndex]);
              }}
            />
          </Box>
        </Collapse>
      )}

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {/* 検索結果 */}
      {showResults && (
        <Paper 
          ref={resultsRef}
          sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            mt: 1, 
            maxHeight: 400, 
            overflow: 'auto',
            zIndex: 1300
          }}
        >
          {results.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                「{query}」の検索結果が見つかりませんでした
              </Typography>
            </Box>
          ) : (
            <>
              {/* 統計情報 */}
              {searchStats && (
                <Box sx={{ p: 1, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    {searchStats.resultCount}件の結果が見つかりました
                    {searchStats.searchType === 'exact' && ' (完全一致)'}
                  </Typography>
                </Box>
              )}

              <List>
                {results.map((hashtag, index) => (
                  <ListItem
                    key={hashtag._id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleResultSelect(hashtag)}
                    divider={index < results.length - 1}
                  >
                    <ListItemIcon>
                      <TagIcon color={hashtag.isTrending ? 'error' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Typography variant="subtitle2" component="span">
                            #{hashtag.displayName}
                          </Typography>
                          {hashtag.isOfficial && <Verified fontSize="small" color="primary" />}
                          {hashtag.isTrending && <TrendingUp fontSize="small" color="error" />}
                          {hashtag.searchScore && (
                            <Chip 
                              label={hashtag.searchScore.toFixed(0)}
                              size="small"
                              color="primary"
                            />
                          )}
                        </span>
                      }
                      secondary={
                        <span>
                          {hashtag.description && (
                            <Typography variant="body2" color="text.secondary" component="span">
                              {hashtag.description}
                            </Typography>
                          )}
                          <span style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                            <Typography variant="caption" color="text.secondary" component="span">
                              {hashtag.stats.totalPosts}件の投稿
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="span">
                              {hashtag.stats.uniqueUsers}人のユーザー
                            </Typography>
                            <Chip label={hashtag.category} size="small" />
                          </span>
                        </span>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {/* 関連キーワード */}
              {showRelated && relatedKeywords.length > 0 && (
                <>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      関連する検索:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                      {relatedKeywords.map((keyword, index) => (
                        <Chip
                          key={index}
                          label={`#${keyword.displayName}`}
                          size="small"
                          clickable
                          onClick={() => handleRelatedSelect(keyword)}
                        />
                      ))}
                    </Box>
                  </Box>
                </>
              )}
            </>
          )}
        </Paper>
      )}

      {/* 検索履歴 */}
      {showHistoryPanel && searchHistory.length > 0 && (
        <Paper 
          ref={resultsRef}
          sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            mt: 1, 
            maxHeight: 300, 
            overflow: 'auto',
            zIndex: 1300
          }}
        >
          <Box sx={{ p: 1, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              検索履歴
            </Typography>
            <Button size="small" onClick={handleClearHistory}>
              履歴をクリア
            </Button>
          </Box>
          
          <List>
            {searchHistory.map((historyItem, index) => (
              <ListItem
                key={index}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleHistorySelect(historyItem)}
              >
                <ListItemIcon>
                  <History fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={historyItem} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}