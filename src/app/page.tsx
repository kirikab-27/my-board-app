'use client';

import React, { useState, useEffect } from 'react';
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

interface Post {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);

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

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
  };

  const handleEditCancel = () => {
    setEditingPost(null);
  };

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

        <Typography variant="h5" gutterBottom>
          投稿一覧
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
            posts={posts}
            onRefresh={fetchPosts}
            onEditPost={handleEditPost}
          />
        )}
      </Container>
    </>
  );
}
