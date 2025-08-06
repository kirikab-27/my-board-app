'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import PostForm from '@/components/PostForm';
import PostList from '@/components/PostList';
import SearchBar from '@/components/SearchBar';
import SortSelector, { SortOption } from '@/components/SortSelector';
import Pagination from '@/components/Pagination';
import { convertSortOption } from '@/utils/sortUtils';

interface Post {
  _id: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [searchPagination, setSearchPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchPosts = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setError('');
      const { sortBy, sortOrder } = convertSortOption(sortOption);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/posts?${params}`);
      
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }
      
      const data = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [sortOption]);

  useEffect(() => {
    fetchPosts(1, pagination.limit);
  }, [fetchPosts, pagination.limit]);

  // sortOptionが変更されたときの処理は、handleSortChangeで処理するため削除

  const handlePostCreated = useCallback(() => {
    // 新しい投稿が作成されたら、最初のページに戻る
    if (isSearchMode) {
      setIsSearchMode(false);
      setSearchQuery('');
    }
    fetchPosts(1, pagination.limit);
  }, [isSearchMode, pagination.limit, fetchPosts]);

  const handleEditPost = useCallback((post: Post) => {
    setEditingPost(post);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingPost(null);
  }, []);

  const handleSearch = useCallback(async (query: string, page: number = 1, limit: number = 10) => {
    setSearchQuery(query);
    setSearchLoading(true);
    setError('');

    try {
      const { sortBy, sortOrder } = convertSortOption(sortOption);
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/posts/search?${params}`);
      
      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }
      
      const data = await response.json();
      setSearchResults(data.posts);
      setSearchPagination(data.pagination);
      setIsSearchMode(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : '検索に失敗しました');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [sortOption]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
    setError('');
  }, []);


  const handleSortChange = useCallback((newSortOption: SortOption) => {
    setSortOption(newSortOption);
    // ソート方法が変更されたら、現在のページを1に戻して再取得
    if (isSearchMode && searchQuery) {
      handleSearch(searchQuery, 1, searchPagination.limit);
    } else {
      fetchPosts(1, pagination.limit);
    }
  }, [isSearchMode, searchQuery, searchPagination.limit, pagination.limit, handleSearch, fetchPosts]);

  const handlePageChange = useCallback((page: number) => {
    if (isSearchMode && searchQuery) {
      handleSearch(searchQuery, page, searchPagination.limit);
    } else {
      fetchPosts(page, pagination.limit);
    }
  }, [isSearchMode, searchQuery, searchPagination.limit, pagination.limit, handleSearch, fetchPosts]);

  const handleLimitChange = useCallback((limit: number) => {
    if (isSearchMode && searchQuery) {
      setSearchPagination(prev => ({ ...prev, limit }));
      handleSearch(searchQuery, 1, limit);
    } else {
      setPagination(prev => ({ ...prev, limit }));
      fetchPosts(1, limit);
    }
  }, [isSearchMode, searchQuery, handleSearch, fetchPosts]);


  // SearchBarコンポーネント用のラッパー関数
  const handleSearchQuery = useCallback((query: string) => {
    handleSearch(query, 1, searchPagination.limit);
  }, [handleSearch, searchPagination.limit]);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            掲示板アプリ
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <PostForm 
          onPostCreated={handlePostCreated}
          editingPost={editingPost}
          onEditCancel={handleEditCancel}
        />

        <SearchBar
          onSearch={handleSearchQuery}
          onClear={handleClearSearch}
          loading={searchLoading}
          resultCount={isSearchMode ? searchPagination.totalCount : undefined}
        />

        {/* ヘッダーセクション：タイトル・並び替え・ページネーション */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
          mb: 2 
        }}>
          {/* 左側：タイトル */}
          <Typography variant="h5" sx={{ 
            order: { xs: 1, sm: 1 },
            alignSelf: { xs: 'flex-start', sm: 'center' }
          }}>
            {isSearchMode ? '検索結果' : '投稿一覧'}
          </Typography>

          {/* 右側：並び替えとページネーション */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            order: { xs: 2, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
          }}>
            <SortSelector 
              value={sortOption}
              onChange={handleSortChange}
            />
            <Pagination
              pagination={isSearchMode ? searchPagination : pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <PostList 
            posts={isSearchMode ? searchResults : posts}
            onRefresh={handlePostCreated}
            onEditPost={handleEditPost}
            searchQuery={isSearchMode ? searchQuery : undefined}
          />
        )}
      </Container>
    </>
  );
}
