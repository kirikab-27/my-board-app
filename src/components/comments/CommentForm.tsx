'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useSession } from 'next-auth/react';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onSubmit?: (comment: any) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export default function CommentForm({
  postId,
  parentId,
  placeholder = 'コメントを入力してください...',
  onSubmit,
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      setError('ログインが必要です');
      return;
    }

    if (!content.trim()) {
      setError('コメント内容を入力してください');
      return;
    }

    if (content.length > 500) {
      setError('コメントは500文字以内で入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          postId,
          parentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'コメントの投稿に失敗しました');
      }

      setContent('');
      if (onSubmit) {
        onSubmit(data.comment);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setError('');
    if (onCancel) {
      onCancel();
    }
  };

  if (!session) {
    return (
      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          コメントするにはログインが必要です
        </Typography>
      </Paper>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        multiline
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        autoFocus={autoFocus}
        inputProps={{
          maxLength: 500,
        }}
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {content.length}/500文字
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onCancel && (
            <Button variant="outlined" onClick={handleCancel} disabled={loading} size="small">
              キャンセル
            </Button>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={loading || !content.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            size="small"
          >
            {loading ? '投稿中...' : parentId ? '返信' : 'コメント'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
