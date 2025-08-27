'use client';

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { MentionInput, extractMentions } from '../mention';

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
  const [extractedMentions, setExtractedMentions] = useState<string[]>([]);

  // コンテンツからメンションを自動抽出
  useEffect(() => {
    const mentions = extractMentions(content);
    setExtractedMentions(mentions);
  }, [content]);

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

      // メンション通知送信
      if (extractedMentions.length > 0) {
        try {
          await fetch('/api/mentions/notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mentionedUsernames: extractedMentions,
              postId,
              commentId: data.comment._id,
              content: content,
              type: 'mention_comment'
            }),
          });
        } catch (mentionError) {
          console.warn('メンション通知の送信に失敗しました:', mentionError);
          // メンション通知の失敗はコメント投稿を失敗させない
        }
      }

      setContent('');
      setExtractedMentions([]);
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
    setExtractedMentions([]);
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

      {/* メンション対応コメント入力 */}
      <MentionInput
        value={content}
        onChange={(newContent) => setContent(newContent)}
        onSearch={async (query: string) => {
          if (query.length < 1) return [];
          try {
            const response = await fetch(`/api/users/search-mentions?q=${encodeURIComponent(query)}&limit=5`);
            const data = await response.json();
            return data.users || [];
          } catch (error) {
            console.error('Mention search error:', error);
            return [];
          }
        }}
        placeholder={`${placeholder}... (@でユーザーをメンション)`}
        disabled={loading}
        minRows={3}
        maxRows={6}
        autoFocus={autoFocus}
        error={content.length > 500}
        helperText={`${content.length}/500文字${extractedMentions.length > 0 ? ` • ${extractedMentions.length}個のメンション` : ''}`}
        sx={{ mb: 2 }}
      />

      {/* 検出されたメンション表示 */}
      {extractedMentions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            🏷️ メンション: {extractedMentions.map(mention => `@${mention}`).join(', ')}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 1,
        }}
      >

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
