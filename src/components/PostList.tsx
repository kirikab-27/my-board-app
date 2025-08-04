'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { MoreVert, Edit, Delete } from '@mui/icons-material';

interface Post {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface PostListProps {
  posts: Post[];
  onRefresh: () => void;
  onEditPost: (post: Post) => void;
}

export default function PostList({ posts, onRefresh, onEditPost }: PostListProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  console.log('PostList レンダリング:', posts.length, '件の投稿');

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, post: Post) => {
    console.log('メニューがクリックされました:', post._id);
    setAnchorEl(event.currentTarget);
    setSelectedPost(post);
  };

  const handleMenuClose = () => {
    console.log('メニューを閉じます');
    setAnchorEl(null);
    setSelectedPost(null);
  };

  const handleEdit = () => {
    console.log('編集がクリックされました:', selectedPost?._id);
    if (selectedPost) {
      onEditPost(selectedPost);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    console.log('削除がクリックされました:', selectedPost?._id);
    setPostToDelete(selectedPost);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) {
      console.error('削除対象の投稿が選択されていません');
      return;
    }

    console.log('削除開始:', postToDelete._id);
    setIsDeleting(true);
    setError('');

    try {
      console.log(`削除API呼び出し: /api/posts/${postToDelete._id}`);
      const response = await fetch(`/api/posts/${postToDelete._id}`, {
        method: 'DELETE',
      });

      console.log('削除APIレスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('削除APIエラー:', errorData);
        throw new Error(errorData.error || '削除に失敗しました');
      }

      const result = await response.json();
      console.log('削除成功:', result);
      
      onRefresh();
      console.log('投稿一覧を更新中...');
    } catch (error) {
      console.error('削除処理エラー:', error);
      setError(error instanceof Error ? error.message : '削除に失敗しました');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      console.log('削除処理完了');
    }
  };

  const handleDeleteCancel = () => {
    console.log('削除がキャンセルされました');
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
  };

  if (posts.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" textAlign="center">
        まだ投稿がありません
      </Typography>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {posts.map((post) => (
        <Paper key={post._id} elevation={1} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                {post.content}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                投稿日時: {formatDate(post.createdAt)}
                {post.updatedAt !== post.createdAt && (
                  <> (更新: {formatDate(post.updatedAt)})</>
                )}
              </Typography>
            </Box>
            
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, post)}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Paper>
      ))}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          編集
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <Delete sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>投稿を削除</DialogTitle>
        <DialogContent>
          <Typography>
            この投稿を削除してもよろしいですか？
          </Typography>
          {postToDelete && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, whiteSpace: 'pre-wrap' }}>
              &ldquo;{postToDelete.content}&rdquo;
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}