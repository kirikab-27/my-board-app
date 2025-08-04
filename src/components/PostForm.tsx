'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from '@mui/material';

interface PostFormProps {
  onPostCreated: () => void;
  editingPost?: {
    _id: string;
    content: string;
  } | null;
  onEditCancel?: () => void;
}

export default function PostForm({ onPostCreated, editingPost, onEditCancel }: PostFormProps) {
  const [content, setContent] = useState(editingPost?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content);
    } else {
      setContent('');
    }
  }, [editingPost]);

  // クールダウンタイマー
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('投稿内容を入力してください');
      return;
    }

    if (content.length > 200) {
      setError('投稿は200文字以内で入力してください');
      return;
    }

    // 編集の場合はクールダウンをスキップ
    if (!editingPost) {
      const now = Date.now();
      const timeSinceLastSubmit = now - lastSubmitTime;
      const cooldownPeriod = 30 * 1000; // 30秒

      if (timeSinceLastSubmit < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastSubmit) / 1000);
        setCooldownRemaining(remainingSeconds);
        setError(`連続投稿を防ぐため、${remainingSeconds}秒後に再度お試しください`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const url = editingPost 
        ? `/api/posts/${editingPost._id}`
        : '/api/posts';
      
      const method = editingPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '投稿に失敗しました');
      }

      setContent('');
      // 新規投稿の場合のみ最終投稿時刻を更新
      if (!editingPost) {
        setLastSubmitTime(Date.now());
      }
      onPostCreated();
      if (onEditCancel) {
        onEditCancel();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setError('');
    if (onEditCancel) {
      onEditCancel();
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {editingPost ? '投稿を編集' : '新しい投稿'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="投稿内容を入力してください（200文字以内）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={content.length > 200}
          helperText={`${content.length}/200文字`}
          sx={{ mb: 2 }}
        />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || content.length > 200 || cooldownRemaining > 0}
          >
            {isSubmitting ? '投稿中...' : cooldownRemaining > 0 ? `待機中 (${cooldownRemaining}s)` : editingPost ? '更新' : '投稿'}
          </Button>
          
          {editingPost && (
            <Button
              type="button"
              variant="outlined"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}