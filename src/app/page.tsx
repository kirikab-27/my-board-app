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

interface Post {
  _id: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
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

  const fetchPosts = async () => {
    try {
      setError('');
      const response = await fetch('/api/posts');
      
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }
      
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = useCallback(() => {
    fetchPosts();
  }, []);

  const handleEditPost = useCallback((post: Post) => {
    setEditingPost(post);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingPost(null);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setSearchLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }
      
      const data = await response.json();
      setSearchResults(data.posts);
      setIsSearchMode(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : '検索に失敗しました');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
    setError('');
  }, []);

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
          onSearch={handleSearch}
          onClear={handleClearSearch}
          loading={searchLoading}
          resultCount={isSearchMode ? searchResults.length : undefined}
        />

        <Typography variant="h5" gutterBottom>
          {isSearchMode ? '検索結果' : '投稿一覧'}
        </Typography>

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
            onRefresh={fetchPosts}
            onEditPost={handleEditPost}
            searchQuery={isSearchMode ? searchQuery : undefined}
          />
        )}
      </Container>
    </>
  );
}
